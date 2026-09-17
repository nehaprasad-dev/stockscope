import { runScan } from "@/scans/runScan";
import { VaayaRequiredError } from "@/research/vaaya";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json({
    message: "POST to run a full Nifty 500 scan. Vaaya research runs on the shortlist.",
  });
}

export async function POST() {
  try {
    const scan = await runScan();
    if (scan.status === "failed") {
      const status = scan.creditsUrl ? 402 : 500;
      return Response.json(
        { error: scan.error ?? "Scan failed", creditsUrl: scan.creditsUrl, scan },
        { status },
      );
    }
    return Response.json({ scan });
  } catch (error) {
    if (error instanceof VaayaRequiredError) {
      return Response.json(
        { error: error.message, creditsUrl: error.creditsUrl },
        { status: 402 },
      );
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
