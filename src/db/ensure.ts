import { parseNifty500Csv } from "@/stocks/parseUniverse";
import { prisma } from "./prisma";

let ready: Promise<void> | null = null;

export function ensureDb() {
  if (!ready) ready = bootstrap();
  return ready;
}

async function bootstrap() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Stock" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "symbol" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "sector" TEXT,
      "exchange" TEXT NOT NULL DEFAULT 'NSE',
      "website" TEXT,
      "isin" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Stock_symbol_key" ON "Stock"("symbol");`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ScanRun" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "status" TEXT NOT NULL DEFAULT 'queued',
      "phase" TEXT,
      "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" DATETIME,
      "stocksAnalyzed" INTEGER NOT NULL DEFAULT 0,
      "stocksShortlisted" INTEGER NOT NULL DEFAULT 0,
      "error" TEXT
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StockSnapshot" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "stockId" TEXT NOT NULL,
      "scanRunId" TEXT,
      "price" REAL,
      "technicalData" TEXT,
      "fundamentalData" TEXT,
      "researchData" TEXT,
      "technicalScore" REAL,
      "fundamentalScore" REAL,
      "riskScore" REAL,
      "overallScore" REAL,
      "confidence" REAL,
      "reason" TEXT,
      "riskSummary" TEXT,
      "scoredAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE,
      FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE SET NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "StockSnapshot_stockId_scoredAt_idx" ON "StockSnapshot"("stockId", "scoredAt");`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "StockSnapshot_scanRunId_idx" ON "StockSnapshot"("scanRunId");`,
  );

  const count = await prisma.stock.count();
  if (count > 0) return;

  const rows = parseNifty500Csv();
  const now = new Date();
  const chunk = 100;
  for (let i = 0; i < rows.length; i += chunk) {
    await prisma.stock.createMany({
      data: rows.slice(i, i + chunk).map((row) => ({
        symbol: row.symbol,
        name: row.name,
        sector: row.sector,
        exchange: row.exchange,
        isin: row.isin,
        isActive: true,
        updatedAt: now,
      })),
    });
  }
}
