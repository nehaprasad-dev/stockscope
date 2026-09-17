import {
  enrichShortlistCharts,
  fundamentalFromQuote,
  medianPE,
  mergeQuote,
  technicalFromQuote,
} from "@/research/collect";
import type { FundamentalSignals, TechnicalSignals } from "@/research/types";
import type { YahooQuote } from "@/research/yahoo";
import { researchShortlist } from "@/research/vaaya";
import { explainScore } from "@/explanations/explainScore";
import { fundamentalScore } from "@/scoring/fundamentalScore";
import { dataConfidence, overallScore, riskScore } from "@/scoring/overallScore";
import { signalLabel } from "@/scoring/math";
import { technicalScore } from "@/scoring/technicalScore";
import type { StockScanDetail } from "./types";

export function scoreParts(opts: {
  symbol: string;
  name: string;
  sector: string | null;
  tech: TechnicalSignals;
  fund: FundamentalSignals;
  research?: unknown;
}): StockScanDetail {
  const techResult = technicalScore(opts.tech);
  const fundResult = fundamentalScore(opts.fund);
  const risk = riskScore({
    balanceSheet: fundResult.components.balanceSheet,
    volatilityPenalty: techResult.components.volatilityPenalty,
    debtToEquity: opts.fund.debtToEquity,
  });
  const overall = overallScore({
    fundamental: fundResult.score,
    technical: techResult.score,
    risk,
  });
  const confidence = dataConfidence([
    opts.tech.price,
    opts.tech.ma50,
    opts.tech.ma200,
    opts.tech.week52High,
    opts.fund.revenueGrowth,
    opts.fund.roe,
    opts.fund.debtToEquity,
    opts.fund.trailingPE,
    opts.tech.volatility,
  ]);
  const explanation = explainScore({
    name: opts.name,
    overall,
    technical: techResult.score,
    fundamental: fundResult.score,
    tech: opts.tech,
    fund: opts.fund,
    techParts: techResult.components,
    fundParts: fundResult.components,
  });
  const sources = [...opts.tech.sources, ...opts.fund.sources].filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
  );

  return {
    symbol: opts.symbol,
    name: opts.name,
    sector: opts.sector,
    rank: 0,
    overallScore: overall ?? null,
    technicalScore: techResult.score ?? null,
    fundamentalScore: fundResult.score ?? null,
    riskScore: risk ?? null,
    confidence,
    signal: signalLabel(overall),
    reason: explanation.narrative,
    price: opts.tech.price ?? null,
    scoredAt: new Date().toISOString(),
    standout: explanation.standout,
    watch: explanation.watch,
    technicalLabels: explanation.technicalLabels,
    fundamentalLabels: explanation.fundamentalLabels,
    sources,
    momentum: techResult.components.momentum,
    financial: fundResult.components.profitability,
  };
}

export function cheapScreenScore(tech: TechnicalSignals, fund: FundamentalSignals) {
  const t = technicalScore(tech).score;
  const f = fundamentalScore(fund).score;
  if (t == null && f == null) return -1;
  if (t == null) return f!;
  if (f == null) return t;
  return 0.45 * t + 0.55 * f;
}

export async function scoreUniverse(opts: {
  stocks: Array<{ symbol: string; name: string; sector: string | null }>;
  quotes: Map<string, YahooQuote>;
  shortlist: string[];
}): Promise<StockScanDetail[]> {
  const chartNames = opts.shortlist.slice(0, 10);
  const extras = await enrichShortlistCharts(chartNames);
  const pe = medianPE(opts.quotes);
  let research: unknown = null;
  try {
    research = await researchShortlist(chartNames);
  } catch {
    research = { ok: false, error: "Vaaya research skipped" };
  }

  return opts.stocks.map((stock) => {
    const extra = extras.get(stock.symbol);
    const quote = mergeQuote(opts.quotes.get(stock.symbol), extra?.quotePatch);
    const tech = technicalFromQuote(stock.symbol, quote, extra);
    const fund = fundamentalFromQuote(stock.symbol, quote, pe);
    return scoreParts({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      tech,
      fund,
      research: opts.shortlist.includes(stock.symbol) ? research : null,
    });
  });
}
