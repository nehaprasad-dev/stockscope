# Nifty 500 Scanner

Scan the Nifty 500 and quickly see which stocks stand out, with a score out of 100 and a short reason why.

This is a **research and ranking** dashboard. It is **not** a buy/sell app, not a broker, and **not investment advice**.

The point: you should not have to research 500 companies by hand. The scanner starts from a fixed Nifty 500 list, pulls market data, scores what it can actually measure, ranks the names, and shows sources.

---

## What you get

**Home**

- Last scan time and how many stocks were analyzed
- **Scan Nifty 500** (1 / 10 / 50 / full index)
- Top names, then a ranked table: rank, stock, overall, technical, fundamental, signal
- Filters: All, Top 10, Top 25, Top 50, plus Overall / Technical / Fundamental

**Stock page** (click a name)

- Overall score / 100 and a Strong / Positive / Mixed / Weak label
- Breakdown: technical, fundamental, momentum, financial, risk
- Why it stands out, and what to watch
- Technical and fundamental signal labels
- Source links (NSE, Yahoo, plus Screener / Trendlyne / Indian Stock Picker for further reading)

If a number is missing, the UI shows **Insufficient data**. We do not invent ROE, growth, or a score.

---

## How a scan works

Always start from the seeded Nifty 500 universe. Nobody types random tickers in v1.

```
Nifty 500 list
    → one NSE bhavcopy (cheap bulk prices)
    → cheap screen
    → shortlist (up to 50 on a full scan)
    → Yahoo 1-year charts for trend / momentum / volatility
    → TypeScript scoring (not “ask an LLM for 0–100”)
    → rank + explain
```

A full 500-name scan does **not** fire hundreds of paid research calls. Bulk data first, deep work only on the shortlist.

If `VAAYA_API_KEY` is set, **one** Vaaya research call runs on that shortlist for extra context. The model may explain; it is not the source of the numbers.

Start with **1 stock**, then 10, then 50, then 500. That is how you catch bugs without burning credits.

---

## Scoring

Weights (easy to change in `src/scoring/weights.ts`):

- 50% fundamental
- 40% technical
- 10% risk / quality

Missing inputs are skipped, then the rest is normalized to 0–100. Rank also uses **confidence** (how complete the data was) and **freshness** (when it was last checked). A high score on thin or old data should not automatically sit on top.

**Honest current state:** technical scores work from NSE prices + Yahoo charts. Yahoo’s fundamental API often returns nothing for NSE names, so fundamental columns may be empty. Empty is correct. Fake precision is not.

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
npx tsx scripts/scan-once.ts      # scan without the UI
npx tsx scripts/verify-product.ts # check stored scores vs the formula
```

---

## Vercel

The screenshot error (`Universe is empty` + `POST /api/scan 500`) happens because Vercel has **no local sqlite file**. Serverless also cannot write `prisma/dev.db`.

This app now:

- creates a sqlite file under `/tmp` on Vercel
- seeds the Nifty 500 list on first request
- lets you scan **1 or 10** stocks (a full 500 scan times out on the hobby plan)

Redeploy after pulling these changes. First page load may take a few seconds while it seeds.

Scan results in `/tmp` go away when the serverless instance is recycled. For a durable production database you’d switch to Postgres later.

---

## What’s in the repo

| Area | Role |
|---|---|
| `data/ind_nifty500list.csv` | NSE constituent list |
| `prisma/` | schema + seed |
| `src/research/` | NSE bhavcopy, Yahoo charts, Vaaya, sources |
| `src/scoring/` | deterministic 0–100 scores |
| `src/scans/` | scan pipeline |
| `src/explanations/` | “why it stands out” from the numbers |
| `src/app/` | dashboard, stock page, methodology, APIs |

---

