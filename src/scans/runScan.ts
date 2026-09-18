import { collectQuotes, extrasFromCharts, mergeQuote } from "@/research/collect";
import { fetchGrowwFundamentals } from "@/research/groww";
import { researchShortlist, VaayaRequiredError } from "@/research/vaaya";
import type { EvidenceSource } from "@/research/types";
import type { YahooQuote } from "@/research/yahoo";
import { fetchSparks } from "@/research/yahoo";
import { parseNifty500Csv } from "@/stocks/parseUniverse";
import { rankStocks } from "@/scoring/rankStocks";
import { rankingValue } from "@/scoring/math";
import { scoreUniverse } from "./processStock";
import type { ScanPayload } from "./types";

const VAAYA_SHORTLIST = 30;

export async function runScan(opts?: { userId?: string }): Promise<ScanPayload> {
  try {
    const universe = parseNifty500Csv();
    const symbols = universe.map((s) => s.symbol);
    const [quotes, charts, groww] = await Promise.all([
      collectQuotes(symbols),
      fetchSparks(symbols),
      fetchGrowwFundamentals(universe),
    ]);
    const extras = extrasFromCharts(charts);
    const firstPass = scoreUniverse({
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

    const shortlist = [...firstPass]
      .sort(
        (a, b) =>
          rankingValue({
            overall: b.overallScore,
            confidence: b.confidence,
            scoredAt: b.scoredAt,
          }) -
          rankingValue({
            overall: a.overallScore,
            confidence: a.confidence,
            scoredAt: a.scoredAt,
          }),
      )
      .slice(0, VAAYA_SHORTLIST)
      .map((row) => row.symbol);

    let vaaya = {
      quotes: new Map<string, YahooQuote>(),
      research: new Map<string, { notes: string[]; sources: EvidenceSource[] }>(),
    };
    let vaayaUsed = false;
    try {
      vaaya = await researchShortlist(shortlist, opts?.userId);
      vaayaUsed = true;
    } catch (error) {
      console.error("Vaaya shortlist skipped; ranking still returned", error);
    }
    const fundQuotes = new Map(groww.quotes);
    for (const [symbol, quote] of vaaya.quotes) {
      fundQuotes.set(symbol, mergeQuote(fundQuotes.get(symbol), quote) ?? quote);
    }

    const detailsList = scoreUniverse({
      stocks: universe.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
      })),
      quotes,
      extras,
      fundQuotes,
      fundSources: groww.sources,
    }).map((row) => {
      const extra = vaaya.research.get(row.symbol);
      if (!extra) return row;
      const sources = [...row.sources, ...extra.sources].filter(
        (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
      );
      return {
        ...row,
        researchNotes: extra.notes.slice(0, 3),
        sources,
      };
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
      phase: vaayaUsed
        ? `${universe.length} stocks analyzed, ${shortlist.length} sent to Vaaya`
        : `${universe.length} stocks analyzed. Shortlist research skipped; ranking is still free.`,
      stocksAnalyzed: universe.length,
      stocksShortlisted: vaayaUsed ? shortlist.length : 0,
      completedAt: new Date().toISOString(),
      vaayaUsed,
      ranked,
      details,
    };
  } catch (error) {
    const creditsUrl =
      error instanceof VaayaRequiredError ? error.creditsUrl : undefined;
    return {
      status: "failed",
      phase: "Failed",
      stocksAnalyzed: 0,
      stocksShortlisted: 0,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Scan failed",
      creditsUrl,
      ranked: [],
      details: {},
    };
  }
}
