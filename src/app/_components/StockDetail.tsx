"use client";

import { Disclaimer } from "./Disclaimer";
import { ScoreMeter, SignalBadge } from "./Marks";
import { formatStamp } from "@/lib/dates";
import { loadScan } from "@/scans/clientStore";
import { confidenceLabel, signalLabel } from "@/scoring/math";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StockScanDetail } from "@/scans/types";

function ScoreRow({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-ink/55">{label}</span>
        <span className="font-medium">{value == null ? "—" : Math.round(value)}</span>
      </div>
      <ScoreMeter value={value} />
    </div>
  );
}

export function StockDetail({
  symbol,
  name,
  sector,
}: {
  symbol: string;
  name: string;
  sector: string;
}) {
  const { isSignedIn } = useAuth();
  const [detail, setDetail] = useState<StockScanDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!isSignedIn) {
      setDetail(null);
      return;
    }
    const scan = loadScan();
    setDetail(scan?.details?.[symbol] ?? null);
  }, [symbol, isSignedIn]);

  if (detail === undefined) {
    return <p className="text-sm text-ink/55">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-14">
      <Link href="/" className="text-sm text-ink/45 transition hover:text-navy">
        ← Scanner
      </Link>

      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm text-navy">{sector}</p>
          <h1 className="font-serif mt-2 text-6xl tracking-tight">{symbol}</h1>
          <p className="mt-2 text-lg text-ink/55">{name}</p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_20px_50px_-28px_rgba(20,50,92,0.28)]">
          <div className="flex items-end justify-between gap-4">
            <div className="font-serif text-6xl tracking-tight">
              {detail?.overallScore == null ? "—" : Math.round(detail.overallScore)}
              <span className="text-xl text-ink/30"> / 100</span>
            </div>
            <SignalBadge signal={signalLabel(detail?.overallScore)} />
          </div>
          <div className="mt-4">
            <ScoreMeter value={detail?.overallScore} />
          </div>
          <p className="mt-4 text-sm text-ink/45">
            Confidence {confidenceLabel(detail?.confidence) ?? "n/a"} · checked{" "}
            {formatStamp(detail?.scoredAt) ?? "not yet scanned"}
          </p>
        </div>
      </section>

      {!detail ? (
        <p className="max-w-xl text-lg leading-8 text-ink/60">
          This name is in the Nifty 500 list, but it is not in the last full scan stored
          in this browser. Run Scan Nifty 500 from the home page first.
        </p>
      ) : (
        <>
          <section className="grid gap-10 md:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white px-6 py-2">
              <h2 className="pt-4 text-sm text-ink/40">Breakdown</h2>
              <ScoreRow label="Technical" value={detail.technicalScore} />
              <ScoreRow label="Fundamental" value={detail.fundamentalScore} />
              <ScoreRow label="Momentum" value={detail.momentum} />
              <ScoreRow label="Financial" value={detail.financial} />
              <ScoreRow label="Risk" value={detail.riskScore} />
            </div>
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-sm text-ink/40">Why this stock scored well</h2>
                <p className="mt-3 text-lg leading-8 text-ink/75">{detail.reason}</p>
              </div>
              {detail.standout.length ? (
                <div>
                  <h2 className="text-sm text-ink/40">Why it stands out</h2>
                  <ul className="mt-3 grid gap-2 text-[15px]">
                    {detail.standout.map((item) => (
                      <li key={item} className="text-navy">↑ {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {detail.watch.length ? (
                <div>
                  <h2 className="text-sm text-ink/40">What to watch</h2>
                  <ul className="mt-3 grid gap-2 text-[15px] text-ink/70">
                    {detail.watch.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          {detail.researchNotes?.length ? (
            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-sm text-ink/40">Vaaya research</h2>
              <ul className="mt-4 grid gap-3 text-[15px] leading-7 text-ink/70">
                {detail.researchNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-sm text-ink/40">Technical signals</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Trend</dt><dd>{detail.technicalLabels.trend ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Momentum</dt><dd>{detail.technicalLabels.momentum ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Relative strength</dt><dd>{detail.technicalLabels.relative ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Volatility</dt><dd>{detail.technicalLabels.volatility ?? "—"}</dd></div>
              </dl>
            </div>
            <div className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-sm text-ink/40">Fundamental signals</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Revenue growth</dt><dd>{detail.fundamentalLabels.revenueGrowth ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Profit growth</dt><dd>{detail.fundamentalLabels.profitGrowth ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">ROE</dt><dd>{detail.fundamentalLabels.roe ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Debt</dt><dd>{detail.fundamentalLabels.debt ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink/45">Valuation</dt><dd>{detail.fundamentalLabels.valuation ?? "—"}</dd></div>
              </dl>
            </div>
          </section>

          <section>
            <h2 className="text-sm text-ink/40">Research sources</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {detail.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} className="text-navy underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                    {source.source}
                  </a>
                  <span className="text-ink/40"> — {source.claim}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Disclaimer />
    </div>
  );
}
