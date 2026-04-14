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
  { t: 9500, type: 'highlight', selector: '.welcome-fact__code', position: 'bottom',
    label: 'your codename',
    text: 'Every attendee gets a polymer-themed codename at check-in. No email, no password, no signup.',
    duration: 5000 },
  { t: 14800, type: 'highlight', selector: '.welcome-fact__text', position: 'bottom',
    label: 'your fact',
    text: 'Each code comes with a personalized polymer fact — a keepsake moment that doubles as trivia later.',
    duration: 5200 },
  { t: 20300, type: 'dismiss-welcome' },

  // ═════════ 2. Explore the gallery ════════════════════════════
  { t: 21000, type: 'scene-card', text: '2.  Exploring the gallery', duration: 1500 },
  { t: 22500, type: 'highlight', selector: '.poster-card', position: 'right',
    label: 'poster card',
    text: 'Tap any card to see the full abstract, bookmark it, or log a visit.',
    duration: 4500 },
  { t: 27300, type: 'feed', actor: '_rand_', action: 'opened poster #7 — Cannabinoid antimicrobial SAR' },
  { t: 29500, type: 'feed', actor: '_rand_', action: 'logged a visit from Jonal Labs' },
  { t: 31800, type: 'feed', actor: '_rand_', action: 'signed in from AirBoss (Rochester)' },

  // ═════════ 3. Rank your top 3 ════════════════════════════════
  { t: 34000, type: 'mode', mode: 'vote' },
  { t: 34500, type: 'scene-card', text: '3.  Ranked ballot — top 3', duration: 1600 },
  { t: 36500, type: 'narrator', trackAware: true, duration: 5500,
    text: 'Ranked voting (3–2–1). You\'re voting in the {track}.' },
  { t: 42500, type: 'narrator', duration: 4500,
    text: 'Two award tracks run in parallel: Distinguished (industry-judged) and Peer Impact (peer-judged).' },

  // ═════════ 4. Confirm + event in progress ════════════════════
  { t: 47500, type: 'mode', mode: 'confirm' },
  { t: 48000, type: 'scene-card', text: '4.  Confirmation & schedule', duration: 1500 },
  { t: 50000, type: 'narrator', duration: 4500,
    text: 'Attendees see the event schedule, their picks, and live stats while votes keep arriving.' },
  { t: 54800, type: 'feed', actor: '_rand_', action: 'submitted their ranked ballot' },
  { t: 57500, type: 'feed', actor: '_rand_', action: 'deep-dwelled 869s on poster #3' },
  { t: 60000, type: 'feed', actor: '_rand_', action: 'voted from Jonal Labs' },

  // ═════════ 5. Admin live dashboard ═══════════════════════════
  { t: 62500, type: 'mode', mode: 'admin' },
  { t: 63000, type: 'scene-card', text: '5.  The admin\'s view', duration: 1800 },
  { t: 65000, type: 'narrator', duration: 5000,
    text: 'Admin sees the full event live — vote counts climbing, activity feed, and the phase toggle.' },
  { t: 70200, type: 'feed', actor: '_rand_', action: 'voted (Peer Impact)' },
  { t: 72500, type: 'feed', actor: '_rand_', action: 'added a note to poster #18' },
  { t: 75000, type: 'feed', actor: '_rand_', action: 'logged 16 visits total' },
  { t: 77800, type: 'narrator', kind: 'gold', duration: 3500,
    text: 'All 108 votes in — ready to close voting.' },

  // ═════════ 6. Results podium ═════════════════════════════════
  { t: 81500, type: 'mode', mode: 'results' },
  { t: 82000, type: 'scene-card', text: '6.  Winners — announced live', duration: 1800 },
  { t: 83500, type: 'confetti' },
  { t: 85000, type: 'narrator', kind: 'gold', duration: 4500,
    text: 'Distinguished #1: Zhiming Li — 17 pts (4×1st-place · 2×2nd · 1×3rd).' },
  { t: 90000, type: 'narrator', kind: 'gold', duration: 4500,
    text: 'Peer Impact #1: Mohak Desai — 15 pts (5×1st-place).' },
  { t: 94800, type: 'narrator', duration: 4500,
    text: 'Both podiums render on every attendee\'s phone at the same moment.' },

  // ═════════ 7. Trivia — the codename callback ═════════════════
  { t: 100000, type: 'scene-card', text: '7.  Trivia — polymer facts recap', duration: 1600 },
  { t: 101800, type: 'trivia' },

  // ═════════ 8. CTA ════════════════════════════════════════════
  // Note: trivia pauses the timer during its ~20s run. The CTA fires
  // as soon as trivia completes (via pauseElapsedTimer/resumeElapsedTimer
  // in simulator). The loop entry below is the hard ceiling.
  { t: 102000, type: 'cta-overlay' },
  { t: 300000, type: 'loop' },
]
