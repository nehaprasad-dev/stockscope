import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export function sqliteFile() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "stockscope.db");
  }
  return path.join(process.cwd(), "prisma", "dev.db");
}

export function sqliteUrl() {
  return `file:${sqliteFile()}`;
}

export function touchSqlite() {
  const file = sqliteFile();
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, "");
}
