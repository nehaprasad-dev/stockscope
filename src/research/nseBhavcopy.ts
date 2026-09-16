import JSZip from "jszip";
import type { YahooQuote } from "./yahoo";
import type { EvidenceSource } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function yyyymmdd(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}${month}${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function num(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function bhavcopyUrl(date: Date) {
  const id = yyyymmdd(date);
  return `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${id}_F_0000.csv.zip`;
}

export async function fetchBhavQuotes(symbols: string[]) {
  const wanted = new Set(symbols);
  const out = new Map<string, YahooQuote>();
  let usedUrl = "";

  for (let i = 0; i < 7; i++) {
    const url = bhavcopyUrl(addDays(new Date(), -i));
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/zip,*/*" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const zip = await JSZip.loadAsync(await res.arrayBuffer());
      const file = Object.values(zip.files).find((f) => f.name.endsWith(".csv"));
      if (!file) continue;
      const text = await file.async("string");
      usedUrl = url;
      parseBhav(text, wanted, out);
      if (out.size > 0) break;
    } catch {
      continue;
    }
  }

  return { quotes: out, sourceUrl: usedUrl };
}

function parseBhav(
  text: string,
  wanted: Set<string>,
  out: Map<string, YahooQuote>,
) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0]?.split(",") ?? [];
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const symbolI = idx.TckrSymb;
  const seriesI = idx.SctySrs;
  const closeI = idx.ClsPric;
  const prevI = idx.PrvsClsgPric;
  const volI = idx.TtlTradgVol;
  if (symbolI == null || closeI == null) return;

  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const symbol = cols[symbolI]?.trim();
    const series = cols[seriesI]?.trim();
    if (!symbol || !wanted.has(symbol) || (series && series !== "EQ")) continue;
    const close = num(cols[closeI]);
    const prev = num(cols[prevI]);
    out.set(symbol, {
      symbol,
      regularMarketPrice: close,
      regularMarketChangePercent:
        close != null && prev ? ((close - prev) / prev) * 100 : undefined,
      regularMarketVolume: num(cols[volI]),
    });
  }
}

export function nseBhavSource(url: string): EvidenceSource {
  return {
    source: "NSE Bhavcopy",
    url: url || "https://www.nseindia.com/all-reports",
    claim: "Official NSE end-of-day prices and volume",
    retrievedAt: new Date().toISOString(),
  };
}
