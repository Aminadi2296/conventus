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
cp .env.example .env
# Set PUBLIC_API_URL to your backend URL
npm run dev
```

Runs on `http://localhost:4321`

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
2. Import repo in Vercel
3. Set `PUBLIC_API_URL` environment variable to your Render backend URL
4. Deploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_API_URL` | URL of the Conventus API (e.g. `https://conventus-api.onrender.com`) |
