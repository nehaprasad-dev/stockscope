"use client";

import { SignInButton } from "@clerk/nextjs";

export function GoogleSignIn({ compact = false }: { compact?: boolean }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    if (compact) return null;
    return (
      <p className="max-w-sm text-sm text-ink/70">
        Clerk is not configured yet. Add{" "}
        <code className="text-navy">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
        <code className="text-navy">CLERK_SECRET_KEY</code> — no Google Cloud OAuth
        client needed.
      </p>
    );
  }

  return (
    <div>
      <SignInButton mode="modal" forceRedirectUrl="/">
        <button
          type="button"
          className={
            compact
              ? "text-sm text-ink/55 transition-colors hover:text-navy"
              : "w-fit rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper shadow-[0_10px_30px_-12px_rgba(20,50,92,0.7)] transition hover:bg-navy/90"
          }
        >
          Continue with Google
        </button>
      </SignInButton>
      {compact ? null : (
        <p className="mt-3 max-w-sm text-[13px] leading-6 text-ink/45">
          Sign in with Google, then scan to see who stands out.
        </p>
      )}
    </div>
  );
}
