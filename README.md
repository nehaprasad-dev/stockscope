# Nifty 500 Scanner

Research the Nifty 500 using technical and fundamental signals, then see which stocks stand out.

**Research only — not investment advice.**

## Setup

```bash
cp env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How a scan works

1. Load the seeded Nifty 500 universe (official NSE constituent CSV).
2. Cheap screen from one NSE bhavcopy download — not 500 paid research calls.
3. Deep-score a shortlist with Yahoo Finance 1-year charts (trend, momentum, volatility).
4. Score with deterministic TypeScript. Missing fields are omitted, never invented.
5. If `VAAYA_API_KEY` is set, **one** bundled Vaaya OneSearch runs on the shortlist for cited context.

Start with **1 stock**, then 10, then 50, then the full index.
