# Nifty 500 Scanner

Scan the Nifty 500 and quickly see which stocks stand out, with a score out of 100 and a short reason why.

This is a **research and ranking** dashboard. It is **not** a buy/sell app, not a broker, and **not investment advice**.

The point: you should not have to research 500 companies by hand. Every scan starts from the full Nifty 500 list, pulls market data, scores what it can actually measure, ranks the names, and shows sources.

---

## What you get

**Home**

- Last scan time, universe size, how many stocks were analyzed, how many have fundamentals
- **Scan Nifty 500** — always the full index
- Top names, then a ranked table: rank, stock, overall, technical, fundamental, signal
- Filters: All, Top 10, Top 25, Top 50, plus Overall / Technical / Fundamental (display only)

**Stock page** (click a name)

- Overall score / 100 and a Strong / Positive / Mixed / Weak label
- Breakdown: technical, fundamental, momentum, financial, risk
- Why it stands out, and what to watch
- Technical and fundamental signal labels
- Source links used for scoring, plus Screener / Trendlyne / Indian Stock Picker for further reading

If a number is missing, the UI shows **Insufficient data**. We do not invent ROE, growth, or a score.

---

## How a scan works

Always start from the seeded Nifty 500 universe. Nobody types random tickers.

```
Nifty 500 list
    → one NSE bhavcopy (cheap bulk prices)
    → Yahoo 1-year charts for every name
    → Groww company JSON by ISIN (ROE, P/E, debt, growth, margins)
    → Tickertape ratios if Groww has nothing for that name
    → TypeScript scoring (not “ask an LLM for 0–100”)
    → rank + explain
```

There are no 1 / 10 / 50 demo scan sizes. Top 10 / 25 / 50 on the home page are filters on the ranked full index.

---

## Scoring

Weights (easy to change in `src/scoring/weights.ts`):

- 50% fundamental
- 40% technical
- 10% risk / quality

Missing inputs are skipped, then the rest is normalized to 0–100. Rank also uses **confidence** (how complete the data was) and **freshness** (when it was last checked). A high score on thin or old data should not automatically sit on top.

Screener and Trendlyne are linked as research destinations. They are not scraped for scoring.

---

## Run it locally

Need Node 20+ and npm.

```bash
cp env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env`:

```
DATABASE_URL="file:./dev.db"
VAAYA_API_KEY=
VAAYA_API_URL="https://api.vaaya.ai/api/run"
```

SQLite file lands at `prisma/dev.db`. Do not commit `.env`. Vaaya is optional.

Useful extras:

```bash
npx tsx scripts/scan-once.ts      # full scan without the UI
npx tsx scripts/verify-product.ts # check stored scores vs the formula
```

---

## Vercel

Vercel has **no local sqlite file**, and `/tmp` sqlite is not shared between page load and scan.

This app:

- seeds the Nifty 500 list from the bundled JSON
- runs the scan in the API request and **keeps the ranked table in your browser**

After deploy, click **Scan Nifty 500** and wait — a full index pass takes about half a minute.

---

## What’s in the repo

| Area | Role |
|---|---|
| `data/ind_nifty500list.csv` | NSE constituent list |
| `prisma/` | schema + seed |
| `src/research/` | NSE bhavcopy, Yahoo charts, Groww / Tickertape fundamentals |
| `src/scoring/` | deterministic 0–100 scores |
| `src/scans/` | scan pipeline |
| `src/explanations/` | “why it stands out” from the numbers |
| `src/app/` | dashboard, stock page, methodology, APIs |
