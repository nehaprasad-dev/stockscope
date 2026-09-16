import { z } from "zod";
import { latestScan, runningScan } from "@/db/scans";
import { runScan } from "@/scans/runScan";

export const maxDuration = 300;

const Body = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  shortlistSize: z.number().int().min(1).max(50).optional(),
});

export async function GET() {
  const [running, latest] = await Promise.all([runningScan(), latestScan()]);
  return Response.json({ running, latest });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid scan request" }, { status: 400 });
  }
  const scan = await runScan(parsed.data);
  return Response.json({ scan });
}
