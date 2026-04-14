// Cinematic demo timeline — ~3 minutes, paced so each scene breathes.
// Drawn from real Spring 2026 event data: top-halo posters (#2, #5, #7,
// #13, #18), real actor codenames, real winners (Zhiming Li #13 Distinguished,
// Mohak Desai #22 Peer Impact), real vote patterns (17 / 16 / 10 point scores).

export const TIMELINE = [
  // ═══ Scene 0: Cold open title card ═══════════════════════════
  { t: 0, type: 'title-card',
    lines: [
      'NERPG Spring 2026',
      'UConn — 117 attendees · 23 posters · 108 votes',
    ],
    sub: 'watch it play out in 3 minutes',
    duration: 4500 },

  // ═══ Scene 1: Arrive — polymer codename + welcome tutorial ═══
  { t: 4500, type: 'navigate', hash: '#/gallery' },
  { t: 5000, type: 'scene-card', text: '1.  Arriving at check-in…', duration: 1600 },
  { t: 6800, type: 'welcome' },
  { t: 13500, type: 'dismiss-welcome' },

  // ═══ Scene 2: Explore the gallery ════════════════════════════
  { t: 14000, type: 'scene-card', text: '2.  Exploring the gallery', duration: 1400 },
  { t: 16000, type: 'feed', actor: 'OZONE',  action: 'opened poster #7 — Cannabinoid antimicrobial SAR' },
  { t: 18000, type: 'feed', actor: 'SPOOL',  action: 'logged a visit to poster #5' },
  { t: 19500, type: 'open-modal', poster: 2 },
  { t: 23000, type: 'log-visit',  poster: 2 },
  { t: 24500, type: 'close-modal' },
  { t: 25500, type: 'feed', actor: 'FLEX',   action: 'signed in from AirBoss (Rochester)' },
  { t: 27500, type: 'open-modal', poster: 7 },
  { t: 30500, type: 'log-visit',  poster: 7 },
  { t: 32000, type: 'close-modal' },
  { t: 33000, type: 'feed', actor: 'MBTS',   action: 'logged 8 visits from Jonal Labs' },
  { t: 35000, type: 'open-modal', poster: 13 },
  { t: 38500, type: 'log-visit',  poster: 13 },
  { t: 40000, type: 'close-modal' },
  { t: 41000, type: 'toast', kind: 'gold',   text: '✓ 3 visited — voting unlocked!' },

  // ═══ Scene 3: Rank your top 3 ════════════════════════════════
  { t: 43000, type: 'scene-card', text: '3.  Ranked vote — top 3', duration: 1400 },
  { t: 44800, type: 'navigate', hash: '#/vote' },
  { t: 47000, type: 'select', poster: 13, rank: 1 },
  { t: 48500, type: 'select', poster: 22, rank: 2 },
  { t: 50000, type: 'select', poster: 7,  rank: 3 },
  { t: 52000, type: 'submit-ballot' },
  { t: 53000, type: 'navigate', hash: '#/confirm' },
  { t: 55000, type: 'feed', actor: 'BOND',   action: 'submitted their ranked ballot' },
  { t: 57500, type: 'feed', actor: 'GOODY',  action: 'deep-dwelled 869s on poster #3' },
  { t: 60000, type: 'feed', actor: 'PRENE',  action: 'submitted ballot from Jonal Labs' },

  // ═══ Scene 4: Meanwhile, the admin is watching ═══════════════
  { t: 63000, type: 'scene-card', text: '4.  Meanwhile, at the admin table…', duration: 2000 },
  { t: 65500, type: 'switch-attendee', attendee: 'admin' },
  { t: 66000, type: 'navigate', hash: '#/admin' },
  { t: 70000, type: 'feed', actor: 'YIELD',  action: 'voted (Peer Impact track)' },
  { t: 73000, type: 'feed', actor: 'TEAR',   action: 'voted' },
  { t: 76000, type: 'feed', actor: 'SHRED',  action: 'added a note to poster #18' },
  { t: 79000, type: 'feed', actor: 'PEEL',   action: 'logged 16 visits total' },
  { t: 82000, type: 'feed', actor: 'SKID',   action: 'exemplar 56-min journey complete' },

  // ═══ Scene 5: The phase flip ═════════════════════════════════
  { t: 85000, type: 'scene-card', text: '5.  Admin flips to results', duration: 1600 },
  { t: 87000, type: 'toast', kind: 'gold', text: 'All 108 votes in — closing voting' },
  { t: 89500, type: 'click-phase-flip' },
  { t: 90500, type: 'confetti' },

  // ═══ Scene 6: Results reveal ═════════════════════════════════
  { t: 91500, type: 'switch-attendee', attendee: 'demo' },
  { t: 92000, type: 'navigate', hash: '#/vote' },
  { t: 94000, type: 'scene-card', text: '6.  Winners — announced live', duration: 1800 },
  { t: 96500, type: 'toast', kind: 'gold', text: '🏆 Distinguished: Zhiming Li (17 pts)' },
  { t: 101000, type: 'toast', kind: 'gold', text: '🏆 Peer Impact: Mohak Desai (15 pts)' },
  { t: 106000, type: 'feed', actor: 'JONAL', action: 'cheering in the front row' },

  // ═══ CTA ═════════════════════════════════════════════════════
  { t: 113000, type: 'cta-overlay' },
  { t: 165000, type: 'loop' },
]
