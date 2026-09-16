import { prisma } from "@/db/prisma";
import { explainScore } from "@/explanations/explainScore";
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
import { fundamentalScore } from "@/scoring/fundamentalScore";
import { dataConfidence, overallScore, riskScore } from "@/scoring/overallScore";
import { technicalScore } from "@/scoring/technicalScore";

function json(value: unknown) {
  return JSON.stringify(value);
}

export async function processStock(opts: {
  stockId: string;
  symbol: string;
  name: string;
  scanRunId: string;
  tech: TechnicalSignals;
  fund: FundamentalSignals;
  research?: unknown;
}) {
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

  return prisma.stockSnapshot.create({
    data: {
      stockId: opts.stockId,
      scanRunId: opts.scanRunId,
      price: opts.tech.price ?? null,
      technicalData: json({
        ...opts.tech,
        components: techResult.components,
        labels: explanation.technicalLabels,
      }),
      fundamentalData: json({
        ...opts.fund,
        components: fundResult.components,
        labels: explanation.fundamentalLabels,
      }),
      researchData: json({
        narrative: explanation.narrative,
        standout: explanation.standout,
        watch: explanation.watch,
        vaaya: opts.research ?? null,
      }),
      technicalScore: techResult.score ?? null,
      fundamentalScore: fundResult.score ?? null,
      riskScore: risk ?? null,
      overallScore: overall ?? null,
      confidence,
      reason: explanation.narrative,
      riskSummary: explanation.watch.join(" · "),
      scoredAt: overall != null ? new Date() : null,
    },
  });
}

export function cheapScreenScore(tech: TechnicalSignals, fund: FundamentalSignals) {
  const t = technicalScore(tech).score;
  const f = fundamentalScore(fund).score;
  if (t == null && f == null) return -1;
  if (t == null) return f!;
  if (f == null) return t;
  return 0.45 * t + 0.55 * f;
}

export async function enrichAndScore(opts: {
  stocks: Array<{ id: string; symbol: string; name: string }>;
  quotes: Map<string, YahooQuote>;
  scanRunId: string;
  shortlist: string[];
}) {
  const extras = await enrichShortlistCharts(opts.shortlist);
  const pe = medianPE(opts.quotes);
  let research: unknown = null;
  try {
    research = await researchShortlist(opts.shortlist);
  } catch {
    research = { ok: false, error: "Vaaya research skipped" };
  }

  for (const stock of opts.stocks) {
    const extra = extras.get(stock.symbol);
    const quote = mergeQuote(opts.quotes.get(stock.symbol), extra?.quotePatch);
    const tech = technicalFromQuote(stock.symbol, quote, extra);
    const fund = fundamentalFromQuote(stock.symbol, quote, pe);
    await processStock({
      stockId: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      scanRunId: opts.scanRunId,
      tech,
      fund,
      research: opts.shortlist.includes(stock.symbol) ? research : null,
    });
  }
}
