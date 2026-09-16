import type { TechnicalSignals } from "@/research/types";
import { TECHNICAL_WEIGHTS } from "./weights";
import { clamp, round1, weightedAverage } from "./math";

function trendScore(data: TechnicalSignals) {
  const { price, ma50, ma200 } = data;
  if (price == null || (ma50 == null && ma200 == null)) return undefined;
  let base = 50;
  if (ma50 != null && ma200 != null) {
    if (price > ma50 && price > ma200) base = 82;
    else if (price > ma50) base = 68;
    else if (price > ma200) base = 48;
    else base = 28;
  } else if (ma50 != null) {
    base = price > ma50 ? 70 : 35;
  } else if (ma200 != null) {
    base = price > ma200 ? 72 : 32;
  }
  return clamp(base);
}

function momentumScore(data: TechnicalSignals) {
  const { price, week52High, week52Low, changePercent } = data;
  const parts: number[] = [];
  if (price != null && week52High != null && week52Low != null && week52High > week52Low) {
    parts.push(((price - week52Low) / (week52High - week52Low)) * 100);
  }
  if (changePercent != null) {
    parts.push(clamp(50 + changePercent * 4, 5, 95));
  }
  if (parts.length === 0) return undefined;
  return round1(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function volumeScore(data: TechnicalSignals) {
  if (data.volume == null || data.avgVolume == null || data.avgVolume <= 0) {
    return undefined;
  }
  const ratio = data.volume / data.avgVolume;
  if (ratio >= 1.8) return 88;
  if (ratio >= 1.2) return 74;
  if (ratio >= 0.8) return 62;
  if (ratio >= 0.5) return 48;
  return 32;
}

function relativeScore(data: TechnicalSignals) {
  if (data.relativeReturn3m == null || data.universeMedianReturn3m == null) {
    return undefined;
  }
  const delta = (data.relativeReturn3m - data.universeMedianReturn3m) * 100;
  return clamp(55 + delta * 2.5);
}

function volatilityPenalty(data: TechnicalSignals) {
  if (data.volatility == null) return undefined;
  const v = data.volatility;
  if (v <= 0.18) return 8;
  if (v <= 0.28) return 18;
  if (v <= 0.4) return 32;
  return 48;
}

export function technicalScore(data: TechnicalSignals) {
  const trend = trendScore(data);
  const momentum = momentumScore(data);
  const volume = volumeScore(data);
  const relative = relativeScore(data);
  const volPen = volatilityPenalty(data);

  const raw = weightedAverage([
    { value: trend ?? NaN, weight: TECHNICAL_WEIGHTS.trend },
    { value: momentum ?? NaN, weight: TECHNICAL_WEIGHTS.momentum },
    { value: volume ?? NaN, weight: TECHNICAL_WEIGHTS.volume },
    { value: relative ?? NaN, weight: TECHNICAL_WEIGHTS.relative },
  ]);

  if (raw == null) {
    return { score: undefined, components: { trend, momentum, volume, relative, volatilityPenalty: volPen } };
  }

  const score = volPen != null
    ? round1(clamp(raw - volPen * TECHNICAL_WEIGHTS.volatilityPenalty))
    : raw;

  return {
    score,
    components: { trend, momentum, volume, relative, volatilityPenalty: volPen },
  };
}

export function describeTrend(data: TechnicalSignals) {
  const { price, ma50, ma200 } = data;
  if (price == null || (ma50 == null && ma200 == null)) return "Insufficient data";
  if (ma50 != null && ma200 != null) {
    if (price > ma50 && price > ma200) return "Positive";
    if (price > ma50) return "Short-term positive";
    if (price > ma200) return "Long-term support, short-term weak";
    return "Negative";
  }
  return price > (ma50 ?? ma200 ?? price) ? "Positive" : "Negative";
}

export function describeMomentum(score?: number) {
  if (score == null) return "Insufficient data";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Positive";
  if (score >= 40) return "Moderate";
  return "Weak";
}

export function describeVolatility(vol?: number) {
  if (vol == null) return "Insufficient data";
  if (vol <= 0.18) return "Low";
  if (vol <= 0.28) return "Moderate";
  if (vol <= 0.4) return "Elevated";
  return "High";
}
