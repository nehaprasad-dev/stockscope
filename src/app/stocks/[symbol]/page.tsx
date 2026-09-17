import { StockDetail } from "@/app/_components/StockDetail";
import { parseNifty500Csv } from "@/stocks/parseUniverse";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = parseNifty500Csv().find(
    (row) => row.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  if (!stock) notFound();

  return (
    <StockDetail
      symbol={stock.symbol}
      name={stock.name}
      sector={stock.sector}
    />
  );
}
