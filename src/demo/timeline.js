// Cinematic walkthrough that mirrors the real Spring 2026 event arc —
// reframed from "product tour" to "one person's service + craft."
//
// The thesis this timeline is selling:
//   1. Every piece here was custom-designed for NERPG Spring 2026.
//   2. The same person who designed it (me) runs the event day-of.
//   3. You book an engagement, not a subscription.
//
// Real-event timing:
//   12:00–12:30  doors open / check-in
//   12:30–1:30   peak gallery browsing
//   1:30–2:30    voting opens up; people sit for talks
//   2:30–3:00    talks running; late ballots come in
//   3:00         voting closes; I flip the phase
//   4:00         awards ceremony
//
// The demo compresses ~4 hours into ~5 minutes but preserves the order so
// each scene reads as a real moment in the day.

export const TIMELINE = [
  // ═══ 0. Cold open ═══════════════════════════════════════════
  { t: 0, type: 'title-card',
    lines: ['NERPG Spring 2026', 'UConn · 117 attendees · 23 posters · 108 votes'],
    sub: 'Let it play · touch to pause · tabs to jump · designed for phones',
    duration: 5200 },

  // ═══ 0a. Who made this ════════════════════════════════════════
  { t: 5200, type: 'title-card',
    lines: ["I'm Brenden Ferland.", 'Polymer PhD at UConn · designed + ran NERPG Spring 2026'],
    sub: "Here's what I built. Here's what you'd get too.",
    duration: 5000 },

  // ═══ 0b. Design DNA reel — the brand-system proof ═══════════
  { t: 10200, type: 'design-dna', duration: 11000 },

  // ═══ 1. 12:15 PM — Check-in ═══════════════════════════════════
  { t: 21200, type: 'mode', mode: 'gallery' },
  { t: 21700, type: 'scene-card', text: '12:15 PM  ·  Checking in', duration: 1800 },
  { t: 23600, type: 'welcome' },

  { t: 26500, type: 'highlight', selector: '.welcome-fact__code', position: 'bottom',
    label: 'your codename',
    text: 'Every attendee gets a polymer-themed codename. No email, no password, no account.',
    duration: 5200 },
  { t: 31900, type: 'highlight', selector: '.welcome-fact__text', position: 'bottom',
    label: 'your polymer fact',
    text: 'Printed on the check-in card: a keepsake fact tied to your research domain. Becomes trivia material later.',
    duration: 5200 },
  { t: 37300, type: 'highlight', selector: '.welcome-step:nth-of-type(1) .welcome-step__title', position: 'right',
    label: 'step 1 — visit',
    text: 'Attendees walk the gallery and note poster numbers. Presenters carry theirs on a small branded card.',
    duration: 4500 },
  { t: 42000, type: 'highlight', selector: '.welcome-step:nth-of-type(2) .welcome-step__title', position: 'right',
    label: 'step 2 — log',
    text: 'One tap records the visit. Offline-first — stored locally, synced when signal returns.',
    duration: 4500 },
  { t: 46700, type: 'highlight', selector: '.welcome-step:nth-of-type(3) .welcome-step__title', position: 'right',
    label: 'step 3 — vote',
    text: 'Voting unlocks after 3 visits. Rank your top 3 — weighted 3–2–1.',
    duration: 4500 },
  { t: 51300, type: 'highlight', selector: '.welcome-btn', position: 'top',
    label: 'dismiss',
    text: 'First-time-only tutorial. Replay any time via the "How it works" pill in the header.',
    duration: 4000 },

  { t: 55500, type: 'dismiss-welcome' },

  // ═══ 2. 12:30 PM — Gallery opens up ════════════════════════════
  { t: 56300, type: 'scene-card', text: '12:30 PM  ·  Poster session begins', duration: 1800 },
  { t: 58100, type: 'narrator', duration: 4200,
    text: "Your job right now, as chair: zero. Attendees check themselves in off the pre-printed cards." },
  { t: 62400, type: 'highlight', selector: '.identity-chip', position: 'bottom',
    label: 'who you are',
    text: 'Codename, first name, deterministic avatar color. Same code always renders the same color everywhere.',
    duration: 4500 },
  { t: 67000, type: 'highlight', selector: '.gallery-search__input', position: 'bottom',
    label: 'search',
    text: 'Fuzzy search by title, author, advisor, keyword, or poster number.',
    duration: 4000 },
  { t: 71100, type: 'highlight', selector: '.visit-progress', position: 'bottom',
    label: 'progress',
    text: 'Live "N of 3 to unlock voting" bar. Glows gold the instant voting unlocks.',
    duration: 4500 },
  { t: 75700, type: 'highlight', selector: '.gallery-pulse', position: 'top',
    label: 'live pulse',
    text: 'Real-time count of every visit across the room. No polling — it just updates.',
    duration: 4500 },
  { t: 80300, type: 'highlight', selector: '.poster-card', position: 'right',
    label: 'poster card',
    text: 'Every card: headshot, title, presenter-written blurb. Tap to open the full abstract + log a visit.',
    duration: 4800 },
  { t: 85200, type: 'highlight', selector: '.quick-log-fab', position: 'top',
    label: 'quick-log',
    text: 'Power-user path: tap the floating button, punch the poster number on a numpad. Haptic on every key.',
    duration: 4800 },

  // ═══ 3. 1:00 PM — The room at peak (burst) ═════════════════════
  { t: 90400, type: 'scene-card', text: '1:00 PM  ·  The room at peak', duration: 1700 },
  { t: 92200, type: 'burst',
    toast: 'That was 11 things in 4 seconds. Multiply by an hour. Your part: shaking hands.',
    kind: 'gold',
    stagger: 320,
    items: [
      'OZONE opened poster #7',
      'CHAIN logged a visit from Vibram',
      'SPOOL submitted their ranked ballot',
      'FLEX signed in from AirBoss',
      'BOND added a note to poster #18',
      'MBTS logged 8 visits from Jonal Labs',
      'TEAR voted (Peer Impact)',
      'SHRED dwelled 532s on poster #2',
      'FOAM logged a visit from Brown',
      'VULC joined the gallery',
      'GRAFT submitted their ballot',
    ] },
  { t: 100700, type: 'narrator', duration: 4500,
    text: 'Real Spring 2026 stat: 106 Wi-Fi flips absorbed. 41% of visits logged offline. Zero data loss.' },

  // ═══ 4. 1:15 PM — Inside a single poster ═══════════════════════
  { t: 105400, type: 'scene-card', text: '1:15 PM  ·  Inside a poster', duration: 1700 },
  { t: 107200, type: 'open-modal', poster: 13 },
  { t: 108700, type: 'highlight', selector: '.modal__headshot', position: 'right',
    label: 'presenter',
    text: 'Photo + advisor. No headshot? Colored initials from a hash of the name — never blank.',
    duration: 4700 },
  { t: 113500, type: 'highlight', selector: '.poster-modal__summary', position: 'bottom',
    label: 'short blurb',
    text: 'A hook for non-technical visitors — the elevator pitch. A real challenge for students used to writing for technical audiences.',
    duration: 5000 },
  { t: 118600, type: 'highlight', selector: '.poster-modal__abstract-toggle', position: 'bottom',
    label: 'read abstract',
    text: 'Full abstract hidden by default to keep cards scannable. One tap expands.',
    duration: 4800 },
  { t: 123500, type: 'highlight', selector: '.modal__notes--promoted', position: 'top',
    label: 'your notes',
    text: 'Jot questions, follow-up ideas, intros. Saved to this device. Exportable from the gallery.',
    duration: 5500 },
  { t: 129100, type: 'highlight', selector: '.modal__log-visit', position: 'top',
    label: 'log visit',
    text: 'Counts toward your 3 to unlock voting. Works offline — the modal never blocks on a network call.',
    duration: 5000 },
  { t: 133400, type: 'log-visit', poster: 13 },
  { t: 134200, type: 'close-modal' },
  { t: 134700, type: 'prompt-action',
    text: 'Your turn — tap 2 more posters & log visits to unlock voting',
    condition: 'visits>=3',
    timeoutMs: 90000 },

  // ═══ 5. 2:00 PM — Voting opens up ════════════════════════════
  { t: 135400, type: 'mode', mode: 'vote' },
  { t: 135900, type: 'scene-card', text: '2:00 PM  ·  Ranking my top 3', duration: 1800 },
  { t: 137700, type: 'narrator', trackAware: true, duration: 5500,
    text: "Ranked voting (3–2–1). You're voting in the {track}." },
  { t: 143400, type: 'highlight', selector: '.vote-instructions', position: 'bottom',
    label: 'instructions',
    text: "Three-step instructions stay pinned above the grid until you've ranked all three.",
    duration: 5000 },
  { t: 148600, type: 'narrator', duration: 5000,
    text: 'Distinguished Poster (industry panel + cash prize) and Peer Impact (peer panel) run in parallel.' },
  { t: 153900, type: 'highlight', selector: '.poster-card', position: 'right',
    label: 'tap to rank',
    text: 'Tap once = 1st pick, again = 2nd, again = 3rd. Tap a picked card to drop it. Max 3.',
    duration: 5000 },
  { t: 159100, type: 'prompt-action',
    text: 'Your turn — rank your top 3, then hit Submit',
    condition: 'votes==3',
    timeoutMs: 90000 },

  // ═══ 6. 2:30 PM — Talks begin, take a seat ═════════════════════
  { t: 159400, type: 'mode', mode: 'confirm' },
  { t: 159900, type: 'scene-card', text: '2:30 PM  ·  Talks begin — take a seat', duration: 1800 },
  { t: 161800, type: 'highlight', selector: '.confirm-check', position: 'bottom',
    label: 'success moment',
    text: 'Animated checkmark + confetti the moment your ballot lands.',
    duration: 4500 },
  { t: 166500, type: 'narrator', duration: 4500,
    text: 'Schedule, your picks, and live event stats stay on screen during the talks — reason to stay seated.' },
  { t: 171200, type: 'highlight', selector: '#confirm-stats', position: 'top',
    label: 'event pulse',
    text: 'Three live stats refreshing every 30 seconds: posters explored, total visits today, votes cast.',
    duration: 5000 },
  { t: 176300, type: 'feed', actor: '_rand_', action: 'submitted a late ballot from row 3' },
  { t: 178600, type: 'feed', actor: '_rand_', action: 'voted (Peer Impact track)' },

  // ═══ 7. 2:45 PM — I'm running the show ══════════════════════
  { t: 180900, type: 'mode', mode: 'admin' },
  { t: 181400, type: 'scene-card', text: "2:45 PM  ·  I'm at the admin panel", duration: 1800 },
  { t: 183300, type: 'narrator', duration: 5000,
    text: "This screen is mine at your event — not yours. I run the event while you shake hands." },
  { t: 188500, type: 'highlight', selector: '#phase-toggle', position: 'bottom',
    label: 'phase toggle',
    text: 'Two phases: Session and Results. The flip triggers a 45-second grace period plus a live celebration on every phone.',
    duration: 6000 },
  { t: 194700, type: 'narrator', duration: 4500,
    text: 'One tap flips the ceremony. Every phone updates at the same second. Your part: watching.' },
  { t: 199400, type: 'highlight', selector: '#stats-grid', position: 'bottom',
    label: 'live stats',
    text: 'Check-ins, visits, voters — auto-updating. No refresh needed.',
    duration: 4700 },
  { t: 204300, type: 'highlight', selector: '#attendee-list-container', position: 'top',
    label: 'attendees',
    text: 'Grouped by role. Inline rename for walk-ups ("Voter 42" → real name). Per-attendee vote reset if someone fumbled.',
    duration: 5500 },
  { t: 210000, type: 'narrator', duration: 4500,
    text: "Presenter name misspelled on-screen? I fix it live. You don't touch anything." },
  { t: 214700, type: 'highlight', selector: '#results-container', position: 'top',
    label: 'live tallies',
    text: 'Two weighted tables: Distinguished + Peer Impact. Ties break on deepest support first.',
    duration: 5200 },
  { t: 220100, type: 'narrator', duration: 4500,
    text: "Tie-breaking, late ballots, grace periods — I handle it live. Your call is who takes the stage." },
  { t: 224800, type: 'highlight', selector: '#schedule-editor', position: 'top',
    label: 'schedule editor',
    text: 'Running late? Update the schedule here. Every attendee sees the new times within seconds.',
    duration: 5000 },
  { t: 230000, type: 'highlight', selector: '#admin-feed', position: 'top',
    label: 'activity feed',
    text: 'Every visit + every vote, live. Votes batched 300ms so "Jane voted 1st/2nd/3rd" lands as one line.',
    duration: 5500 },
  { t: 235700, type: 'narrator', duration: 5000,
    text: 'I take 3–4 events per semester. 30 attendees or 2,000 — I scope each engagement to fit.' },

  // ═══ 8. 3:00 PM — Voting closes ═════════════════════════════════
  { t: 240900, type: 'narrator', kind: 'gold', duration: 3500,
    text: 'All 108 votes in. I tap the flip.' },
  { t: 244700, type: 'scene-card', text: '3:00 PM  ·  Voting closes', duration: 1800 },
  { t: 246700, type: 'narrator', duration: 4500,
    text: '45-second grace after the flip — nobody mid-vote loses their ballot.' },

  // ═══ 9. 4:00 PM — Awards ceremony ══════════════════════════════
  { t: 251400, type: 'mode', mode: 'results' },
  { t: 252000, type: 'confetti' },
  { t: 252900, type: 'scene-card', text: '4:00 PM  ·  Awards ceremony', duration: 1800 },
  { t: 255100, type: 'narrator', kind: 'gold', duration: 5000,
    text: '🏆 Distinguished Poster #1: Zhiming Li (#13) — 17 points (4×1st · 2×2nd · 1×3rd).' },
  { t: 260400, type: 'highlight', selector: '.podium__slot--1', position: 'bottom',
    label: 'gold pedestal',
    text: "Staggered reveal — 3rd place first, then 2nd, then 1st at the 3-second mark. Confetti sync'd to the top slot.",
    duration: 5500 },
  { t: 266000, type: 'highlight', selector: 'hr.results-divider', position: 'bottom',
    label: 'two tracks',
    text: 'Below the first podium: the Peer Impact section. Both tracks render at the same moment on every phone.',
    duration: 5500 },
  { t: 271600, type: 'narrator', kind: 'gold', duration: 5000,
    text: '🏆 Peer Impact #1: Mohak Desai (#22) — 15 points (5×1st-place).' },
  { t: 276700, type: 'narrator', duration: 4500,
    text: "Both podiums, both confetti cannons — live. On every phone. I don't lift a finger after the flip." },
  { t: 281300, type: 'narrator', duration: 4500,
    text: 'Every past event stays live. Browse any year — permanent archive you can point alumni and funders at.' },

  // ═══ 10. Post-event — Trivia callback ═════════════════════════
  { t: 285900, type: 'scene-card', text: 'Post-event  ·  Trivia recap', duration: 1800 },
  { t: 287900, type: 'narrator', duration: 4000,
    text: 'Every polymer fact printed on the check-in card becomes a trivia question. Engagement that travels past the session.' },
  { t: 292100, type: 'trivia' },

  // ═══ 11. CTA — Formspree ═════════════════════════════════════
  // Trivia pauses the timer. CTA fires when trivia completes.
  { t: 292400, type: 'cta-overlay' },
  { t: 900000, type: 'loop' },
]
