export const WEIGHTS = {
  fundamental: 0.5,
  technical: 0.4,
  risk: 0.1,
} as const;

export const TECHNICAL_WEIGHTS = {
  trend: 0.3,
  momentum: 0.25,
  volume: 0.15,
  relative: 0.2,
  volatilityPenalty: 0.1,
} as const;

export const FUNDAMENTAL_WEIGHTS = {
  growth: 0.25,
  profitability: 0.25,
  balanceSheet: 0.2,
  valuation: 0.15,
  quality: 0.15,
} as const;
