export type UniverseStock = {
  symbol: string;
  name: string;
  sector: string;
  exchange: "NSE";
  isin?: string;
  isActive: true;
};

import universe from "./nifty500.json";

export function parseNifty500Csv(): UniverseStock[] {
  return universe as UniverseStock[];
}
