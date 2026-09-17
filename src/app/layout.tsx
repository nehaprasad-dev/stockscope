import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nifty 500 Stock Scanner",
  description:
    "Research the Nifty 500 using technical and fundamental signals, then see which stocks stand out. Research only — not investment advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="relative min-h-full bg-paper text-ink">
        <div className="relative z-10 mx-auto flex min-h-full max-w-6xl flex-col px-6 sm:px-10">
          <header className="flex items-center justify-between gap-6 py-6">
            <Link href="/" className="flex items-center gap-2.5 text-sm font-medium tracking-tight">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[11px] tracking-wide text-paper">
                N
              </span>
              Nifty 500
            </Link>
            <Link
              href="/methodology"
              className="text-sm text-ink/55 transition-colors hover:text-navy"
            >
              Methodology
            </Link>
          </header>
          <main className="flex-1 pb-16 pt-4 sm:pt-8">{children}</main>
          <footer className="border-t border-line py-8 text-xs text-ink/40">
            Research only — not investment advice.
          </footer>
        </div>
      </body>
    </html>
  );
}
