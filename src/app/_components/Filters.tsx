import Link from "next/link";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "10", label: "Top 10" },
  { id: "25", label: "Top 25" },
  { id: "50", label: "Top 50" },
] as const;

const SORTS = [
  { id: "overall", label: "Overall" },
  { id: "technical", label: "Technical" },
  { id: "fundamental", label: "Fundamental" },
] as const;

export function Filters({
  view,
  sort,
}: {
  view: string;
  sort: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={`/?view=${item.id}&sort=${sort}`}
            className={`rounded-full px-3 py-1 text-xs tracking-wide ${
              view === item.id ? "bg-ink text-paper" : "border border-line text-ink/70"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SORTS.map((item) => (
          <Link
            key={item.id}
            href={`/?view=${view}&sort=${item.id}`}
            className={`rounded-full px-3 py-1 text-xs tracking-wide ${
              sort === item.id ? "bg-ink text-paper" : "border border-line text-ink/70"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
