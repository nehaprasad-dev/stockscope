import { Disclaimer } from "./_components/Disclaimer";
import { Filters } from "./_components/Filters";
import { RankTable } from "./_components/RankTable";
import { ScanButton } from "./_components/ScanButton";
import { formatStamp } from "@/lib/dates";
import { getDashboard } from "@/stocks/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Search = { view?: string; sort?: string };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const view = (["all", "10", "25", "50"].includes(params.view ?? "")
    ? params.view
    : "10") as "all" | "10" | "25" | "50";
  const sort = (["overall", "technical", "fundamental"].includes(params.sort ?? "")
    ? params.sort
    : "overall") as "overall" | "technical" | "fundamental";

  const data = await getDashboard(view);
  const rows = [...data.ranked]
    .sort((a, b) => {
      const pick = (row: (typeof data.ranked)[number]) => {
        if (sort === "technical") return row.technicalScore;
        if (sort === "fundamental") return row.fundamentalScore;
        return row.overallScore;
      };
      return (pick(b) ?? -1) - (pick(a) ?? -1);
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const last = data.scan?.completedAt ?? data.scan?.startedAt;
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
          {data.universeCount === 0 ? (
            <p className="mt-4 text-sm text-rust">
              Could not load the Nifty 500 list. Refresh once — production seeds it
              automatically.
            </p>
          ) : null}
        </div>
        <ScanButton busy={data.scan?.status === "running"} />
      </section>

      <section className="flex flex-wrap gap-8 border-y border-line py-6 text-sm">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Last updated</div>
          <div className="mt-1">{formatStamp(last) ?? "Not scanned yet"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Universe</div>
          <div className="mt-1">{data.universeCount} companies</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Stocks analyzed</div>
          <div className="mt-1">{data.scan?.stocksAnalyzed ?? 0}</div>
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
