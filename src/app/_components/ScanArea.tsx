import { auth } from "@clerk/nextjs/server";
import { remainingFreeScans } from "@/auth/quota";
import { GoogleSignIn } from "./GoogleSignIn";
import { ScanButton } from "./ScanButton";

export async function ScanArea() {
  const { userId } = await auth();
  if (!userId) {
    return <GoogleSignIn />;
  }

  const left = await remainingFreeScans(userId);
  return <ScanButton scansLeft={left} />;
}
