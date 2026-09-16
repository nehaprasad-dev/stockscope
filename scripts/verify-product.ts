import { prisma } from "../src/db/prisma";
import { latestScan } from "../src/db/scans";
import { snapshotsForScan } from "../src/db/snapshots";
import { rankStocks } from "../src/scoring/rankStocks";
import { overallScore } from "../src/scoring/overallScore";
import { technicalScore } from "../src/scoring/technicalScore";

function parse(raw: string | null) {
  if (!raw) return null;
  return JSON.parse(raw);
}

async function main() {
  const universe = await prisma.stock.count({ where: { isActive: true } });
  const scan = await latestScan();
  const snaps = scan ? await snapshotsForScan(scan.id) : [];
  const ranked = rankStocks(
    snaps.map((s) => ({
      symbol: s.stock.symbol,
      name: s.stock.name,
      sector: s.stock.sector,
      rank: 0,
      overallScore: s.overallScore,
      technicalScore: s.technicalScore,
      fundamentalScore: s.fundamentalScore,
      riskScore: s.riskScore,
      confidence: s.confidence,
      signal: null,
      reason: s.reason,
      price: s.price,
      scoredAt: s.scoredAt?.toISOString() ?? null,
    })),
  );

  const sample = snaps[0];
  const tech = sample ? parse(sample.technicalData) : null;
  const fund = sample ? parse(sample.fundamentalData) : null;
  const research = sample ? parse(sample.researchData) : null;

  const recomputed = sample
    ? overallScore({
        fundamental: sample.fundamentalScore ?? undefined,
        technical: sample.technicalScore ?? undefined,
        risk: sample.riskScore ?? undefined,
      })
    : null;

  const inventedFund =
    fund &&
    (fund.revenueGrowth != null || fund.roe != null || fund.trailingPE != null)
      ? "has_fund_fields"
      : "fund_fields_omitted";

  console.log(
    JSON.stringify(
      {
        universe,
        scan: scan
          ? {
              status: scan.status,
              analyzed: scan.stocksAnalyzed,
              shortlisted: scan.stocksShortlisted,
              phase: scan.phase,
              completedAt: scan.completedAt,
            }
          : null,
        ranked: ranked.map((r) => ({
          rank: r.rank,
          symbol: r.symbol,
          overall: r.overallScore,
          technical: r.technicalScore,
          fundamental: r.fundamentalScore,
          confidence: r.confidence,
          signal: r.signal,
        })),
        sample: sample
          ? {
              symbol: sample.stock.symbol,
              storedOverall: sample.overallScore,
              recomputedOverall: recomputed,
              match: sample.overallScore === recomputed,
              inventedFund,
              narrative: research?.narrative,
              standout: research?.standout,
              watch: research?.watch,
              vaayaCalled: Boolean(research?.vaaya),
              vaayaOk: research?.vaaya?.ok ?? research?.vaaya?.error ?? null,
              sourceNames: [
                ...(tech?.sources ?? []),
                ...(fund?.sources ?? []),
              ].map((s: { source: string }) => s.source),
              trend: tech?.labels?.trend,
              revenueGrowth: fund?.labels?.revenueGrowth,
            }
          : null,
        scoringSanity: technicalScore({
          price: 100,
          ma50: 90,
          ma200: 80,
          changePercent: 2,
          week52High: 110,
          week52Low: 70,
          volume: 120,
          avgVolume: 100,
          sources: [],
        }).score,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
