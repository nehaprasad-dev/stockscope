import { Disclaimer } from "@/app/_components/Disclaimer";
import { latestSnapshotBySymbol } from "@/db/snapshots";
import { formatStamp } from "@/lib/dates";
import { confidenceLabel, signalLabel } from "@/scoring/math";
import { getStock } from "@/stocks/getStock";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

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

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = await getStock(symbol);
  if (!stock) notFound();
  const snapshot = await latestSnapshotBySymbol(stock.symbol);
  const research = parseJson<{
    narrative?: string;
    standout?: string[];
    watch?: string[];
  }>(snapshot?.researchData ?? null);
  const technical = parseJson<{
    labels?: Record<string, string>;
    sources?: Array<{ source: string; url: string; claim: string }>;
    components?: { momentum?: number };
  }>(snapshot?.technicalData ?? null);
  const fundamental = parseJson<{
    labels?: Record<string, string>;
    sources?: Array<{ source: string; url: string; claim: string }>;
    components?: Record<string, number>;
  }>(snapshot?.fundamentalData ?? null);

  const sources = [
    ...(technical?.sources ?? []),
    ...(fundamental?.sources ?? []),
  ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i);

  return (
    <div className="flex flex-col gap-12">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-ink/45">
        ← Scanner
      </Link>

      <section>
        <p className="text-xs uppercase tracking-[0.22em] text-ink/45">{stock.sector}</p>
        <h1 className="mt-2 font-serif text-5xl">{stock.symbol}</h1>
        <p className="mt-2 text-lg text-ink/65">{stock.name}</p>
        <div className="mt-6 flex items-end gap-4">
          <div className="font-serif text-6xl">
            {snapshot?.overallScore == null ? "—" : Math.round(snapshot.overallScore)}
            <span className="text-2xl text-ink/40"> / 100</span>
          </div>
          <div className="pb-2 text-sm">
            {signalLabel(snapshot?.overallScore) ?? "Not scored"}
            <div className="text-ink/45">
              Confidence: {confidenceLabel(snapshot?.confidence) ?? "n/a"}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink/50">
          Data checked {formatStamp(snapshot?.scoredAt) ?? "not yet scanned"}.
        </p>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">Breakdown</h2>
        <div className="mt-2 max-w-md">
          <ScoreRow label="Technical" value={snapshot?.technicalScore} />
          <ScoreRow label="Fundamental" value={snapshot?.fundamentalScore} />
          <ScoreRow label="Momentum" value={technical?.components?.momentum} />
          <ScoreRow label="Financial" value={fundamental?.components?.profitability} />
          <ScoreRow label="Risk" value={snapshot?.riskScore} />
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
          Why this stock scored well
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8">
          {research?.narrative ??
            "This stock has not been scored yet. Run a scan to collect data and calculate a research score."}
        </p>
      </section>

      {research?.standout?.length ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
            Why it stands out
          </h2>
          <ul className="mt-4 grid gap-2 text-lg">
            {research.standout.map((item) => (
              <li key={item}>↑ {item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {research?.watch?.length ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">What to watch</h2>
          <ul className="mt-4 grid gap-2 text-lg">
            {research.watch.map((item) => (
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
            <div className="flex justify-between gap-4"><dt>Trend</dt><dd>{technical?.labels?.trend ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Momentum</dt><dd>{technical?.labels?.momentum ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Relative strength</dt><dd>{technical?.labels?.relative ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Volatility</dt><dd>{technical?.labels?.volatility ?? "—"}</dd></div>
          </dl>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">
            Fundamental signals
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><dt>Revenue growth</dt><dd>{fundamental?.labels?.revenueGrowth ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Profit growth</dt><dd>{fundamental?.labels?.profitGrowth ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>ROE</dt><dd>{fundamental?.labels?.roe ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Debt</dt><dd>{fundamental?.labels?.debt ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Valuation</dt><dd>{fundamental?.labels?.valuation ?? "—"}</dd></div>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.22em] text-ink/45">Research sources</h2>
        <ul className="mt-4 grid gap-3 text-sm">
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                {source.source}
              </a>
              <span className="text-ink/50"> — {source.claim}</span>
            </li>
          ))}
        </ul>
      </section>

      <Disclaimer />
    </div>
  );
}
