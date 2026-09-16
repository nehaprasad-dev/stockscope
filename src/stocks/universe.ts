export type { UniverseStock } from "./parseUniverse";
export { parseNifty500Csv, parseNifty500Csv as nifty500UniverseRaw } from "./parseUniverse";

import { parseNifty500Csv } from "./parseUniverse";
import type { UniverseStock } from "./parseUniverse";

export function nifty500Universe(): UniverseStock[] {
  return parseNifty500Csv();
}
