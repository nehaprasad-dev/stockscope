import { prisma } from "@/db/prisma";

export const FREE_SCANS_PER_DAY = Number(process.env.FREE_SCANS_PER_DAY ?? 10);

export class ScanQuotaError extends Error {
  constructor(message = "Today’s free scans are used up. Come back tomorrow.") {
    super(message);
    this.name = "ScanQuotaError";
  }
}

function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function scansUsedToday(userId: string) {
  try {
    return await prisma.userScan.count({
      where: { userId, createdAt: { gte: startOfUtcDay() } },
    });
  } catch {
    return 0;
  }
}

export async function assertFreeScanAvailable(userId: string) {
  const used = await scansUsedToday(userId);
  if (used >= FREE_SCANS_PER_DAY) {
    throw new ScanQuotaError();
  }
}

export async function recordUserScan(userId: string, status: string) {
  try {
    await prisma.userScan.create({ data: { userId, status } });
  } catch (error) {
    console.error("Could not record user scan", error);
  }
}

export async function remainingFreeScans(userId: string) {
  const used = await scansUsedToday(userId);
  return Math.max(0, FREE_SCANS_PER_DAY - used);
}
