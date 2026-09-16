import { PrismaClient } from "@prisma/client";
import { sqliteUrl, touchSqlite } from "./paths";

touchSqlite();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: sqliteUrl() } },
  });

if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

