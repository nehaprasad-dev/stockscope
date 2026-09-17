"use client";

import { Disclaimer } from "./Disclaimer";
import { formatStamp } from "@/lib/dates";
import { loadScan } from "@/scans/clientStore";
import { confidenceLabel, signalLabel } from "@/scoring/math";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StockScanDetail } from "@/scans/types";

function ScoreRow({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line py-3">
      <span>{label}</span>
      <span className="font-serif text-2xl">
        {value == null ? "—" : Math.round(value)}
      </span>
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
  const [detail, setDetail] = useState<StockScanDetail | null | undefined>(undefined);

  useEffect(() => {
    const scan = loadScan();
    setDetail(scan?.details?.[symbol] ?? null);
  }, [symbol]);

  if (detail === undefined) {
    return <p className="text-sm text-ink/55">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-ink/45">
        ← Scanner
      </Link>

      <section>
        <p className="text-xs uppercase tracking-[0.22em] text-ink/45">{sector}</p>
        <h1 className="mt-2 font-serif text-5xl">{symbol}</h1>
        <p className="mt-2 text-lg text-ink/65">{name}</p>
        <div className="mt-6 flex items-end gap-4">
          <div className="font-serif text-6xl">
            {detail?.overallScore == null ? "—" : Math.round(detail.overallScore)}
            <span className="text-2xl text-ink/40"> / 100</span>
          </div>
          <div className="pb-2 text-sm">
            {signalLabel(detail?.overallScore) ?? "Not scored"}
            <div className="text-ink/45">
              Confidence: {confidenceLabel(detail?.confidence) ?? "n/a"}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink/50">
          Data checked {formatStamp(detail?.scoredAt) ?? "not yet scanned"}.
        </p>
      </section>

      {!detail ? (
        <p className="max-w-xl text-lg leading-8">
          This name is in the Nifty 500 list, but it is not in the last full scan stored
          in this browser. Run Scan Nifty 500 from the home page first.
        </p>
      ) : (
        <>
          <section>
            <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">Breakdown</h2>
            <div className="mt-2 max-w-md">
              <ScoreRow label="Technical" value={detail.technicalScore} />
              <ScoreRow label="Fundamental" value={detail.fundamentalScore} />
              <ScoreRow label="Momentum" value={detail.momentum} />
              <ScoreRow label="Financial" value={detail.financial} />
              <ScoreRow label="Risk" value={detail.riskScore} />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
              Why this stock scored well
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8">{detail.reason}</p>
          </section>

          {detail.standout.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
                Why it stands out
              </h2>
              <ul className="mt-4 grid gap-2 text-lg">
                {detail.standout.map((item) => (
                  <li key={item}>↑ {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.watch.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">What to watch</h2>
              <ul className="mt-4 grid gap-2 text-lg">
                {detail.watch.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.researchNotes?.length ? (
            <section>
              <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
                Vaaya research
              </h2>
              <ul className="mt-4 grid gap-2 text-lg">
                {detail.researchNotes.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
                Technical signals
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt>Trend</dt><dd>{detail.technicalLabels.trend ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Momentum</dt><dd>{detail.technicalLabels.momentum ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Relative strength</dt><dd>{detail.technicalLabels.relative ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Volatility</dt><dd>{detail.technicalLabels.volatility ?? "—"}</dd></div>
              </dl>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
                Fundamental signals
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt>Revenue growth</dt><dd>{detail.fundamentalLabels.revenueGrowth ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Profit growth</dt><dd>{detail.fundamentalLabels.profitGrowth ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>ROE</dt><dd>{detail.fundamentalLabels.roe ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Debt</dt><dd>{detail.fundamentalLabels.debt ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Valuation</dt><dd>{detail.fundamentalLabels.valuation ?? "—"}</dd></div>
              </dl>
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">Research sources</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {detail.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                    {source.source}
                  </a>
                  <span className="text-ink/50"> — {source.claim}</span>
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
