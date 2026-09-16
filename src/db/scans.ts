import { prisma } from "./prisma";

export function createScanRun() {
  return prisma.scanRun.create({
    data: { status: "running", phase: "Fetching market data..." },
  });
}

export function updateScanRun(
  id: string,
  data: {
    status?: string;
    phase?: string;
    completedAt?: Date;
    stocksAnalyzed?: number;
    stocksShortlisted?: number;
    error?: string;
  },
) {
  return prisma.scanRun.update({ where: { id }, data });
}

export function latestScan() {
  return prisma.scanRun.findFirst({
    where: { status: "completed" },
    orderBy: { startedAt: "desc" },
  });
}

export function runningScan() {
  return prisma.scanRun.findFirst({
    where: { status: { in: ["queued", "running"] } },
    orderBy: { startedAt: "desc" },
  });
}

export function getScan(id: string) {
  return prisma.scanRun.findUnique({ where: { id } });
}
