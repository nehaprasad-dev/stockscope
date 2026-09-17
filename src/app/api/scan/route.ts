import { z } from "zod";
import { runScan } from "@/scans/runScan";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  shortlistSize: z.number().int().min(1).max(50).optional(),
});

export async function GET() {
  return Response.json({
    message: "POST to run a scan. Results are returned in the response body.",
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid scan request" }, { status: 400 });
    }
    const scan = await runScan(parsed.data);
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
