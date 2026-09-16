import { latestScan } from "@/db/scans";
import { ensureDb } from "@/db/ensure";
import { latestSnapshots, snapshotsForScan } from "@/db/snapshots";
import { countStocks } from "@/db/stocks";
import type { RankedStock } from "@/research/types";
import { rankStocks } from "@/scoring/rankStocks";

function toRow(snapshot: Awaited<ReturnType<typeof latestSnapshots>>[number]): RankedStock {
  return {
    symbol: snapshot.stock.symbol,
    name: snapshot.stock.name,
    sector: snapshot.stock.sector,
    rank: 0,
    overallScore: snapshot.overallScore,
    technicalScore: snapshot.technicalScore,
    fundamentalScore: snapshot.fundamentalScore,
    riskScore: snapshot.riskScore,
    confidence: snapshot.confidence,
    signal: null,
    reason: snapshot.reason,
    price: snapshot.price,
    scoredAt: snapshot.scoredAt?.toISOString() ?? null,
  };
}

export async function getDashboard(view: "all" | "10" | "25" | "50" = "10") {
  try {
    await ensureDb();
    const [universeCount, scan] = await Promise.all([countStocks(), latestScan()]);
    const raw = scan
      ? await snapshotsForScan(scan.id)
      : uniqueLatest(await latestSnapshots());
    const ranked = rankStocks(raw.filter((s) => s.stock).map(toRow));
    const limit = view === "all" ? ranked.length : Number(view);
    return {
      universeCount,
      scan,
      ranked: ranked.slice(0, limit || ranked.length),
      totalScored: ranked.filter((r) => r.overallScore != null).length,
    };
  } catch {
    return {
      universeCount: 0,
      scan: null,
      ranked: [],
      totalScored: 0,
    };
  }
}

function uniqueLatest(rows: Awaited<ReturnType<typeof latestSnapshots>>) {
  const seen = new Set<string>();
  const out = [];
  for (const row of rows) {
    if (seen.has(row.stockId)) continue;
    seen.add(row.stockId);
    out.push(row);
  }
  return out;
}
