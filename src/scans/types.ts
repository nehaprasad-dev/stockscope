import type { EvidenceSource, RankedStock } from "@/research/types";

export const SCAN_STORAGE_KEY = "nifty500-last-scan-v2";

export type StockScanDetail = RankedStock & {
  standout: string[];
  watch: string[];
  technicalLabels: Record<string, string>;
  fundamentalLabels: Record<string, string>;
  sources: EvidenceSource[];
  momentum?: number;
  financial?: number;
  researchNotes?: string[];
};

export type ScanPayload = {
  status: "completed" | "failed";
  phase: string;
  stocksAnalyzed: number;
  stocksShortlisted: number;
  completedAt: string | null;
  error?: string;
  creditsUrl?: string;
  vaayaUsed?: boolean;
  ranked: RankedStock[];
  details: Record<string, StockScanDetail>;
};
