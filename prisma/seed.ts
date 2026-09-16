import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { parseNifty500Csv } from "../src/stocks/parseUniverse";

const prisma = new PrismaClient({
  datasources: {
    db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` },
  },
});

async function main() {
  const rows = parseNifty500Csv();
  for (const row of rows) {
    await prisma.stock.upsert({
      where: { symbol: row.symbol },
      create: {
        symbol: row.symbol,
        name: row.name,
        sector: row.sector,
        exchange: row.exchange,
        isin: row.isin,
        isActive: true,
      },
      update: {
        name: row.name,
        sector: row.sector,
        isin: row.isin,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${rows.length} Nifty 500 stocks`);
}

main()
  .finally(() => prisma.$disconnect());
