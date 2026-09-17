export function SignalBadge({ signal }: { signal: string | null }) {
  const warm = signal === "Strong" || signal === "Positive";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
        warm ? "bg-navy/10 text-navy" : "bg-ink/[0.04] text-ink/50"
      }`}
    >
      {signal ?? "—"}
    </span>
  );
}

export function ScoreMeter({ value }: { value?: number | null }) {
  const width = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-navy transition-[width] duration-700"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
