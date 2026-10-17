# CineSwipe

Discover movies matched to your IMDb taste: swipe on recommendations, manage liked/wishlist/watched lists, and explore titles on a globe map.

## Setup

1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)
4. In **Settings**, add your TMDB and OMDb API keys, then import your IMDb ratings CSV.

Local data (SQLite DB and stored keys) lives in `./data/` (gitignored).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint
