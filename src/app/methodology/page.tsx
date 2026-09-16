import { WEIGHTS } from "@/scoring/weights";
import Link from "next/link";

export default function MethodologyPage() {
  return (
    <article className="prose-none flex max-w-2xl flex-col gap-6 text-[17px] leading-8">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-ink/45">
        ← Scanner
      </Link>
      <h1 className="font-serif text-5xl leading-tight">Methodology</h1>
      <p>
        This is a Nifty 500 stock research and ranking dashboard. It is research only —
        not investment advice, and it does not tell you to buy or sell anything.
      </p>
      <p>
        Score combines technical momentum, trend, fundamentals, valuation and risk
        signals. It is a research score, not investment advice.
      </p>
      <h2 className="mt-4 font-serif text-3xl">How a scan works</h2>
      <p>
        The product always starts from a seeded Nifty 500 universe. A scan first pulls
        bulk market quotes, runs a cheap screen, then spends richer chart history (and
        optional Vaaya research) only on a shortlist. That keeps 500 × many paid calls
        from becoming the default.
      </p>
      <h2 className="mt-4 font-serif text-3xl">Scoring</h2>
      <p>
        Numbers come from deterministic functions, not from asking a model to invent a
        0–100 score. The current weights are configurable:
      </p>
      <p>
        Overall = {WEIGHTS.fundamental * 100}% fundamental + {WEIGHTS.technical * 100}%
        technical + {WEIGHTS.risk * 100}% risk/quality.
      </p>
      <p>
        Missing fields are skipped. Rank also uses confidence (how complete the data
        was) and freshness (when it was last checked), so a high score with stale or
        thin data does not automatically sit on top.
      </p>
      <h2 className="mt-4 font-serif text-3xl">Sources</h2>
      <p>
        Screening uses public Yahoo Finance quote and chart fields, with NSE / Screener /
        Trendlyne / Indian Stock Picker linked for further reading. Those sites are not
        scraped for scoring. If a Vaaya API key is present, one bundled research call
        runs on the shortlist and evidence URLs are stored with the snapshot.
      </p>
    </article>
  );
}
