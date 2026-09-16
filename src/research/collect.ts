import type { FundamentalSignals, TechnicalSignals } from "./types";
import { nseBhavSource, fetchBhavQuotes } from "./nseBhavcopy";
import { sourceLinks, yahooQuoteUrl } from "./sources";
import {
  annualizedVolatility,
  fetchChart,
  fetchQuotes,
  quoteFromChart,
  threeMonthReturn,
  type ChartPoint,
  type YahooQuote,
} from "./yahoo";

type Quote = YahooQuote;

function evidence(symbol: string, claim: string) {
  return {
    source: "Yahoo Finance",
    url: yahooQuoteUrl(symbol),
    claim,
    retrievedAt: new Date().toISOString(),
  };
}

export async function collectQuotes(symbols: string[]) {
  const bhav = await fetchBhavQuotes(symbols);
  const quotes = new Map(bhav.quotes);
  const missing = symbols.filter((symbol) => !quotes.has(symbol));
  if (missing.length > 0 && missing.length <= 40) {
    const yahoo = await fetchQuotes(missing);
    for (const [symbol, quote] of yahoo) {
      quotes.set(symbol, mergeQuote(quotes.get(symbol), quote) ?? quote);
    }
  }
  return quotes;
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

export function technicalFromQuote(
  symbol: string,
  quote: Quote | undefined,
  extras?: {
    relativeReturn3m?: number;
    universeMedianReturn3m?: number;
    volatility?: number;
  },
): TechnicalSignals {
  const sources = [
    ...(quote
      ? [
          evidence(symbol, "Price, moving averages, volume and range"),
          nseBhavSource("https://nsearchives.nseindia.com/"),
        ]
      : []),
    ...sourceLinks(symbol),
  ];
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
): FundamentalSignals {
  const sources = [
    ...(quote
      ? [evidence(symbol, "Growth, profitability, leverage and valuation fields")]
      : []),
    ...sourceLinks(symbol),
  ];
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

export async function enrichShortlistCharts(symbols: string[]) {
  const charts = new Map<string, ChartPoint[]>();
  const batch = process.env.VERCEL ? 5 : 1;
  for (let i = 0; i < symbols.length; i += batch) {
    const slice = symbols.slice(i, i + batch);
    const results = await Promise.all(slice.map((symbol) => fetchChart(symbol)));
    slice.forEach((symbol, j) => charts.set(symbol, results[j] ?? []));
    if (!process.env.VERCEL) await new Promise((r) => setTimeout(r, 150));
  }
  const returns = [...charts.entries()]
    .map(([symbol, pts]) => ({ symbol, ret: threeMonthReturn(pts) }))
    .filter((r): r is { symbol: string; ret: number } => r.ret != null);
  const median =
    returns.length === 0
      ? undefined
      : [...returns.map((r) => r.ret)].sort((a, b) => a - b)[
          Math.floor(returns.length / 2)
        ];
  const extras = new Map<
    string,
    {
      relativeReturn3m?: number;
      universeMedianReturn3m?: number;
      volatility?: number;
      quotePatch?: YahooQuote;
    }
  >();
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
