import type { FundamentalSignals, TechnicalSignals } from "@/research/types";
import { describeMomentum, describeTrend, describeVolatility } from "@/scoring/technicalScore";
import { formatPct, formatRatio } from "@/scoring/fundamentalScore";

function pushIf(list: string[], cond: boolean, text: string) {
  if (cond) list.push(text);
}

export function explainScore(opts: {
  name: string;
  overall?: number;
  technical?: number;
  fundamental?: number;
  tech: TechnicalSignals;
  fund: FundamentalSignals;
  techParts: Record<string, number | undefined>;
  fundParts: Record<string, number | undefined>;
}) {
  const standout: string[] = [];
  const watch: string[] = [];

  pushIf(standout, (opts.fundParts.profitability ?? 0) >= 70, "Healthy profitability");
  pushIf(standout, (opts.fundParts.growth ?? 0) >= 70, "Strong earnings / revenue trend");
  pushIf(standout, (opts.fundParts.balanceSheet ?? 0) >= 70, "Healthy balance sheet");
  pushIf(standout, (opts.techParts.momentum ?? 0) >= 70, "Positive price momentum");
  pushIf(standout, (opts.techParts.trend ?? 0) >= 70, "Price trend above key averages");
  pushIf(standout, (opts.techParts.relative ?? 0) >= 70, "Outperforming the scanned universe");

  pushIf(watch, (opts.fundParts.valuation ?? 100) <= 45, "Valuation looks stretched versus the universe");
  pushIf(watch, (opts.fundParts.balanceSheet ?? 100) <= 45, "Leverage / liquidity needs watching");
  pushIf(watch, (opts.techParts.volatilityPenalty ?? 0) >= 32, "Price movement is relatively unstable");
  pushIf(watch, (opts.techParts.momentum ?? 100) <= 40, "Momentum is weak");
  pushIf(watch, (opts.techParts.trend ?? 100) <= 40, "Trend is below key moving averages");

  if (standout.length === 0) {
    standout.push("Limited confirmed strengths in the available data");
  }
  if (watch.length === 0) {
    watch.push("Scores can change as new market data arrives");
  }

  const bits: string[] = [];
  if ((opts.techParts.momentum ?? 0) >= 60) bits.push("positive price momentum");
  if ((opts.fundParts.growth ?? 0) >= 60) bits.push("improving earnings trends");
  if ((opts.fundParts.profitability ?? 0) >= 60) bits.push("healthy profitability");
  if ((opts.fundParts.balanceSheet ?? 0) >= 60) bits.push("a relatively healthy balance sheet");

  const narrative =
    bits.length > 0
      ? `${opts.name} scored well primarily because of ${bits.join(", ")}.`
      : `${opts.name} has a mixed research score based on the fields that were actually available. Missing inputs were omitted rather than invented.`;

  return {
    narrative,
    standout: standout.slice(0, 3),
    watch: watch.slice(0, 3),
    technicalLabels: {
      trend: describeTrend(opts.tech),
      momentum: describeMomentum(opts.techParts.momentum),
      relative:
        opts.tech.relativeReturn3m == null
          ? "Insufficient data"
          : (opts.techParts.relative ?? 50) >= 60
            ? "Strong"
            : (opts.techParts.relative ?? 50) >= 45
              ? "In-line"
              : "Lagging",
      volatility: describeVolatility(opts.tech.volatility),
    },
    fundamentalLabels: {
      revenueGrowth: formatPct(opts.fund.revenueGrowth),
      profitGrowth: formatPct(opts.fund.earningsGrowth),
      roe: formatPct(opts.fund.roe),
      debt: formatRatio(
        opts.fund.debtToEquity != null && opts.fund.debtToEquity > 5
          ? opts.fund.debtToEquity / 100
          : opts.fund.debtToEquity,
      ),
      valuation:
        opts.fund.trailingPE != null
          ? `${opts.fund.trailingPE.toFixed(1)}x trailing P/E`
          : "Insufficient data",
    },
  };
}
