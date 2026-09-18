import { auth } from "@clerk/nextjs/server";
import { GoogleSignIn } from "./GoogleSignIn";
import { ScanButton } from "./ScanButton";

export async function ScanArea() {
  const { userId } = await auth();
  if (!userId) {
    return <GoogleSignIn />;
  }

  return <ScanButton />;
}
