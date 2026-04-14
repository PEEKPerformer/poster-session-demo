// Scripted scene timeline — drives the guided tour. Each entry runs at its
// scheduled time (in ms). Non-'mode' events use the current mode's view.
// Real Spring 2026 numbers anchor every scene.

export const TIMELINE = [
  // ═════════ 0. Cold open ══════════════════════════════════════
  { t: 0, type: 'title-card',
    lines: [
      'NERPG Spring 2026',
      'UConn — 117 attendees · 23 posters · 108 votes',
    ],
    sub: 'Let it play, or touch anything to pause · Use tabs to jump between views',
    duration: 5000 },

  // ═════════ 1. Arrive — polymer codename identity ═════════════
  { t: 5000, type: 'mode', mode: 'gallery' },
  { t: 5400, type: 'scene-card', text: '1.  Checking in', duration: 1500 },
  { t: 7100, type: 'welcome' },

  // The welcome overlay has three "how to" steps. Spotlight them one by one
  // so the viewer actually reads the tutorial instead of dismissing it.
  { t: 9500, type: 'highlight', selector: '.welcome-fact__code', position: 'bottom',
    label: 'your codename',
    text: 'Every attendee gets a polymer-themed codename at check-in. No email, no password, no signup.',
    duration: 4800 },
  { t: 14400, type: 'highlight', selector: '.welcome-fact__text', position: 'bottom',
    label: 'your fact',
    text: 'Each code comes with a polymer fact — a keepsake moment that doubles as trivia at the end.',
    duration: 4500 },

  { t: 19000, type: 'highlight', selector: '.welcome-step:nth-of-type(1) .welcome-step__title', position: 'right',
    label: 'step 1 — visit',
    text: 'Attendees walk the gallery and note poster numbers they want to remember.',
    duration: 3500 },
  { t: 22700, type: 'highlight', selector: '.welcome-step:nth-of-type(2) .welcome-step__title', position: 'right',
    label: 'step 2 — log',
    text: 'Tap the number to log a visit. Works offline — visits sync when the network comes back.',
    duration: 3500 },
  { t: 26400, type: 'highlight', selector: '.welcome-step:nth-of-type(3) .welcome-step__title', position: 'right',
    label: 'step 3 — vote',
    text: 'After 3 visits, voting unlocks. Rank your top 3 — weighted 3–2–1.',
    duration: 3500 },

  { t: 30300, type: 'dismiss-welcome' },

  // ═════════ 2. Explore the gallery ════════════════════════════
  { t: 31000, type: 'scene-card', text: '2.  Exploring the gallery', duration: 1500 },
  { t: 32500, type: 'highlight', selector: '.poster-card', position: 'right',
    label: 'poster card',
    text: 'Tap any card to see the full abstract, bookmark it, or log a visit.',
    duration: 4500 },
  { t: 37300, type: 'feed', actor: '_rand_', action: 'opened poster #7 — Cannabinoid antimicrobial SAR' },
  { t: 39500, type: 'feed', actor: '_rand_', action: 'logged a visit from Jonal Labs' },
  { t: 41800, type: 'feed', actor: '_rand_', action: 'signed in from AirBoss (Rochester)' },

  // ═════════ 3. Rank your top 3 ════════════════════════════════
  { t: 44000, type: 'mode', mode: 'vote' },
  { t: 44500, type: 'scene-card', text: '3.  Ranked ballot — top 3', duration: 1600 },
  { t: 46500, type: 'narrator', trackAware: true, duration: 5500,
    text: 'Ranked voting (3–2–1). You\'re voting in the {track}.' },
  { t: 52500, type: 'narrator', duration: 4500,
    text: 'Two award tracks run in parallel: Distinguished (industry-judged) and Peer Impact (peer-judged).' },

  // ═════════ 4. Confirm + event in progress ════════════════════
  { t: 57500, type: 'mode', mode: 'confirm' },
  { t: 58000, type: 'scene-card', text: '4.  Confirmation & schedule', duration: 1500 },
  { t: 60000, type: 'narrator', duration: 4500,
    text: 'Attendees see the event schedule, their picks, and live stats while votes keep arriving.' },
  { t: 64800, type: 'feed', actor: '_rand_', action: 'submitted their ranked ballot' },
  { t: 67500, type: 'feed', actor: '_rand_', action: 'deep-dwelled 869s on poster #3' },
  { t: 70000, type: 'feed', actor: '_rand_', action: 'voted from Jonal Labs' },

  // ═════════ 5. Admin live dashboard ═══════════════════════════
  { t: 72500, type: 'mode', mode: 'admin' },
  { t: 73000, type: 'scene-card', text: '5.  The admin\'s view', duration: 1800 },
  { t: 75000, type: 'narrator', duration: 5000,
    text: 'Admin sees the full event live — vote counts climbing, activity feed, and the phase toggle.' },
  { t: 80200, type: 'feed', actor: '_rand_', action: 'voted (Peer Impact)' },
  { t: 82500, type: 'feed', actor: '_rand_', action: 'added a note to poster #18' },
  { t: 85000, type: 'feed', actor: '_rand_', action: 'logged 16 visits total' },
  { t: 87800, type: 'narrator', kind: 'gold', duration: 3500,
    text: 'All 108 votes in — ready to close voting.' },

  // ═════════ 6. Results podium ═════════════════════════════════
  { t: 91500, type: 'mode', mode: 'results' },
  { t: 92000, type: 'scene-card', text: '6.  Winners — announced live', duration: 1800 },
  { t: 93500, type: 'confetti' },
  { t: 95000, type: 'narrator', kind: 'gold', duration: 4500,
    text: 'Distinguished #1: Zhiming Li — 17 pts (4×1st · 2×2nd · 1×3rd).' },
  { t: 100000, type: 'narrator', kind: 'gold', duration: 4500,
    text: 'Peer Impact #1: Mohak Desai — 15 pts (5×1st-place).' },
  { t: 104800, type: 'narrator', duration: 4500,
    text: 'Both podiums render on every attendee\'s phone at the same moment.' },

  // ═════════ 7. Trivia — the codename callback ═════════════════
  { t: 110000, type: 'scene-card', text: '7.  Trivia — polymer facts recap', duration: 1600 },
  { t: 111800, type: 'trivia' },

  // ═════════ 8. CTA ════════════════════════════════════════════
  // Trivia pauses the timer. CTA fires when trivia ends.
  { t: 112000, type: 'cta-overlay' },
  { t: 300000, type: 'loop' },
]
