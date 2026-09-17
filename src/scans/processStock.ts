import {
  fundamentalFromQuote,
  medianPE,
  mergeQuote,
  technicalFromQuote,
  type ChartExtras,
} from "@/research/collect";
import type { EvidenceSource, FundamentalSignals, TechnicalSignals } from "@/research/types";
import type { YahooQuote } from "@/research/yahoo";
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
    (s, i, arr) => arr.findIndex((x) => x.url === s.url && x.source === s.source) === i,
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

export function scoreUniverse(opts: {
  stocks: Array<{ symbol: string; name: string; sector: string | null }>;
  quotes: Map<string, YahooQuote>;
  extras: Map<string, ChartExtras>;
  fundQuotes: Map<string, YahooQuote>;
  fundSources: Map<string, EvidenceSource>;
}): StockScanDetail[] {
  const merged = new Map<string, YahooQuote>();
  for (const stock of opts.stocks) {
    const extra = opts.extras.get(stock.symbol);
    const withChart = mergeQuote(opts.quotes.get(stock.symbol), extra?.quotePatch);
    const withFund = mergeQuote(opts.fundQuotes.get(stock.symbol), withChart);
    if (withFund) merged.set(stock.symbol, withFund);
  }
  const pe = medianPE(merged);

  return opts.stocks.map((stock) => {
    const extra = opts.extras.get(stock.symbol);
    const quote = merged.get(stock.symbol);
    const fundSource = opts.fundSources.get(stock.symbol);
    const tech = technicalFromQuote(stock.symbol, quote, extra);
    const fund = fundamentalFromQuote(
      stock.symbol,
      quote,
      pe,
      fundSource ? [fundSource] : [],
    );
    return scoreParts({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      tech,
      fund,
    });
  });
}
