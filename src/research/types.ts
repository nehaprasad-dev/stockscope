export type EvidenceSource = {
  source: string;
  url: string;
  claim: string;
  retrievedAt: string;
};

export type TechnicalSignals = {
  price?: number;
  ma50?: number;
  ma200?: number;
  changePercent?: number;
  week52High?: number;
  week52Low?: number;
  volume?: number;
  avgVolume?: number;
  relativeReturn3m?: number;
  universeMedianReturn3m?: number;
  volatility?: number;
  sources: EvidenceSource[];
};

export type FundamentalSignals = {
  revenueGrowth?: number;
  earningsGrowth?: number;
  roe?: number;
  profitMargins?: number;
  debtToEquity?: number;
  currentRatio?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  marketCap?: number;
  universeMedianPE?: number;
  sources: EvidenceSource[];
};

export type ResearchNote = {
  summary?: string;
  sources: EvidenceSource[];
  cached?: boolean;
};

export type ScoreBreakdown = {
  overall?: number;
  technical?: number;
  fundamental?: number;
  risk?: number;
  momentum?: number;
  financial?: number;
  confidence?: number;
  components: Record<string, number | undefined>;
};

export type RankedStock = {
  symbol: string;
  name: string;
  sector: string | null;
  rank: number;
  overallScore: number | null;
  technicalScore: number | null;
  fundamentalScore: number | null;
  riskScore: number | null;
  confidence: number | null;
  signal: string | null;
  reason: string | null;
  price: number | null;
  scoredAt: string | null;
};
