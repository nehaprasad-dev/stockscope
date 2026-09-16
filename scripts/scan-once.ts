import { prisma } from "../src/db/prisma";
import { runScan } from "../src/scans/runScan";
import { snapshotsForScan } from "../src/db/snapshots";

async function main() {
  const scan = await runScan({ limit: 1, shortlistSize: 1 });
  const snaps = await snapshotsForScan(scan.id);
  console.log(
    JSON.stringify(
      {
        status: scan.status,
        phase: scan.phase,
        analyzed: scan.stocksAnalyzed,
        shortlisted: scan.stocksShortlisted,
        error: scan.error,
        stocks: snaps.map((s) => ({
          symbol: s.stock.symbol,
          overall: s.overallScore,
          technical: s.technicalScore,
          fundamental: s.fundamentalScore,
          confidence: s.confidence,
          price: s.price,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
