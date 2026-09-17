import { logVaayaUsage } from "@/db/usage";
import type { EvidenceSource } from "./types";
import type { YahooQuote } from "./yahoo";

export const VAAYA_CREDITS_URL = "https://vaaya.ai/balance";
const DEFAULT_VAAYA_RUN_URL = "https://vaaya.ai/api/run";

export class VaayaRequiredError extends Error {
  creditsUrl: string;

  constructor(message: string, creditsUrl = VAAYA_CREDITS_URL) {
    super(message);
    this.name = "VaayaRequiredError";
    this.creditsUrl = creditsUrl;
  }
}

export class VaayaApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "VaayaApiError";
    this.status = status;
  }
}

export function vaayaRunBase() {
  const raw = (process.env.VAAYA_API_URL ?? DEFAULT_VAAYA_RUN_URL)
    .trim()
    .replace(/\/+$/, "");
  // api.vaaya.ai is not the run host — it 404s with "requested path is invalid".
  if (!raw || raw.includes("://api.vaaya.ai")) {
    return DEFAULT_VAAYA_RUN_URL;
  }
  return raw;
}

type VaayaResult = {
  ok?: boolean;
  data?: unknown;
  error?: string;
  credits_url?: string;
};

export function vaayaConfigured() {
  return Boolean(process.env.VAAYA_API_KEY);
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/[% ,]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asRate(n: number | undefined) {
  if (n == null) return undefined;
  if (Math.abs(n) > 1 && Math.abs(n) <= 100) return n / 100;
  return n;
}

export async function vaayaRun(opts: {
  service: string;
  action: string;
  params: Record<string, unknown>;
  maxCostCents: number;
  requireOk?: boolean;
  userId?: string;
}) {
  const key = process.env.VAAYA_API_KEY;
  if (!key) {
    throw new VaayaRequiredError(
      "Vaaya is required for a scan. Set VAAYA_API_KEY, then add credits at https://vaaya.ai/balance",
    );
  }
  const base = vaayaRunBase();
  const res = await fetch(`${base}/${opts.service}/${opts.action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...opts.params,
      max_cost_cents: opts.maxCostCents,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(40000),
  });
  const body = (await res.json().catch(() => ({}))) as VaayaResult & {
    message?: string;
    data?: { error?: string };
    charged_cents?: number;
  };
  const charged =
    typeof body.charged_cents === "number" ? body.charged_cents : undefined;
  void logVaayaUsage({
    userId: opts.userId,
    service: opts.service,
    action: opts.action,
    ok: res.ok && body.ok !== false,
    chargedCents: charged,
  });
  if (res.status === 402 || body.error === "credits_required") {
    throw new VaayaRequiredError(
      "Vaaya credits are required for shortlist research. Add balance, then scan again.",
      typeof body.credits_url === "string" ? body.credits_url : VAAYA_CREDITS_URL,
    );
  }
  if (!res.ok) {
    const detail =
      body.error ?? body.message ?? body.data?.error ?? "Request failed";
    if (opts.requireOk === false) {
      return { ok: false, error: `Vaaya ${res.status}` } satisfies VaayaResult;
    }
    throw new VaayaApiError(
      `Vaaya research failed (${res.status}). ${detail}`,
      502,
    );
  }
  return body;
}

function collectObjects(value: unknown, into: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, into);
    return into;
  }
  if (value && typeof value === "object") {
    into.push(value as Record<string, unknown>);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (nested && typeof nested === "object") collectObjects(nested, into);
    }
  }
  return into;
}

function nseSymbol(raw: unknown, fallback?: string) {
  const text = typeof raw === "string" ? raw : fallback;
  if (!text) return undefined;
  return text.replace(/:NSE$/i, "").replace(/\.NS$/i, "").trim().toUpperCase();
}

export function parseVaayaQuotes(payload: unknown, wanted: string[]) {
  const allow = new Set(wanted.map((s) => s.toUpperCase()));
  const quotes = new Map<string, YahooQuote>();
  for (const row of collectObjects(payload)) {
    const symbol = nseSymbol(row.symbol ?? row.ticker ?? row.code);
    if (!symbol || !allow.has(symbol)) continue;
    const trailingPE = num(row.trailingPE ?? row.pe ?? row.peRatio ?? row.priceToEarnings);
    const roe = asRate(num(row.returnOnEquity ?? row.roe));
    const debtToEquity = num(row.debtToEquity ?? row.de ?? row.debt_to_equity);
    const revenueGrowth = asRate(num(row.revenueGrowth ?? row.revenue_growth));
    const earningsGrowth = asRate(num(row.earningsGrowth ?? row.earnings_growth));
    const priceToBook = num(row.priceToBook ?? row.pb);
    const profitMargins = asRate(num(row.profitMargins ?? row.profitMargin));
    if (
      trailingPE == null &&
      roe == null &&
      debtToEquity == null &&
      revenueGrowth == null &&
      earningsGrowth == null
    ) {
      continue;
    }
    quotes.set(symbol, {
      symbol,
      trailingPE: trailingPE != null && trailingPE > 0 ? trailingPE : undefined,
      returnOnEquity: roe,
      debtToEquity,
      revenueGrowth,
      earningsGrowth,
      priceToBook,
      profitMargins,
    });
  }
  return quotes;
}

export function parseVaayaEvidence(payload: unknown, symbols: string[]) {
  const bySymbol = new Map<string, { notes: string[]; sources: EvidenceSource[] }>();
  for (const symbol of symbols) {
    bySymbol.set(symbol, { notes: [], sources: [] });
  }
  const retrievedAt = new Date().toISOString();
  const items = collectObjects(payload).filter((row) => {
    const url = row.url ?? row.link;
    const title = row.title ?? row.name;
    const snippet = row.snippet ?? row.content ?? row.summary ?? row.text;
    return typeof url === "string" && (typeof title === "string" || typeof snippet === "string");
  });

  for (const row of items) {
    const url = String(row.url ?? row.link);
    const title = typeof row.title === "string" ? row.title : "";
    const snippet =
      typeof row.snippet === "string"
        ? row.snippet
        : typeof row.summary === "string"
          ? row.summary
          : typeof row.text === "string"
            ? row.text.slice(0, 280)
            : "";
    const hay = `${title} ${snippet} ${url}`.toUpperCase();
    const source: EvidenceSource = {
      source: typeof row.source === "string" ? `Vaaya · ${row.source}` : "Vaaya research",
      url,
      claim: snippet || title || "Cited research evidence",
      retrievedAt,
    };
    let matched = false;
    for (const symbol of symbols) {
      if (!hay.includes(symbol.toUpperCase())) continue;
      const bucket = bySymbol.get(symbol)!;
      bucket.sources.push(source);
      if (snippet) bucket.notes.push(snippet.slice(0, 220));
      matched = true;
    }
    if (!matched) {
      for (const symbol of symbols.slice(0, 8)) {
        const bucket = bySymbol.get(symbol)!;
        if (bucket.sources.length >= 3) continue;
        bucket.sources.push(source);
      }
    }
  }
  return bySymbol;
}

export async function researchShortlist(symbols: string[], userId?: string) {
  if (symbols.length === 0) {
    throw new VaayaRequiredError("Vaaya research needs a shortlist.");
  }
  const tagged = symbols.map((symbol) => `${symbol}:NSE`).join(",");
  const query = [
    "Research-only, not investment advice.",
    `NSE stocks: ${symbols.join(", ")}.`,
    "For each ticker, extract cited evidence on recent earnings or revenue trend, notable news, and material risks.",
    "Prefer NSE filings, reputable Indian market news, Screener, and Trendlyne.",
    "Do not invent numbers. Quote only figures that appear in sources.",
  ].join(" ");

  const [quotesRes, searchRes] = await Promise.all([
    vaayaRun({
      service: "openwebninja",
      action: "stock-quote",
      params: { symbol: tagged },
      maxCostCents: 5,
      requireOk: false,
      userId,
    }),
    vaayaRun({
      service: "vaaya",
      action: "onesearch",
      params: {
        query,
        facets: ["web", "news"],
        recencyDays: 120,
        maxResults: 12,
        fidelityRequired: false,
      },
      maxCostCents: 10,
      userId,
    }),
  ]);

  return {
    quotes: parseVaayaQuotes(quotesRes, symbols),
    research: parseVaayaEvidence(searchRes, symbols),
  };
}
