import { ensureDb } from "./ensure";
import { prisma } from "./prisma";

export async function getStocks() {
  await ensureDb();
  return prisma.stock.findMany({
    where: { isActive: true },
    orderBy: { symbol: "asc" },
  });
}

export async function getStock(symbol: string) {
  await ensureDb();
  return prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
  });
}

export async function countStocks() {
  await ensureDb();
  return prisma.stock.count({ where: { isActive: true } });
}
