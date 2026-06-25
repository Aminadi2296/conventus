# Conventus Web

Frontend for the Conventus meeting scheduler. Built with Astro (SSR) + React + Tailwind.

## Stack

- **Astro** — SSR framework, pages are server-rendered
- **React** — interactive islands (availability grid)
- **Framer Motion** — animations inside React islands
- **Tailwind CSS** — utility classes where needed
- **DM Sans + DM Serif Display** — typography

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:4321` and uses `http://localhost:3000` for the API (see `.env.development`).

Start the API separately from the repo root:

```bash
cd ../api && npm run dev
```

## Environment variables

Astro loads env files by mode:

| File | When | `PUBLIC_API_URL` |
|------|------|------------------|
| `.env.development` | `astro dev` | `http://localhost:3000` |
| `.env.production` | `astro build` | `https://conventus-9q9k.onrender.com` |

Optional local overrides (gitignored): `.env.local` or `.env.development.local`.

All API calls go through `getApiUrl()` in `src/lib/api.ts`.

## Project structure

```
src/
├── layouts/
│   └── Base.astro          # HTML shell, fonts, global CSS vars
├── pages/
│   ├── index.astro         # Landing — create or join a meeting
│   └── meetings/
│       └── [id].astro      # Meeting detail — SSR fetched
├── components/
│   ├── Navbar.astro        # Sticky nav
│   └── AvailabilityGrid.tsx  # React island — drag-to-select grid
└── lib/
    └── api.ts              # All API fetch helpers + TypeScript types
```

## Deployment

Deploy to Vercel — it has first-class Astro SSR support.

1. Push to GitHub
2. Import repo in Vercel (root directory: `web`)
3. Production builds use `.env.production` automatically. To override, set `PUBLIC_API_URL` in Vercel to your Render backend URL.
4. Deploy

On Render (API), set `FRONTEND_URL` to your deployed frontend origin for CORS (e.g. `https://your-app.vercel.app`).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_API_URL` | Backend base URL, no trailing `/api` (e.g. `https://conventus-9q9k.onrender.com`) |
