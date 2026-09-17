import Link from "next/link";
import type { RankedStock } from "@/research/types";
import { confidenceLabel } from "@/scoring/math";
import { SignalBadge } from "./Marks";

function fmt(n: number | null) {
  return n == null ? "—" : Math.round(n).toString();
}

export function RankTable({ rows }: { rows: RankedStock[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center text-sm text-ink/50">
        No scored stocks yet. Scan the Nifty 500 to see who stands out.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.16em] text-ink/40">
            <th className="px-5 py-4 font-medium">Rank</th>
            <th className="px-3 py-4 font-medium">Stock</th>
            <th className="px-3 py-4 font-medium">Score</th>
            <th className="px-3 py-4 font-medium">Technical</th>
            <th className="px-3 py-4 font-medium">Fundamental</th>
            <th className="px-5 py-4 font-medium">Signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-t border-line transition hover:bg-[#f7f8fb]">
              <td className="px-5 py-4 text-sm text-ink/40">{row.rank}</td>
              <td className="px-3 py-4">
                <Link href={`/stocks/${row.symbol}`} className="group block">
                  <div className="font-medium group-hover:text-navy">{row.symbol}</div>
                  <div className="max-w-xs text-sm text-ink/45">{row.name}</div>
                </Link>
              </td>
              <td className="font-serif px-3 py-4 text-2xl">{fmt(row.overallScore)}</td>
              <td className="px-3 py-4 text-ink/70">{fmt(row.technicalScore)}</td>
              <td className="px-3 py-4 text-ink/70">{fmt(row.fundamentalScore)}</td>
              <td className="px-5 py-4">
                <SignalBadge signal={row.signal} />
                <div className="mt-1 text-[11px] text-ink/35">
                  {confidenceLabel(row.confidence) ?? "No"} conf.
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
