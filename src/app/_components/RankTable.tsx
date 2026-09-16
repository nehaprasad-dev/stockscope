import Link from "next/link";
import type { RankedStock } from "@/research/types";
import { confidenceLabel } from "@/scoring/math";

function fmt(n: number | null) {
  return n == null ? "—" : Math.round(n).toString();
}

export function RankTable({ rows }: { rows: RankedStock[] }) {
  if (rows.length === 0) {
    return (
      <p className="border-t border-line pt-8 text-sm text-ink/60">
        No scored stocks yet. Run a scan to see who stands out.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-y border-line text-[11px] uppercase tracking-[0.18em] text-ink/45">
            <th className="py-3 pr-3 font-medium">Rank</th>
            <th className="py-3 pr-3 font-medium">Stock</th>
            <th className="py-3 pr-3 font-medium">Score</th>
            <th className="py-3 pr-3 font-medium">Technical</th>
            <th className="py-3 pr-3 font-medium">Fundamental</th>
            <th className="py-3 pr-3 font-medium">Signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-b border-line/80">
              <td className="py-4 pr-3 font-serif text-lg">{row.rank}</td>
              <td className="py-4 pr-3">
                <Link href={`/stocks/${row.symbol}`} className="group block">
                  <div className="font-medium">{row.symbol}</div>
                  <div className="max-w-xs text-sm text-ink/55 group-hover:text-ink">
                    {row.name}
                  </div>
                </Link>
              </td>
              <td className="py-4 pr-3 font-serif text-2xl">{fmt(row.overallScore)}</td>
              <td className="py-4 pr-3">{fmt(row.technicalScore)}</td>
              <td className="py-4 pr-3">{fmt(row.fundamentalScore)}</td>
              <td className="py-4 pr-3">
                <div>{row.signal ?? "—"}</div>
                <div className="text-xs text-ink/45">
                  {confidenceLabel(row.confidence) ?? "No confidence"} conf.
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
