"use client";

import { saveScan } from "@/scans/clientStore";
import type { ScanPayload } from "@/scans/types";
import { useState } from "react";

const LIMITS = [1, 10, 50, 500] as const;
const PHASES = [
  "Fetching market data...",
  "Analyzing technical signals...",
  "Checking fundamentals...",
  "Ranking stocks...",
];

export function ScanButton() {
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10);
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
    }, 2500);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit,
          shortlistSize: Math.min(10, limit),
        }),
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
      <div className="flex flex-wrap items-center gap-2">
        {LIMITS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLimit(n)}
            className={`rounded-full border px-3 py-1 text-xs tracking-wide ${
              limit === n
                ? "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-ink/70"
            }`}
          >
            {n === 500 ? "Full Nifty 500" : n === 1 ? "1 stock" : `${n} stocks`}
          </button>
        ))}
      </div>
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
        Results stay in this browser after the scan returns. 1, 10, 50, and 500 all
        run from one NSE price file plus a short chart pass.
      </p>
    </div>
  );
}
