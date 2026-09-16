import { PrismaClient } from "@prisma/client";
import path from "node:path";

const sqliteUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? `file:${path.join(process.cwd(), "prisma", "dev.db")}`
  : process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: sqliteUrl ? { db: { url: sqliteUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
