import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { ScanPayload } from "./types";

const TTL_MS = 6 * 60 * 60 * 1000;
const FILE = join(tmpdir(), "stockscope-scan-cache.json");

type Cached = { savedAt: number; scan: ScanPayload };

let memory: Cached | null = null;

export function readScanCache(): ScanPayload | null {
  const now = Date.now();
  if (memory && now - memory.savedAt < TTL_MS && memory.scan.status === "completed") {
    return memory.scan;
  }
  try {
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Cached;
    if (now - raw.savedAt < TTL_MS && raw.scan.status === "completed") {
      memory = raw;
      return raw.scan;
    }
  } catch {
    // no shared cache yet
  }
  return null;
}

export function writeScanCache(scan: ScanPayload) {
  if (scan.status !== "completed") return;
  memory = { savedAt: Date.now(), scan };
  try {
    writeFileSync(FILE, JSON.stringify(memory));
  } catch {
    // in-memory cache still helps this instance
  }
}
