import { createScanRun, runningScan, updateScanRun } from "@/db/scans";
import { prisma } from "@/db/prisma";
import {
  collectQuotes,
  fundamentalFromQuote,
  technicalFromQuote,
} from "@/research/collect";
import { STARTER_SYMBOLS } from "@/stocks/starter";
import { cheapScreenScore, enrichAndScore } from "./processStock";

export type ScanOptions = {
  limit?: number;
  shortlistSize?: number;
};

async function markStaleScans() {
  const stale = await prisma.scanRun.findMany({
    where: { status: { in: ["queued", "running"] } },
  });
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const scan of stale) {
    if (scan.startedAt.getTime() < cutoff) {
      await updateScanRun(scan.id, {
        status: "failed",
        phase: "Failed",
        error: "Scan timed out",
        completedAt: new Date(),
      });
    }
  }
}

async function pickUniverse(limit: number) {
  const active = await prisma.stock.findMany({
    where: { isActive: true },
    orderBy: { symbol: "asc" },
  });
  if (active.length <= limit) return active;

  const bySymbol = new Map(active.map((s) => [s.symbol, s]));
  const picked = [];
  const used = new Set<string>();
  for (const symbol of STARTER_SYMBOLS) {
    const stock = bySymbol.get(symbol);
    if (stock) {
      picked.push(stock);
      used.add(symbol);
    }
    if (picked.length >= limit) return picked;
  }
  for (const stock of active) {
    if (used.has(stock.symbol)) continue;
    picked.push(stock);
    if (picked.length >= limit) break;
  }
  return picked;
}

export async function runScan(options: ScanOptions = {}) {
  await markStaleScans();
  const existing = await runningScan();
  if (existing) return existing;

  const limit = Math.min(Math.max(options.limit ?? 10, 1), 500);
  const shortlistSize = Math.min(Math.max(options.shortlistSize ?? 10, 1), 50);

  const scan = await createScanRun();
  try {
    const universe = await pickUniverse(limit);

    await updateScanRun(scan.id, { phase: "Fetching market data..." });
    const quotes = await collectQuotes(universe.map((s) => s.symbol));

    await updateScanRun(scan.id, { phase: "Analyzing technical signals..." });
    const cheap = universe
      .map((stock) => {
        const quote = quotes.get(stock.symbol);
        const tech = technicalFromQuote(stock.symbol, quote);
        const fund = fundamentalFromQuote(stock.symbol, quote);
        return { stock, score: cheapScreenScore(tech, fund) };
      })
      .sort((a, b) => b.score - a.score);

    const shortlist = cheap
      .filter((row) => row.score >= 0)
      .slice(0, Math.min(shortlistSize, universe.length))
      .map((row) => row.stock.symbol);

    await updateScanRun(scan.id, {
      phase: "Checking fundamentals...",
      stocksShortlisted: shortlist.length,
    });

    await updateScanRun(scan.id, { phase: "Ranking stocks..." });
    await enrichAndScore({
      stocks: universe,
      quotes,
      scanRunId: scan.id,
      shortlist,
    });

    return updateScanRun(scan.id, {
      status: "completed",
      phase: `${universe.length} stocks analyzed`,
      stocksAnalyzed: universe.length,
      stocksShortlisted: shortlist.length,
      completedAt: new Date(),
    });
  } catch (error) {
    return updateScanRun(scan.id, {
      status: "failed",
      phase: "Failed",
      error: error instanceof Error ? error.message : "Scan failed",
      completedAt: new Date(),
    });
  }
}
