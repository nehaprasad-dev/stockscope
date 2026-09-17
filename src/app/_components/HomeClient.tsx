"use client";

import { Disclaimer } from "./Disclaimer";
import { Filters } from "./Filters";
import { RankTable } from "./RankTable";
import { ScanButton } from "./ScanButton";
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
    <div className="flex flex-col gap-12">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-rust">Nifty 500</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.05] sm:text-6xl">
            Nifty 500 Stock Scanner
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Research the Nifty 500 using technical and fundamental signals, then see
            which stocks stand out.
          </p>
        </div>
        <ScanButton />
      </section>

      <section className="flex flex-wrap gap-8 border-y border-line py-6 text-sm">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Last updated</div>
          <div className="mt-1">{formatStamp(scan?.completedAt) ?? "Not scanned yet"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Universe</div>
          <div className="mt-1">{universeCount} companies</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Stocks analyzed</div>
          <div className="mt-1">{scan?.stocksAnalyzed ?? 0}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Vaaya shortlist</div>
          <div className="mt-1">{scan?.stocksShortlisted ?? 0}</div>
        </div>
      </section>

      {top.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">Top stocks</h2>
          <ol className="mt-5 grid gap-4">
            {top.map((row) => (
              <li key={row.symbol}>
                <Link
                  href={`/stocks/${row.symbol}`}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <div>
                    <span className="mr-3 text-ink/40">{row.rank}</span>
                    <span className="font-medium">{row.symbol}</span>
                    <p className="mt-1 max-w-xl text-sm text-ink/55">{row.reason}</p>
                  </div>
                  <div className="font-serif text-3xl">{Math.round(row.overallScore ?? 0)}</div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="flex flex-col gap-6">
        <Filters view={view} sort={sort} />
        <RankTable rows={rows} />
      </section>

      <Disclaimer />
    </div>
  );
}
