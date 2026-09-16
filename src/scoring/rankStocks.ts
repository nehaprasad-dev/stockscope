import type { RankedStock } from "@/research/types";
import { rankingValue, signalLabel } from "./math";

export function rankStocks(rows: RankedStock[]): RankedStock[] {
  const sorted = [...rows].sort((a, b) => {
    const av = rankingValue({
      overall: a.overallScore,
      confidence: a.confidence,
      scoredAt: a.scoredAt,
    });
    const bv = rankingValue({
      overall: b.overallScore,
      confidence: b.confidence,
      scoredAt: b.scoredAt,
    });
    return bv - av;
  });

  return sorted.map((row, i) => ({
    ...row,
    rank: i + 1,
    signal: signalLabel(row.overallScore),
  }));
}
