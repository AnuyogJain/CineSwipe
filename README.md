# CineSwipe

Discover movies matched to your taste: swipe on recommendations, manage liked/wishlist/watched lists, and explore titles on a globe map.

## Setup

1. Install dependencies: `npm install`
2. Create a [Turso](https://turso.tech) database and token (CLI: `turso db create cineswipe`, then `turso db tokens create cineswipe`).
3. Copy `env.example` to `.env.local` and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
4. Apply schema: `npm run db:push` (or `turso db shell <db> < drizzle/0000_initial.sql`)
5. Run the dev server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000), register, and add TMDB + OMDb keys in **Settings**.

User data and per-account API keys live in **Turso** (remote libSQL). There is no local `./data/app.db`.

## Deploy (Vercel)

1. Import the repo in [Vercel](https://vercel.com).
2. Add environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (same Turso DB or a production DB).
3. Run `npm run db:push` once against the production database before or after first deploy.
4. Optional demo keys (Settings button): `ALLOW_DEMO_API_KEYS`, `CINESWIPE_DEMO_TMDB_API_KEY`, `CINESWIPE_DEMO_OMDB_API_KEY`.

Heavy API routes use extended timeouts via `vercel.json` (Hobby may still cap below 60s on some plans).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint
- `npm run db:push` — push Drizzle schema to Turso
- `npm run db:generate` — generate SQL migrations into `./drizzle`
- `npm run db:studio` — Drizzle Studio (requires Turso env)

UI icons use [Lucide](https://lucide.dev) (ISC license) via `lucide-react`.
