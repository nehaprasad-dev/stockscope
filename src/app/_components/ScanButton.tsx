"use client";

import { saveScan } from "@/scans/clientStore";
import type { ScanPayload } from "@/scans/types";
import { useState } from "react";

const PHASES = [
  "Fetching Nifty 500 prices...",
  "Building one-year charts...",
  "Reading fundamentals...",
  "Scoring and ranking...",
];

export function ScanButton() {
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = phase != null;

  async function start() {
    setError(null);
    setPhase(PHASES[0]);
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, PHASES.length - 1);
      setPhase(PHASES[i]);
    }, 4000);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      const scan = body.scan as ScanPayload | undefined;
      if (!res.ok || !scan || scan.status === "failed") {
        setError(body.error ?? scan?.error ?? "Scan could not finish.");
        return;
      }
      saveScan(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan could not start.");
    } finally {
      clearInterval(timer);
      setPhase(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="rounded-full bg-rust px-6 py-3 text-sm font-medium text-paper disabled:opacity-60"
      >
        {running ? phase ?? "Scanning…" : "Scan Nifty 500"}
      </button>
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      <p className="max-w-md text-xs leading-5 text-ink/55">
        Always scans the full index: official NSE prices, one-year charts for every
        name, then reported fundamentals where they exist. Missing fields stay blank.
        Results stay in this browser.
      </p>
    </div>
  );
}
