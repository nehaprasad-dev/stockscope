import { WEIGHTS } from "./weights";
import { clamp, round1, weightedAverage } from "./math";

export function riskScore(opts: {
  balanceSheet?: number;
  volatilityPenalty?: number;
  debtToEquity?: number;
}) {
  const parts: number[] = [];
  if (opts.balanceSheet != null) parts.push(opts.balanceSheet);
  if (opts.volatilityPenalty != null) {
    parts.push(clamp(100 - opts.volatilityPenalty * 1.6));
  }
  if (opts.debtToEquity != null) {
    const de = opts.debtToEquity > 5 ? opts.debtToEquity / 100 : opts.debtToEquity;
    parts.push(clamp(95 - de * 30));
  }
  if (parts.length === 0) return undefined;
  return round1(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function overallScore(opts: {
  fundamental?: number;
  technical?: number;
  risk?: number;
}) {
  return weightedAverage([
    { value: opts.fundamental ?? NaN, weight: WEIGHTS.fundamental },
    { value: opts.technical ?? NaN, weight: WEIGHTS.technical },
    { value: opts.risk ?? NaN, weight: WEIGHTS.risk },
  ]);
}

export function dataConfidence(fields: Array<unknown>) {
  const present = fields.filter((f) => f != null && f !== "").length;
  if (fields.length === 0) return 0;
  return round1(present / fields.length);
}
