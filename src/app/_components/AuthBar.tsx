"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthBar() {
  return (
    <>
      <Show when="signed-out">
        <div className="hidden sm:block">
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button type="button" className="text-sm text-ink/55 transition-colors hover:text-navy">
              Continue with Google
            </button>
          </SignInButton>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
