import type { EvidenceSource, FundamentalSignals, TechnicalSignals } from "./types";
import { nseBhavSource, fetchBhavQuotes } from "./nseBhavcopy";
import { sourceLinks, yahooQuoteUrl } from "./sources";
import {
  annualizedVolatility,
  quoteFromChart,
  threeMonthReturn,
  type ChartPoint,
  type YahooQuote,
} from "./yahoo";

type Quote = YahooQuote;

export type ChartExtras = {
  relativeReturn3m?: number;
  universeMedianReturn3m?: number;
  volatility?: number;
  quotePatch?: YahooQuote;
};

function yahooEvidence(symbol: string, claim: string): EvidenceSource {
  return {
    source: "Yahoo Finance",
    url: yahooQuoteUrl(symbol),
    claim,
    retrievedAt: new Date().toISOString(),
  };
}

export async function collectQuotes(symbols: string[]) {
  const bhav = await fetchBhavQuotes(symbols);
  return new Map(bhav.quotes);
}

export function mergeQuote(quote?: Quote, patch?: Quote): Quote | undefined {
  if (!quote && !patch) return undefined;
  const out: Quote = { ...(patch ?? {}) };
  if (quote) {
    for (const [key, value] of Object.entries(quote) as Array<[keyof Quote, Quote[keyof Quote]]>) {
      if (value != null) out[key] = value as never;
    }
  }
  return out;
}

function hasFundFields(quote?: Quote) {
  return Boolean(
    quote &&
      (quote.revenueGrowth != null ||
        quote.earningsGrowth != null ||
        quote.returnOnEquity != null ||
        quote.profitMargins != null ||
        quote.debtToEquity != null ||
        quote.trailingPE != null ||
        quote.priceToBook != null),
  );
}

export function technicalFromQuote(
  symbol: string,
  quote: Quote | undefined,
  extras?: ChartExtras,
): TechnicalSignals {
  const sources: EvidenceSource[] = [];
  if (quote?.regularMarketPrice != null) {
    sources.push(nseBhavSource("https://nsearchives.nseindia.com/"));
  }
  if (quote?.fiftyDayAverage != null || extras?.relativeReturn3m != null) {
    sources.push(yahooEvidence(symbol, "One-year daily chart for trend, range and volatility"));
  }
  sources.push(...sourceLinks(symbol));
  return {
    price: quote?.regularMarketPrice,
    ma50: quote?.fiftyDayAverage,
    ma200: quote?.twoHundredDayAverage,
    changePercent: quote?.regularMarketChangePercent,
    week52High: quote?.fiftyTwoWeekHigh,
    week52Low: quote?.fiftyTwoWeekLow,
    volume: quote?.regularMarketVolume,
    avgVolume: quote?.averageDailyVolume3Month,
    relativeReturn3m: extras?.relativeReturn3m,
    universeMedianReturn3m: extras?.universeMedianReturn3m,
    volatility: extras?.volatility,
    sources,
  };
}

export function fundamentalFromQuote(
  symbol: string,
  quote: Quote | undefined,
  universeMedianPE?: number,
  extraSources: EvidenceSource[] = [],
): FundamentalSignals {
  const sources: EvidenceSource[] = [
    ...extraSources,
    ...sourceLinks(symbol),
  ];
  if (hasFundFields(quote) && extraSources.length === 0) {
    sources.unshift(
      yahooEvidence(symbol, "Growth, profitability, leverage and valuation fields"),
    );
  }
  return {
    revenueGrowth: quote?.revenueGrowth,
    earningsGrowth: quote?.earningsGrowth ?? quote?.earningsQuarterlyGrowth,
    roe: quote?.returnOnEquity,
    profitMargins: quote?.profitMargins,
    debtToEquity: quote?.debtToEquity,
    currentRatio: quote?.currentRatio,
    trailingPE: quote?.trailingPE,
    forwardPE: quote?.forwardPE,
    priceToBook: quote?.priceToBook,
    marketCap: quote?.marketCap,
    universeMedianPE,
    sources,
  };
}

export function extrasFromCharts(charts: Map<string, ChartPoint[]>) {
  const returns = [...charts.entries()]
    .map(([symbol, pts]) => ({ symbol, ret: threeMonthReturn(pts) }))
    .filter((r): r is { symbol: string; ret: number } => r.ret != null);
  const median =
    returns.length === 0
      ? undefined
      : [...returns.map((r) => r.ret)].sort((a, b) => a - b)[
          Math.floor(returns.length / 2)
        ];
  const extras = new Map<string, ChartExtras>();
  for (const [symbol, pts] of charts) {
    extras.set(symbol, {
      relativeReturn3m: threeMonthReturn(pts),
      universeMedianReturn3m: median,
      volatility: annualizedVolatility(pts),
      quotePatch: quoteFromChart(symbol, pts) ?? undefined,
    });
  }
  return extras;
}

export function medianPE(quotes: Map<string, Quote>) {
  const pes = [...quotes.values()]
    .map((q) => q.trailingPE)
    .filter((n): n is number => n != null && n > 0 && n < 120)
    .sort((a, b) => a - b);
  if (pes.length === 0) return undefined;
  return pes[Math.floor(pes.length / 2)];
}
