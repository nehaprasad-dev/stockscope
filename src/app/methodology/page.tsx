import { WEIGHTS } from "@/scoring/weights";
import Link from "next/link";

export default function MethodologyPage() {
  return (
    <article className="prose-none flex max-w-2xl flex-col gap-6 text-[17px] leading-8">
      <Link href="/" className="text-sm text-ink/50 hover:text-navy">
        ← Scanner
      </Link>
      <h1 className="font-serif text-6xl tracking-tight">Methodology</h1>
      <p>
        This is a Nifty 500 stock research and ranking dashboard. It is research only —
        not investment advice, and it does not tell you to buy or sell anything.
      </p>
      <h2 className="mt-4 text-2xl font-medium tracking-tight">How a scan works</h2>
      <p>
        Every scan starts from the full Nifty 500 constituent list. There is no 1 / 10 /
        50 demo subset. The pipeline is:
      </p>
      <ol className="list-decimal pl-5">
        <li>Load the official Nifty 500 universe.</li>
        <li>Pull one NSE bhavcopy zip for end-of-day prices and volume.</li>
        <li>Pull one-year daily charts for every name (trend, 52-week range, 3-month return, volatility).</li>
        <li>
          Pull reported fundamentals by ISIN (ROE, trailing P/E, debt-to-equity, revenue
          and profit growth, margins) where the source actually has them.
        </li>
        <li>Score with TypeScript. Missing fields are skipped, never invented.</li>
        <li>
          Send a shortlist of about 30 names to Vaaya: one batched quote read, plus one
          web/news research call with cited URLs. That is required. The model explains
          and cites; it does not invent the 0–100 score.
        </li>
        <li>Rank by overall score × confidence × freshness.</li>
      </ol>
      <p>
        Filters on the home page (Top 10 / 25 / 50 / All) only change what is shown
        after the full index has been ranked.
      </p>
      <h2 className="mt-4 text-2xl font-medium tracking-tight">Scoring</h2>
      <p>
        Numbers come from deterministic functions, not from asking a model to invent a
        0–100 score. The current weights are:
      </p>
      <p>
        Overall = {WEIGHTS.fundamental * 100}% fundamental + {WEIGHTS.technical * 100}%
        technical + {WEIGHTS.risk * 100}% risk/quality.
      </p>
      <p>
        Missing fields are skipped, then the rest is normalized. Rank also uses
        confidence (how complete the data was) and freshness (when it was last checked),
        so a high score with thin data does not automatically sit on top.
      </p>
      <h2 className="mt-4 text-2xl font-medium tracking-tight">Sources</h2>
      <p>
        Prices come from NSE bhavcopy. Charts come from Yahoo Finance. Fundamental
        ratios and statements come from Groww’s public company JSON, keyed by ISIN.
        If a name is missing there, Tickertape ratios are used when present. Vaaya then
        runs on the shortlist for batched quotes and cited news/research. Screener,
        Trendlyne, NSE quote pages, and Indian Stock Picker are linked for further
        reading. Those sites are not scraped for scoring. A scan does not finish if
        Vaaya credits are missing.
      </p>
    </article>
  );
}
