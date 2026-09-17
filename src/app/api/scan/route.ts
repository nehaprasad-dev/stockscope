import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ScanQuotaError,
  assertFreeScanAvailable,
  recordUserScan,
} from "@/auth/quota";
import { ensureAppUser } from "@/auth/ensureUser";
import { runScan } from "@/scans/runScan";
import { VaayaRequiredError } from "@/research/vaaya";

export const runtime = "nodejs";
export const maxDuration = 60;

const UNAVAILABLE =
  "Research is temporarily unavailable. Try again later — this product is free, so you are not asked to pay.";

export async function GET() {
  return Response.json({
    message:
      "POST to run a full Nifty 500 scan. Sign in first. Vaaya runs in the background on the operator wallet.",
  });
}

export async function POST() {
  const { userId } = await auth();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!userId || !email) {
    return Response.json(
      { error: "Continue with Google to scan. Access is free." },
      { status: 401 },
    );
  }

  await ensureAppUser({
    id: userId,
    email,
    name: user.fullName,
    image: user.imageUrl,
  });

  try {
    await assertFreeScanAvailable(userId);
    const scan = await runScan({ userId });
    await recordUserScan(userId, scan.status);
    if (scan.status === "failed") {
      const operatorIssue = Boolean(scan.creditsUrl);
      return Response.json(
        {
          error: operatorIssue ? UNAVAILABLE : (scan.error ?? "Scan failed"),
          scan: { ...scan, creditsUrl: undefined },
        },
        { status: operatorIssue ? 503 : 502 },
      );
    }
    return Response.json({ scan: { ...scan, creditsUrl: undefined } });
  } catch (error) {
    if (error instanceof ScanQuotaError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof VaayaRequiredError) {
      return Response.json({ error: UNAVAILABLE }, { status: 503 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
