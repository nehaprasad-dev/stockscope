import type { EvidenceSource } from "./types";

export function sourceLinks(symbol: string): EvidenceSource[] {
  const retrievedAt = new Date().toISOString();
  return [
    {
      source: "NSE",
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
      claim: "Exchange quote and company page",
      retrievedAt,
    },
    {
      source: "Screener",
      url: `https://www.screener.in/company/${encodeURIComponent(symbol)}/`,
      claim: "Further fundamental research (not scraped for scoring)",
      retrievedAt,
    },
    {
      source: "Trendlyne",
      url: `https://trendlyne.com/equity/${encodeURIComponent(symbol)}/`,
      claim: "Further technical/fundamental research (not scraped for scoring)",
      retrievedAt,
    },
    {
      source: "Indian Stock Picker",
      url: "https://indianstockpicker.com/",
      claim: "Independent research destination (not scraped for scoring)",
      retrievedAt,
    },
  ];
}

export function yahooQuoteUrl(symbol: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}.NS`;
}
