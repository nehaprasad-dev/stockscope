import { runScan } from "../src/scans/runScan";

async function main() {
  const scan = await runScan();
  const withFund = scan.ranked.filter((row) => row.fundamentalScore != null).length;
    console.log(
    JSON.stringify(
      {
        status: scan.status,
        phase: scan.phase,
        analyzed: scan.stocksAnalyzed,
        withFundamentals: withFund,
        payloadKB: Math.round(JSON.stringify(scan).length / 1024),
        error: scan.error,
        top: scan.ranked.slice(0, 8).map((row) => ({
          rank: row.rank,
          symbol: row.symbol,
          overall: row.overallScore,
          technical: row.technicalScore,
          fundamental: row.fundamentalScore,
          confidence: row.confidence,
        })),
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
