type VaayaResult = {
  ok?: boolean;
  data?: unknown;
  error?: string;
};

export function vaayaConfigured() {
  return Boolean(process.env.VAAYA_API_KEY);
}

export async function vaayaRun(opts: {
  service: string;
  action: string;
  params: Record<string, unknown>;
  maxCostCents: number;
}) {
  const key = process.env.VAAYA_API_KEY;
  if (!key) return null;
  const base = process.env.VAAYA_API_URL ?? "https://api.vaaya.ai/api/run";
  const res = await fetch(`${base}/${opts.service}/${opts.action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      params: opts.params,
      max_cost_cents: opts.maxCostCents,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    return { ok: false, error: `Vaaya ${res.status}` } satisfies VaayaResult;
  }
  return (await res.json()) as VaayaResult;
}

export async function researchShortlist(symbols: string[]) {
  if (!vaayaConfigured() || symbols.length === 0) return null;
  const query = [
    "Research-only, not investment advice.",
    `NSE stocks: ${symbols.join(", ")}.`,
    "For each ticker, extract cited evidence on recent earnings/revenue trend, notable news, and material risks.",
    "Prefer Screener, Trendlyne, NSE filings, and reputable Indian market news.",
    "Do not invent numbers. Quote only figures that appear in sources.",
  ].join(" ");

  return vaayaRun({
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
  });
}
