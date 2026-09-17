import { runScan } from "@/scans/runScan";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json({
    message: "POST to run a full Nifty 500 scan. Results are returned in the response body.",
  });
}

export async function POST() {
  try {
    const scan = await runScan();
    if (scan.status === "failed") {
      return Response.json({ error: scan.error ?? "Scan failed", scan }, { status: 500 });
    }
    return Response.json({ scan });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
