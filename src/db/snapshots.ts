import { prisma } from "./prisma";

export function latestSnapshots() {
  return prisma.stockSnapshot.findMany({
    where: { scoredAt: { not: null } },
    orderBy: { scoredAt: "desc" },
    include: { stock: true },
  });
}

export async function latestSnapshotBySymbol(symbol: string) {
  const stock = await prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
  });
  if (!stock) return null;
  return prisma.stockSnapshot.findFirst({
    where: { stockId: stock.id, scoredAt: { not: null } },
    orderBy: { scoredAt: "desc" },
    include: { stock: true },
  });
}

export function snapshotsForScan(scanRunId: string) {
  return prisma.stockSnapshot.findMany({
    where: { scanRunId },
    include: { stock: true },
    orderBy: { overallScore: "desc" },
  });
}
