import { z } from "zod";
import { ensureDb } from "@/db/ensure";
import { latestScan, runningScan } from "@/db/scans";
import { runScan } from "@/scans/runScan";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  shortlistSize: z.number().int().min(1).max(50).optional(),
});

export async function GET() {
  try {
    await ensureDb();
    const [running, latest] = await Promise.all([runningScan(), latestScan()]);
    return Response.json({ running, latest });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not read scan status" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const json = await request.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid scan request" }, { status: 400 });
    }
    if (process.env.VERCEL && (parsed.data.limit ?? 10) > 10) {
      return Response.json(
        {
          error:
            "Vercel serverless functions time out on a full 500 scan. Use 1 or 10 stocks here, or run 50/500 locally.",
        },
        { status: 400 },
      );
    }
    const scan = await runScan(parsed.data);
    return Response.json({ scan });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan could not finish." },
      { status: 500 },
    );
  }
}
