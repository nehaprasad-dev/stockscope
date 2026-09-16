export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function weightedAverage(
  entries: Array<{ value: number; weight: number }>,
) {
  const present = entries.filter((e) => Number.isFinite(e.value) && e.weight > 0);
  if (present.length === 0) return undefined;
  const totalWeight = present.reduce((s, e) => s + e.weight, 0);
  const score = present.reduce((s, e) => s + e.value * e.weight, 0) / totalWeight;
  return round1(clamp(score));
}

export function signalLabel(score: number | null | undefined) {
  if (score == null) return null;
  if (score >= 80) return "Strong";
  if (score >= 65) return "Positive";
  if (score >= 50) return "Mixed";
  return "Weak";
}

export function confidenceLabel(score: number | null | undefined) {
  if (score == null) return null;
  if (score >= 0.75) return "High";
  if (score >= 0.45) return "Medium";
  return "Low";
}

export function freshnessFactor(scoredAt: Date | string | null | undefined) {
  if (!scoredAt) return 0.4;
  const then = typeof scoredAt === "string" ? new Date(scoredAt) : scoredAt;
  const days = (Date.now() - then.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 1) return 1;
  if (days <= 7) return 0.9;
  if (days <= 30) return 0.7;
  if (days <= 90) return 0.45;
  return 0.25;
}

export function rankingValue(opts: {
  overall: number | null;
  confidence: number | null;
  scoredAt: Date | string | null;
}) {
  if (opts.overall == null) return -1;
  const conf = opts.confidence ?? 0.3;
  return opts.overall * (0.55 + 0.45 * conf) * freshnessFactor(opts.scoredAt);
}
