import { collectQuotes, extrasFromCharts } from "@/research/collect";
import { fetchGrowwFundamentals } from "@/research/groww";
import { fetchSparks } from "@/research/yahoo";
import { parseNifty500Csv } from "@/stocks/parseUniverse";
import { rankStocks } from "@/scoring/rankStocks";
import { scoreUniverse } from "./processStock";
import type { ScanPayload } from "./types";

export async function runScan(): Promise<ScanPayload> {
  try {
    const universe = parseNifty500Csv();
    const symbols = universe.map((s) => s.symbol);
    const [quotes, charts, groww] = await Promise.all([
      collectQuotes(symbols),
      fetchSparks(symbols),
      fetchGrowwFundamentals(universe),
    ]);
    const extras = extrasFromCharts(charts);
    const detailsList = scoreUniverse({
      stocks: universe.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
      })),
      quotes,
      extras,
      fundQuotes: groww.quotes,
      fundSources: groww.sources,
    });

    const ranked = rankStocks(detailsList);
    const details = Object.fromEntries(
      ranked.map((row) => [
        row.symbol,
        {
          ...detailsList.find((d) => d.symbol === row.symbol)!,
          rank: row.rank,
          signal: row.signal,
        },
      ]),
    );

    return {
      status: "completed",
      phase: `${universe.length} stocks analyzed. Shared cache — Vaaya is off for now.`,
      stocksAnalyzed: universe.length,
      stocksShortlisted: 0,
      completedAt: new Date().toISOString(),
      vaayaUsed: false,
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
