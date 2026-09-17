"use client";

import { saveScan } from "@/scans/clientStore";
import type { ScanPayload } from "@/scans/types";
import { useState } from "react";

const PHASES = [
  "Fetching Nifty 500 prices...",
  "Building one-year charts...",
  "Checking fundamentals...",
  "Vaaya research on the shortlist...",
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
        const creditsRequired = res.status === 402;
        const creditsUrl =
          (typeof body.creditsUrl === "string" && body.creditsUrl) ||
          scan?.creditsUrl;
        setError(
          creditsRequired && creditsUrl
            ? `${body.error ?? scan?.error ?? "Vaaya credits are required."} ${creditsUrl}`
            : (body.error ?? scan?.error ?? "Scan could not finish."),
        );
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
        className="w-fit rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper shadow-[0_10px_30px_-12px_rgba(20,50,92,0.7)] transition hover:bg-navy/90 disabled:opacity-60"
      >
        {running ? phase ?? "Scanning…" : "Scan Nifty 500"}
      </button>
      {error ? (
        <p className="max-w-sm text-sm text-ink/80">
          {error.replace("https://vaaya.ai/balance", "").trim()}{" "}
          {error.includes("vaaya.ai/balance") ? (
            <a
              href="https://vaaya.ai/balance"
              className="text-navy underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Add Vaaya credits
            </a>
          ) : null}
        </p>
      ) : null}
      <p className="max-w-sm text-[13px] leading-6 text-ink/45">
        Full index first. Vaaya research on the shortlist. Missing fields stay blank.
      </p>
    </div>
  );
}
