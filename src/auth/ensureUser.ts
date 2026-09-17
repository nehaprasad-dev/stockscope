import { prisma } from "@/db/prisma";

export async function ensureAppUser(opts: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  try {
    await prisma.user.upsert({
      where: { id: opts.id },
      create: {
        id: opts.id,
        clerkUserId: opts.id,
        email: opts.email.toLowerCase(),
        name: opts.name,
        image: opts.image,
        freeAccess: true,
        vaayaBilling: "operator",
      },
      update: {
        email: opts.email.toLowerCase(),
        name: opts.name,
        image: opts.image,
      },
    });
  } catch (error) {
    console.error("Could not persist Clerk user", error);
  }
}
