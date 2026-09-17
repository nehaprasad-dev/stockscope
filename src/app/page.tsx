import { HomeClient } from "./_components/HomeClient";
import { ScanArea } from "./_components/ScanArea";
import { parseNifty500Csv } from "@/stocks/parseUniverse";

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

  return (
    <HomeClient
      universeCount={parseNifty500Csv().length}
      view={view}
      sort={sort}
    >
      <ScanArea />
    </HomeClient>
  );
}
