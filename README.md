# Rahnuma GB

A full-stack Next.js guide to the destinations, local guides and routes of Gilgit-Baltistan.

## Run locally

1. Install locked dependencies: `npm ci`
2. Copy `.env.example` to `.env.local` and add `GEMINI_API_KEY`.
3. Start the app: `npm run dev`
4. Open `http://localhost:3000`.

The app creates a local SQLite database at `data/rehnuma.sqlite` automatically. No database URL or external database service is required for local development. Set `DATABASE_URL` to use Neon PostgreSQL instead.

## Regional travel information

The Travel Desk at `/travel-desk` shows modelled regional forecasts from Open-Meteo and links to current visitor resources on the Gilgit-Baltistan Tourism Department portal. Forecasts are not official safety or road advisories; check the linked official resources for current travel conditions. Assistant and itinerary context includes source-attributed regional summaries in `data/official-knowledge.json`.

## Deploy

Import this repository into Vercel. Vercel detects Next.js automatically. Add `GEMINI_API_KEY`, `DATABASE_URL` (Neon PostgreSQL), and a stable `SESSION_SECRET` in project settings before deploying. Authentication and chat persistence do not work in production without `DATABASE_URL`; sessions also require `SESSION_SECRET`. Use Vercel's encrypted Environment Variables UI and never commit or share the values. See [DEPLOYMENT.md](DEPLOYMENT.md) for details and the optional SQLite-to-Neon data migration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration details.
