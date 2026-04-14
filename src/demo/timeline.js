// The scripted timeline that drives the demo. Times are in milliseconds from
// demo start, interpreted at the current speed multiplier.
//
// Patterns are drawn from the real NERPG Spring 2026 event:
// - ~5 min signin→first visit (compressed to seconds here)
// - Log visits via the modal, not quick-log (81% of real events did)
// - "Top halo" posters (Rumesha #2, Florence #7, Zhiming #13) get browsed most
// - Zhiming #13 wins Distinguished (17 pts), Mohak #22 wins Peer Impact
// - Phase flip to results happens well after ballot submission

export const TIMELINE = [
  // ── Scene 1: Landing & welcome ─────────────────────────────
  { t: 0,     type: 'banner-intro' },
  { t: 600,   type: 'navigate', hash: '#/gallery' },
  { t: 2500,  type: 'toast',    text: 'Welcome — this is a 90-second replay of a real poster session.' },

  // ── Scene 2: Ambient event activity (other attendees) ──────
  { t: 6000,  type: 'feed', actor: 'CHAIN',  action: 'opened poster #7' },
  { t: 8500,  type: 'feed', actor: 'OZONE',  action: 'logged a visit to poster #13' },
  { t: 10500, type: 'feed', actor: 'SPOOL',  action: 'opened poster #5' },
  { t: 12500, type: 'feed', actor: 'FLEX',   action: 'signed in from AirBoss' },

  // ── Scene 3: The viewer browses the gallery ────────────────
  { t: 14500, type: 'open-modal', poster: 2 },
  { t: 17500, type: 'log-visit',  poster: 2 },
  { t: 18500, type: 'close-modal' },
  { t: 20000, type: 'feed', actor: 'TEAR',   action: 'logged 4 visits in a row' },

  { t: 22000, type: 'open-modal', poster: 7 },
  { t: 24500, type: 'log-visit',  poster: 7 },
  { t: 25500, type: 'close-modal' },

  { t: 27000, type: 'feed', actor: 'MORPH',  action: 'submitted their ballot' },
  { t: 29000, type: 'open-modal', poster: 13 },
  { t: 32000, type: 'log-visit',  poster: 13 },
  { t: 33000, type: 'close-modal' },

  // ── Scene 4: Voting unlocks, ballot submitted ──────────────
  { t: 35500, type: 'feed', actor: 'BOND',   action: 'voted for 3 posters' },
  { t: 37500, type: 'navigate', hash: '#/vote' },
  { t: 39500, type: 'select', poster: 13, rank: 1 },
  { t: 41000, type: 'select', poster: 22, rank: 2 },
  { t: 42500, type: 'select', poster: 7,  rank: 3 },
  { t: 44500, type: 'submit-ballot' },
  { t: 46000, type: 'navigate', hash: '#/confirm' },

  // ── Scene 5: More activity while the viewer sits ───────────
  { t: 50000, type: 'feed', actor: 'GOODY',  action: 'submitted a ballot from Jonal Labs' },
  { t: 52500, type: 'feed', actor: 'SHRED',  action: 'added a note to poster #18' },
  { t: 55000, type: 'feed', actor: 'YIELD',  action: 'logged 9 visits total' },
  { t: 58000, type: 'feed', actor: 'PRENE',  action: 'dwelled 532s on poster #3' },

  // ── Scene 6: Phase flip → results ──────────────────────────
  { t: 62000, type: 'toast',    text: 'Results are coming in…', kind: 'gold' },
  { t: 64000, type: 'phase',    to: 'results' },
  { t: 65500, type: 'navigate', hash: '#/vote' },

  // ── Scene 7: Celebration + CTA ─────────────────────────────
  { t: 72000, type: 'cta-overlay' },
  { t: 90000, type: 'loop' },
]
