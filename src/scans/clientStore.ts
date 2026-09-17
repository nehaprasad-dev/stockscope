import type { ScanPayload } from "./types";
import { SCAN_STORAGE_KEY } from "./types";

export function loadScan(): ScanPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SCAN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScanPayload;
  } catch {
    return null;
  }
}

export function saveScan(payload: ScanPayload) {
  try {
    window.localStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("nifty500-scan"));
  } catch {
    throw new Error("Scan finished but this browser could not store the results.");
  }
}
