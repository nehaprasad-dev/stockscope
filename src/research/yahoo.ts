const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type YahooQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  regularMarketChangePercent?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  returnOnEquity?: number;
  profitMargins?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  earningsQuarterlyGrowth?: number;
  debtToEquity?: number;
  currentRatio?: number;
  marketCap?: number;
};

function yahooSymbol(nseSymbol: string) {
  if (nseSymbol.startsWith("^")) return nseSymbol;
  return `${nseSymbol}.NS`;
}

function raw(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "raw" in value) {
    const n = (value as { raw?: unknown }).raw;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return undefined;
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json,text/plain,*/*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo request failed ${res.status}`);
  return res.json();
}

export async function fetchQuotes(symbols: string[]) {
  const out = new Map<string, YahooQuote>();
  for (const symbol of symbols) {
    const { points, quote } = await fetchChartWithMeta(symbol);
    const derived = quoteFromChart(symbol, points);
    const merged = {
      ...(derived ?? {}),
      ...(quote ?? {}),
    };
    if (merged.regularMarketPrice != null) out.set(symbol, merged);
    await new Promise((r) => setTimeout(r, 120));
  }
  return out;
}

export async function fetchQuoteSummary(symbol: string): Promise<YahooQuote | null> {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol(symbol))}?modules=price,summaryDetail,defaultKeyStatistics,financialData`;
  try {
    const json = await fetchJson(url);
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;
    const price = result.price ?? {};
    const summary = result.summaryDetail ?? {};
    const stats = result.defaultKeyStatistics ?? {};
    const financials = result.financialData ?? {};
    return {
      symbol: yahooSymbol(symbol),
      shortName: price.shortName,
      longName: price.longName,
      regularMarketPrice: raw(price.regularMarketPrice),
      fiftyDayAverage: raw(summary.fiftyDayAverage),
      twoHundredDayAverage: raw(summary.twoHundredDayAverage),
      regularMarketChangePercent: raw(price.regularMarketChangePercent),
      fiftyTwoWeekHigh: raw(summary.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: raw(summary.fiftyTwoWeekLow),
      regularMarketVolume: raw(price.regularMarketVolume),
      averageDailyVolume3Month: raw(summary.averageVolume),
      trailingPE: raw(summary.trailingPE),
      forwardPE: raw(summary.forwardPE),
      priceToBook: raw(stats.priceToBook),
      returnOnEquity: raw(financials.returnOnEquity),
      profitMargins: raw(financials.profitMargins),
      revenueGrowth: raw(financials.revenueGrowth),
      earningsGrowth: raw(financials.earningsGrowth),
      earningsQuarterlyGrowth: raw(financials.earningsGrowth),
      debtToEquity: raw(financials.debtToEquity),
      currentRatio: raw(financials.currentRatio),
      marketCap: raw(price.marketCap),
    };
  } catch {
    return null;
  }
}

export type ChartPoint = { close: number; volume?: number };

export async function fetchChart(symbol: string): Promise<ChartPoint[]> {
  const { points } = await fetchChartWithMeta(symbol);
  return points;
}

export async function fetchChartWithMeta(symbol: string): Promise<{
  points: ChartPoint[];
  quote?: YahooQuote;
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=1y&interval=1d`;
  try {
    const json = await fetchJson(url);
    const result = json?.chart?.result?.[0];
    const meta = result?.meta ?? {};
    const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];
    const volumes: Array<number | null> = result?.indicators?.quote?.[0]?.volume ?? [];
    const points = closes
      .map((close, i) => ({ close: close ?? NaN, volume: volumes[i] ?? undefined }))
      .filter((p) => Number.isFinite(p.close));
    const quote: YahooQuote = {
      symbol: yahooSymbol(symbol),
      shortName: meta.shortName,
      longName: meta.longName,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketChangePercent: meta.regularMarketChangePercent,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      regularMarketVolume: meta.regularMarketVolume,
    };
    return { points, quote };
  } catch {
    return { points: [] };
  }
}

export function quoteFromChart(symbol: string, points: ChartPoint[]): YahooQuote | null {
  if (points.length < 20) return null;
  const last = points[points.length - 1];
  const mean = (n: number) => {
    const slice = points.slice(-n);
    return slice.reduce((s, p) => s + p.close, 0) / slice.length;
  };
  const prev = points[Math.max(0, points.length - 2)].close;
  const highs = points.map((p) => p.close);
  const vols = points.map((p) => p.volume ?? 0).filter((v) => v > 0);
  return {
    symbol: yahooSymbol(symbol),
    regularMarketPrice: last.close,
    fiftyDayAverage: mean(50),
    twoHundredDayAverage: mean(Math.min(200, points.length)),
    regularMarketChangePercent: prev ? ((last.close - prev) / prev) * 100 : undefined,
    fiftyTwoWeekHigh: Math.max(...highs),
    fiftyTwoWeekLow: Math.min(...highs),
    regularMarketVolume: last.volume,
    averageDailyVolume3Month:
      vols.length > 0
        ? vols.slice(-63).reduce((s, n) => s + n, 0) / Math.min(63, vols.length)
        : undefined,
  };
}

export function threeMonthReturn(points: ChartPoint[]) {
  if (points.length < 20) return undefined;
  const last = points[points.length - 1].close;
  const lookback = Math.min(points.length - 1, 63);
  const prev = points[points.length - 1 - lookback].close;
  if (!prev) return undefined;
  return (last - prev) / prev;
}

export function annualizedVolatility(points: ChartPoint[]) {
  if (points.length < 20) return undefined;
  const rets: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].close;
    const b = points[i].close;
    if (a > 0) rets.push(Math.log(b / a));
  }
  if (rets.length < 10) return undefined;
  const mean = rets.reduce((s, n) => s + n, 0) / rets.length;
  const variance =
    rets.reduce((s, n) => s + (n - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}
