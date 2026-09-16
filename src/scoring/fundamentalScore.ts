import type { FundamentalSignals } from "@/research/types";
import { FUNDAMENTAL_WEIGHTS } from "./weights";
import { clamp, round1, weightedAverage } from "./math";

function growthScore(data: FundamentalSignals) {
  const values = [data.revenueGrowth, data.earningsGrowth].filter(
    (n): n is number => n != null && Number.isFinite(n),
  );
  if (values.length === 0) return undefined;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return clamp(50 + avg * 120);
}

function profitabilityScore(data: FundamentalSignals) {
  const parts: number[] = [];
  if (data.roe != null) parts.push(clamp(30 + data.roe * 220));
  if (data.profitMargins != null) parts.push(clamp(35 + data.profitMargins * 250));
  if (parts.length === 0) return undefined;
  return round1(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function balanceSheetScore(data: FundamentalSignals) {
  const parts: number[] = [];
  if (data.debtToEquity != null) {
    const de = data.debtToEquity > 5 ? data.debtToEquity / 100 : data.debtToEquity;
    parts.push(clamp(95 - de * 28));
  }
  if (data.currentRatio != null) {
    parts.push(clamp(20 + data.currentRatio * 28));
  }
  if (parts.length === 0) return undefined;
  return round1(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function valuationScore(data: FundamentalSignals) {
  if (data.trailingPE == null || data.trailingPE <= 0) return undefined;
  const median = data.universeMedianPE && data.universeMedianPE > 0
    ? data.universeMedianPE
    : 22;
  const ratio = data.trailingPE / median;
  if (ratio < 0.5) return 62;
  if (ratio < 0.8) return 78;
  if (ratio <= 1.2) return 72;
  if (ratio <= 1.8) return 52;
  return 34;
}

function qualityScore(data: FundamentalSignals) {
  if (data.profitMargins == null && data.roe == null) return undefined;
  const margin = data.profitMargins ?? 0;
  const roe = data.roe ?? 0;
  return clamp(40 + margin * 140 + roe * 80);
}

export function fundamentalScore(data: FundamentalSignals) {
  const growth = growthScore(data);
  const profitability = profitabilityScore(data);
  const balanceSheet = balanceSheetScore(data);
  const valuation = valuationScore(data);
  const quality = qualityScore(data);

  return {
    score: weightedAverage([
      { value: growth ?? NaN, weight: FUNDAMENTAL_WEIGHTS.growth },
      { value: profitability ?? NaN, weight: FUNDAMENTAL_WEIGHTS.profitability },
      { value: balanceSheet ?? NaN, weight: FUNDAMENTAL_WEIGHTS.balanceSheet },
      { value: valuation ?? NaN, weight: FUNDAMENTAL_WEIGHTS.valuation },
      { value: quality ?? NaN, weight: FUNDAMENTAL_WEIGHTS.quality },
    ]),
    components: { growth, profitability, balanceSheet, valuation, quality },
  };
}

export function formatPct(n?: number) {
  if (n == null || !Number.isFinite(n)) return "Insufficient data";
  return `${(n * 100).toFixed(1)}%`;
}

export function formatRatio(n?: number) {
  if (n == null || !Number.isFinite(n)) return "Insufficient data";
  return n.toFixed(2);
}
