# poster-session-demo

A 3-minute auto-playing replay of the NERPG Spring 2026 poster session,
designed to live at a public GH Pages URL so prospective customers can
experience the app instead of just looking at screenshots.

The demo runs entirely client-side. No Supabase. No analytics. No real auth.
You land, the simulator drives, you watch the event play out — visits being
logged, votes coming in, phase flipping to results — and then a CTA invites
you to bring this to your own event.

## Running locally

```sh
npm install
npm run dev
```

## Deployment

Pushed to `main` and served via GitHub Pages at the path
configured in `vite.config.js` (default `/poster-session-demo/`).

## Provenance

- Forked from `poster-session-app` on 2026-04-14.
- Poster data and codenames mirror the real Spring 2026 event.
- Activity timeline in `src/demo/timeline.js` is hand-scripted (not a
  byte-for-byte event replay) — patterns derived from the analysis in
  `poster-session-app/docs/nerpg-lessons/INSIGHTS.md`.
