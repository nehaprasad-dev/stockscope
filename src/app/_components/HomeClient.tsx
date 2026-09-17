"use client";

import { Disclaimer } from "./Disclaimer";
import { Filters } from "./Filters";
import { RankTable } from "./RankTable";
import { ScanButton } from "./ScanButton";
import { ScoreMeter } from "./Marks";
import { formatStamp } from "@/lib/dates";
import { loadScan } from "@/scans/clientStore";
import type { ScanPayload } from "@/scans/types";
import type { RankedStock } from "@/research/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeClient({
  universeCount,
  view,
  sort,
}: {
  universeCount: number;
  view: "all" | "10" | "25" | "50";
  sort: "overall" | "technical" | "fundamental";
}) {
  const [scan, setScan] = useState<ScanPayload | null>(null);

  useEffect(() => {
    const read = () => setScan(loadScan());
    read();
    window.addEventListener("nifty500-scan", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("nifty500-scan", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const ranked = [...(scan?.ranked ?? [])]
    .sort((a, b) => {
      const pick = (row: RankedStock) => {
        if (sort === "technical") return row.technicalScore;
        if (sort === "fundamental") return row.fundamentalScore;
        return row.overallScore;
      };
      return (pick(b) ?? -1) - (pick(a) ?? -1);
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const limit = view === "all" ? ranked.length : Number(view);
  const rows = ranked.slice(0, limit || ranked.length);
  const top = rows.filter((r) => r.overallScore != null).slice(0, 3);

  return (
    <div className="flex flex-col gap-20">
      <section className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <p className="text-[13px] tracking-wide text-navy">Nifty 500 · research ranking</p>
          <h1 className="font-serif mt-5 max-w-xl text-[3.4rem] leading-[1.05] tracking-tight sm:text-7xl">
            See which stocks
            <br />
            stand out.
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-8 text-ink/60">
            Scan the index. Score technical and fundamental signals. Rank who actually
            stands out — with sources, not a buy button.
          </p>
          <div className="mt-9">
            <ScanButton />
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_80px_-32px_rgba(20,50,92,0.35)]">
          <div className="flex items-center justify-between border-b border-line bg-[#f6f7f9] px-5 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-navy/25" />
              <span className="h-2 w-2 rounded-full bg-navy/15" />
              <span className="h-2 w-2 rounded-full bg-navy/10" />
            </div>
            <p className="text-xs text-ink/45">This browser</p>
          </div>
          <div className="grid grid-cols-3 gap-px border-b border-line bg-line text-center">
            <div className="bg-white px-4 py-4">
              <div className="text-[11px] text-ink/40">Universe</div>
              <div className="mt-1 text-lg font-medium">{universeCount}</div>
            </div>
            <div className="bg-white px-4 py-4">
              <div className="text-[11px] text-ink/40">Analyzed</div>
              <div className="mt-1 text-lg font-medium">{scan?.stocksAnalyzed ?? 0}</div>
            </div>
            <div className="bg-white px-4 py-4">
              <div className="text-[11px] text-ink/40">Vaaya</div>
              <div className="mt-1 text-lg font-medium">{scan?.stocksShortlisted ?? 0}</div>
            </div>
          </div>
          <div className="px-5 py-2">
            {top.length > 0 ? (
              top.map((row) => (
                <Link
                  key={row.symbol}
                  href={`/stocks/${row.symbol}`}
                  className="block border-b border-line/80 py-4 last:border-0"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="mr-3 text-xs text-ink/35">{row.rank}</span>
                      <span className="font-medium">{row.symbol}</span>
                    </div>
                    <span className="font-serif text-2xl">
                      {Math.round(row.overallScore ?? 0)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ScoreMeter value={row.overallScore} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-ink/45">
                Run a scan to fill this ranking.
              </p>
            )}
          </div>
          <p className="border-t border-line px-5 py-3 text-[11px] text-ink/40">
            {scan?.completedAt
              ? `Last scan on this browser · ${formatStamp(scan.completedAt)}`
              : "No scan on this browser yet"}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl tracking-tight">The ranking</h2>
        </div>
        <Filters view={view} sort={sort} />
        <RankTable rows={rows} />
      </section>

      <Disclaimer />
    </div>
  );
}
