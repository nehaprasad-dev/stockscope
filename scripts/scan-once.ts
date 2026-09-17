import { runScan } from "../src/scans/runScan";

async function main() {
  const scan = await runScan({ limit: 1, shortlistSize: 1 });
  console.log(
    JSON.stringify(
      {
        status: scan.status,
        phase: scan.phase,
        analyzed: scan.stocksAnalyzed,
        shortlisted: scan.stocksShortlisted,
        error: scan.error,
        top: scan.ranked.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
