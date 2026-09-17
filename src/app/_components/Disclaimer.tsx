import Link from "next/link";

export function Disclaimer() {
  return (
    <p className="text-xs leading-5 text-ink/50">
      Research only — not investment advice. Scores combine technical momentum, trend,
      fundamentals, valuation and risk signals from available data. Missing inputs are
      omitted instead of invented.{" "}
      <Link href="/methodology" className="text-navy underline underline-offset-4">
        Methodology
      </Link>
      . Scores may change as new market data becomes available.
    </p>
  );
}
