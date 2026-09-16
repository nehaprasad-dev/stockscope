import { prisma } from "./prisma";

export function getStocks() {
  return prisma.stock.findMany({
    where: { isActive: true },
    orderBy: { symbol: "asc" },
  });
}

export function getStock(symbol: string) {
  return prisma.stock.findUnique({
    where: { symbol: symbol.toUpperCase() },
  });
}

export function countStocks() {
  return prisma.stock.count({ where: { isActive: true } });
}
