import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureAppUser } from "@/auth/ensureUser";
import { runScan } from "@/scans/runScan";
import { readScanCache, writeScanCache } from "@/scans/scanCache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json({
    message:
      "POST to run a Nifty 500 scan. Sign in first. Vaaya is off; results are cached for everyone.",
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
    const cached = readScanCache();
    if (cached) {
      return Response.json({ scan: { ...cached, creditsUrl: undefined } });
    }

    const scan = await runScan();
    if (scan.status === "failed") {
      return Response.json(
        { error: scan.error ?? "Scan failed", scan: { ...scan, creditsUrl: undefined } },
        { status: 502 },
      );
    }
    writeScanCache(scan);
    return Response.json({ scan: { ...scan, creditsUrl: undefined } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
