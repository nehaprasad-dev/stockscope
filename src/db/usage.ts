import { prisma } from "@/db/prisma";

export async function logVaayaUsage(opts: {
  userId?: string;
  service: string;
  action: string;
  ok: boolean;
  chargedCents?: number;
}) {
  try {
    await prisma.vaayaUsage.create({
      data: {
        userId: opts.userId || null,
        service: opts.service,
        action: opts.action,
        ok: opts.ok,
        chargedCents: opts.chargedCents ?? null,
      },
    });
  } catch (error) {
    console.error("Could not log Vaaya usage", error);
  }
}
