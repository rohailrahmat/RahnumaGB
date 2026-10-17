# Rahnuma GB

Next.js App Router travel guide for Gilgit-Baltistan. The frontend, route handlers, auth and Gemini-backed travel assistant live in this project.

## Local development

1. Install locked dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

The app creates `data/rehnuma.sqlite` and its tables automatically. It also creates and persists a local session secret. No database service or database configuration is needed locally. The Gemini key can use the existing `GEMINI_API_KEY` name or `GOOGLE_API_KEY`.

Signed-in users can manage their profile name and travel-notification preferences from the account menu. The notification options are stored preferences only; the app does not send notification emails yet. Destination maps use OpenStreetMap embeds and do not need an API key. Planner map pins are approximate valley locations; travelers should confirm current road conditions and directions locally.

## Vercel

Import the GitHub repository into Vercel, keep the project root at the repository root, and use the default Next.js framework detection and build settings.

Add these environment variables in the Vercel project settings for Production, Preview, and Development:

- `GEMINI_API_KEY`: Google AI Studio API key used for embeddings and answers.
- `SESSION_SECRET`: A stable, randomly generated secret used to sign login sessions.
- `DATABASE_URL`: Neon PostgreSQL connection string. User accounts and conversations require this persistent shared database.
- `NEXT_PUBLIC_SITE_URL` (optional): The canonical HTTPS URL for the production site, used by metadata and the sitemap. Vercel's deployment URL is used when this is unset.

`DATABASE_URL` and `SESSION_SECRET` are required for account and conversation features in production. Generate a unique session secret locally; do not use a value shared in chat or committed to Git. Missing settings prevent authenticated features from working. Redeploy after adding or changing environment variables. `data/index.json` is included in the repository and used for semantic retrieval. The app initializes its PostgreSQL schema automatically. Local development uses SQLite unless `DATABASE_URL` is set. Existing local SQLite accounts and conversations are not copied to Neon automatically.

### Copying existing local data to Neon

Back up `data/rehnuma.sqlite` first. With `DATABASE_URL` set to the Neon database, run `npm run migrate:neon` to review source row counts without changing either database. Run `npm run migrate:neon -- --execute` only when you are ready to copy users, password hashes, preferences, conversations, and messages. The operation is idempotent for matching record IDs and leaves the SQLite source unchanged. It does not transfer plaintext passwords.