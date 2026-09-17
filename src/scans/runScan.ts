import {
  collectQuotes,
  fundamentalFromQuote,
  technicalFromQuote,
} from "@/research/collect";
import { STARTER_SYMBOLS } from "@/stocks/starter";
import { parseNifty500Csv } from "@/stocks/parseUniverse";
import { rankStocks } from "@/scoring/rankStocks";
import { cheapScreenScore, scoreUniverse } from "./processStock";
import type { ScanPayload } from "./types";

export type ScanOptions = {
  limit?: number;
  shortlistSize?: number;
};

function pickUniverse(limit: number) {
  const active = parseNifty500Csv();
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

export async function runScan(options: ScanOptions = {}): Promise<ScanPayload> {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 500);
  const shortlistSize = Math.min(
    Math.max(options.shortlistSize ?? Math.min(10, limit), 1),
    limit <= 10 ? limit : 10,
  );

  try {
    const universe = pickUniverse(limit);
    const quotes = await collectQuotes(universe.map((s) => s.symbol));
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

    const detailsList = await scoreUniverse({
      stocks: universe.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
      })),
      quotes,
      shortlist,
    });
    const ranked = rankStocks(detailsList);
    const details = Object.fromEntries(ranked.map((row) => [row.symbol, {
      ...detailsList.find((d) => d.symbol === row.symbol)!,
      rank: row.rank,
      signal: row.signal,
    }]));

    return {
      status: "completed",
      phase: `${universe.length} stocks analyzed`,
      stocksAnalyzed: universe.length,
      stocksShortlisted: shortlist.length,
      completedAt: new Date().toISOString(),
      ranked,
      details,
    };
  } catch (error) {
    return {
      status: "failed",
      phase: "Failed",
      stocksAnalyzed: 0,
      stocksShortlisted: 0,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Scan failed",
      ranked: [],
      details: {},
    };
  }
}
