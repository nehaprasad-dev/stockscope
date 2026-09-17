import { mapPool } from "@/lib/pool";
import type { EvidenceSource } from "./types";
import type { YahooQuote } from "./yahoo";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type GrowwRow = { name?: string; shortName?: string; value?: unknown };
type GrowwStatement = {
  title?: string;
  yearly?: Record<string, number>;
  cagr?: { oneYearTtm?: number; threeYearCagr?: number };
};

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^(na|n\/a|-|—|--)$/i.test(trimmed)) return undefined;
  const percent = trimmed.includes("%");
  const cleaned = trimmed.replace(/[%₹,\s]/g, "").replace(/cr$/i, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return percent ? n / 100 : n;
}

function asRate(n: number | undefined) {
  if (n == null || !Number.isFinite(n)) return undefined;
  if (Math.abs(n) > 1 && Math.abs(n) <= 100) return n / 100;
  return n;
}

function latestYear(yearly?: Record<string, number>) {
  if (!yearly) return undefined;
  const key = Object.keys(yearly).sort().at(-1);
  if (!key) return undefined;
  const n = yearly[key];
  return Number.isFinite(n) ? n : undefined;
}

function pick(rows: GrowwRow[], names: string[]) {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const row = rows.find((item) =>
    wanted.has((item.shortName ?? "").toLowerCase()) ||
    wanted.has((item.name ?? "").toLowerCase()),
  );
  return parseNumber(row?.value);
}

function growwUrl(symbol: string, searchId?: string) {
  if (searchId) return `https://groww.in/stocks/${searchId}`;
  return `https://groww.in/search?q=${encodeURIComponent(symbol)}`;
}

export function parseGrowwCompany(symbol: string, json: unknown): {
  quote: YahooQuote;
  source: EvidenceSource;
} | null {
  if (!json || typeof json !== "object") return null;
  const body = json as {
    header?: Record<string, unknown>;
    details?: Record<string, unknown>;
    fundamentals?: GrowwRow[];
    financialStatement?: GrowwStatement[];
  };
  const rows = Array.isArray(body.fundamentals) ? body.fundamentals : [];
  const statements = Array.isArray(body.financialStatement)
    ? body.financialStatement
    : [];
  const byTitle = new Map(
    statements
      .filter((row) => row.title)
      .map((row) => [row.title as string, row]),
  );
  const revenue = byTitle.get("Revenue");
  const profit = byTitle.get("Profit");
  const revLatest = latestYear(revenue?.yearly);
  const profitLatest = latestYear(profit?.yearly);

  const roe = asRate(pick(rows, ["ROE"]));
  const trailingPE = pick(rows, ["P/E Ratio(TTM)", "P/E Ratio"]);
  const priceToBook = pick(rows, ["P/B Ratio"]);
  const debtToEquity = pick(rows, ["Debt to Equity"]);
  const revenueGrowth = asRate(revenue?.cagr?.oneYearTtm ?? revenue?.cagr?.threeYearCagr);
  const earningsGrowth = asRate(profit?.cagr?.oneYearTtm ?? profit?.cagr?.threeYearCagr);
  const profitMargins =
    revLatest && revLatest !== 0 && profitLatest != null
      ? profitLatest / revLatest
      : undefined;

  if (
    roe == null &&
    trailingPE == null &&
    debtToEquity == null &&
    revenueGrowth == null &&
    earningsGrowth == null &&
    priceToBook == null
  ) {
    return null;
  }

  const searchId =
    (typeof body.header?.searchId === "string" && body.header.searchId) ||
    (typeof body.header?.search_id === "string" && body.header.search_id) ||
    (typeof body.details?.searchId === "string" && body.details.searchId) ||
    undefined;

  return {
    quote: {
      symbol,
      returnOnEquity: roe,
      trailingPE: trailingPE != null && trailingPE > 0 ? trailingPE : undefined,
      priceToBook,
      debtToEquity,
      revenueGrowth,
      earningsGrowth,
      profitMargins,
    },
    source: {
      source: "Groww",
      url: growwUrl(symbol, searchId),
      claim: "Reported ratios and financial statements used for scoring",
      retrievedAt: new Date().toISOString(),
    },
  };
}

async function fetchIsin(isin: string) {
  const url = `https://groww.in/v1/api/stocks_data/v1/company/isin/${encodeURIComponent(isin)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
}

async function fetchJson(url: string, extraHeaders?: Record<string, string>) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      ...extraHeaders,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (res.status === 429) return { status: 429 as const, json: null };
  if (!res.ok) return { status: res.status, json: null };
  return { status: res.status, json: await res.json() };
}

function parseTickertape(symbol: string, json: unknown, sid?: string) {
  if (!json || typeof json !== "object") return null;
  const ratios = (json as { data?: { ratios?: Record<string, unknown> } }).data?.ratios;
  if (!ratios) return null;
  const peRaw = ratios.ttmPe ?? ratios.pe;
  const pe = typeof peRaw === "number" && peRaw > 0 ? peRaw : undefined;
  const roe = asRate(typeof ratios.roe === "number" ? ratios.roe : undefined);
  const pb = typeof ratios.pb === "number" ? ratios.pb : undefined;
  if (pe == null && roe == null && pb == null) return null;
  return {
    quote: {
      symbol,
      trailingPE: pe,
      returnOnEquity: roe,
      priceToBook: pb,
    } satisfies YahooQuote,
    source: {
      source: "Tickertape",
      url: `https://www.tickertape.in/stocks/${encodeURIComponent(sid ?? symbol)}`,
      claim: "Reported valuation and profitability ratios used for scoring",
      retrievedAt: new Date().toISOString(),
    } satisfies EvidenceSource,
  };
}

async function fillMissingFromTickertape(
  stocks: Array<{ symbol: string }>,
  quotes: Map<string, YahooQuote>,
  sources: Map<string, EvidenceSource>,
  deadline: number,
) {
  const missing = stocks.filter((s) => !quotes.has(s.symbol));
  if (missing.length === 0) return;

  await mapPool(missing, missing.length > 40 ? 16 : 10, async (stock) => {
    if (Date.now() > deadline) return;
    try {
      const search = await fetchJson(
        `https://api.tickertape.in/search?text=${encodeURIComponent(stock.symbol)}&types=stock`,
        { Origin: "https://www.tickertape.in", Referer: "https://www.tickertape.in/" },
      );
      if (search.status === 429) return;
      const hit = (
        search.json as { data?: { stocks?: Array<{ ticker?: string; sid?: string }> } } | null
      )?.data?.stocks?.find((row) => row.ticker === stock.symbol && row.sid);
      const sid = hit?.sid ?? stock.symbol;
      const info = await fetchJson(
        `https://api.tickertape.in/stocks/info/${encodeURIComponent(sid)}`,
        { Origin: "https://www.tickertape.in", Referer: "https://www.tickertape.in/" },
      );
      const parsed = parseTickertape(stock.symbol, info.json, sid);
      if (!parsed) return;
      quotes.set(stock.symbol, parsed.quote);
      sources.set(stock.symbol, parsed.source);
    } catch {
      // omit
    }
  });
}

export async function fetchGrowwFundamentals(
  stocks: Array<{ symbol: string; isin?: string }>,
) {
  const quotes = new Map<string, YahooQuote>();
  const sources = new Map<string, EvidenceSource>();
  const withIsin = stocks.filter((s) => s.isin && !s.isin.startsWith("DUM"));
  const deadline = Date.now() + 40_000;

  await mapPool(withIsin, 12, async (stock) => {
    if (Date.now() > deadline) return;
    try {
      const json = await fetchIsin(stock.isin!);
      const parsed = parseGrowwCompany(stock.symbol, json);
      if (!parsed) return;
      quotes.set(stock.symbol, parsed.quote);
      sources.set(stock.symbol, parsed.source);
    } catch {
      // Missing fundamentals stay omitted — never invented.
    }
  });

  await fillMissingFromTickertape(stocks, quotes, sources, deadline);

  return { quotes, sources };
}
