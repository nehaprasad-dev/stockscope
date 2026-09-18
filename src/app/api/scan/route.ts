import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ScanQuotaError,
  assertFreeScanAvailable,
  recordUserScan,
} from "@/auth/quota";
import { ensureAppUser } from "@/auth/ensureUser";
import { runScan } from "@/scans/runScan";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      return Response.json(
        { error: scan.error ?? "Scan failed", scan: { ...scan, creditsUrl: undefined } },
        { status: 502 },
      );
    }
    return Response.json({ scan: { ...scan, creditsUrl: undefined } });
  } catch (error) {
    if (error instanceof ScanQuotaError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
