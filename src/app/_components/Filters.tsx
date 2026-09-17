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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-line">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={`/?view=${item.id}&sort=${sort}`}
            className={`rounded-full px-3.5 py-1.5 text-xs transition ${
              view === item.id ? "bg-navy text-paper" : "text-ink/60 hover:text-navy"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-line">
        {SORTS.map((item) => (
          <Link
            key={item.id}
            href={`/?view=${view}&sort=${item.id}`}
            className={`rounded-full px-3.5 py-1.5 text-xs transition ${
              sort === item.id ? "bg-navy text-paper" : "text-ink/60 hover:text-navy"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
