import { readFileSync } from "node:fs";
import path from "node:path";

export type UniverseStock = {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE";
  isin?: string;
  isActive: true;
};

export function parseNifty500Csv(filePath?: string): UniverseStock[] {
  const csvPath =
    filePath ?? path.join(process.cwd(), "data", "ind_nifty500list.csv");
  const text = readFileSync(csvPath, "utf8");
  const lines = text.trim().split(/\r?\n/).slice(1);
  const rows: UniverseStock[] = [];
  for (const line of lines) {
    const cols = line.split(",");
    const name = cols[0]?.trim();
    const sector = cols[1]?.trim() || "Unknown";
    const symbol = cols[2]?.trim();
    const isin = cols[4]?.trim();
    if (!symbol || !name) continue;
    rows.push({
      symbol,
      name,
      sector,
      exchange: "NSE",
      isin,
      isActive: true,
    });
  }
  return rows;
}
