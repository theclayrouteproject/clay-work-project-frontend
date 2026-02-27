This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Ceramics Database Background Pipeline

This project includes an always-on local data pipeline for continuous source discovery and curation.

- Ingest queue folder: `app/ceramics101/database/incoming/`
- Processed queue folder: `app/ceramics101/database/incoming/processed/`
- Discovery review queue: `app/ceramics101/database/discovery-review/`

### Core commands

```bash
npm run db:discover          # discover new candidate sources from trusted feeds/sitemaps
npm run db:ingest            # merge queued JSON into database files
npm run db:curate            # update source/material governance scores
npm run db:curate:audit      # run URL reachability audit + governance updates
```

`db:discover` writes candidates into the discovery review queue (not directly live).
Approve/reject batches in-app at `/resources/review`.

### Always-on workers (macOS launchd)

```bash
npm run db:worker:install              # installs ingest watcher (continuous)
npm run db:worker:status
npm run db:worker:uninstall

npm run db:discover:worker:install     # installs discovery poller (every 6 hours)
npm run db:discover:worker:status
npm run db:discover:worker:uninstall
```

### Discovery feed config

Edit trusted discovery endpoints in:

- `app/ceramics101/database/discovery-feeds.data.json`

Only URLs from configured `allowDomains` are accepted into candidate discovery payloads.

## Market Pipeline (Worldwide Listings)

Market listings are stored in-app and curated to keep only relevant, available products.

- Live market catalog: `app/market/database/items.data.json`
- Market review queue: `app/market/database/discovery-review/`
- Market incoming queue: `app/market/database/incoming/`

### Market commands

```bash
npm run market:discover      # discover new product candidates into market review queue
npm run market:ingest        # merge approved candidates into live market catalog
npm run market:curate        # verify availability and auto-remove unavailable listings
```

Review candidate product batches in-app at `/market/review`.

## Glaze Library

The glaze library is in-app and card-based, with filtering by finish, color, ingredients, and firing cone.

- Page: `/glazes`
- Data file: `app/glazes/data.ts`

Glaze entries use non-linked source references (`Glazy` source label + internal reference terms), keeping users inside the app while preserving provenance.

### Glaze background pipeline

```bash
npm run glaze:discover
npm run glaze:ingest
npm run glaze:curate

npm run glaze:discover:worker:install
npm run glaze:discover:worker:status
npm run glaze:discover:worker:uninstall

npm run glaze:pipeline:worker:install
npm run glaze:pipeline:worker:status
npm run glaze:pipeline:worker:uninstall
```

- Discovery worker polls configured glaze feeds every 6 hours.
- Pipeline worker runs ingest + curate every 30 minutes.

### Glazy seeded import (manual queue, one command)

When direct Glazy feed/sitemap/API endpoints are unavailable in runtime fetch, use the seed queue file:

- Queue file: `app/glazes/database/glazy-seed-queue.data.json`
- Add one entry per recipe with `recipeId`, `name`, and measured `recipeRows`.
- Keep `enabled: true` for rows you want imported now.

```bash
npm run glaze:seed:run
```

This command sequence will:

1. Build a strict incoming glaze payload from queue entries (`>= 3` measured rows required)
2. Run ingest
3. Run curate (legitimacy enforcement)

Useful options:

```bash
npm run glaze:seed:build       # build incoming payload only
npm run glaze:seed:run:force   # include queue entries even if sourceRef already exists
```
