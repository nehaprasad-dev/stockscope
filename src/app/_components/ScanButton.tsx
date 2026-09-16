"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LIMITS = [1, 10, 50, 500] as const;
const PHASES = [
  "Fetching market data...",
  "Analyzing technical signals...",
  "Checking fundamentals...",
  "Ranking stocks...",
];

export function ScanButton({ busy }: { busy: boolean }) {
  const router = useRouter();
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10);
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = busy || phase != null;

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
          shortlistSize: limit <= 50 ? limit : 50,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.scan?.status === "failed") {
        setError(body.scan?.error ?? "Scan could not finish.");
      }
    } catch {
      setError("Scan could not start.");
    } finally {
      clearInterval(timer);
      setPhase(null);
      router.refresh();
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
        Starts with a cheap bulk screen, then deep-scores a shortlist. Default is 10
        stocks so research credits are not wasted. Full 500 is available after the
        pipeline is trusted.
      </p>
    </div>
  );
}
