// The mode switcher — the single abstraction for "what view is the demo
// showing right now". Tabs call this. The tour calls this. Either way, the
// state is set up so the view renders correctly with no stray stale state.

import { setState } from '../state.js'

export const MODES = ['gallery', 'vote', 'confirm', 'admin', 'results']

// Real winners/picks from Spring 2026 — the viewer's ballot always reflects
// the actual winners so the results screen feels earned.
const PICKS = [13, 22, 7] // rank 1..3

function ensureDemoAttendee() {
  // Read the current viewer identity from the global (set by simulator).
  return window.__demoViewer || { code: 'CHAIN', name: 'Guest', role: 'attendee' }
}

function ensureAdmin() {
  return { code: 'ADMN', name: 'Brenden Ferland', role: 'admin' }
}

export function setDemoMode(mode) {
  const viewer = ensureDemoAttendee()

  // Close any lingering modals/overlays before a mode switch.
  document.querySelectorAll('.poster-modal, .welcome-overlay, .vote-confirm-overlay').forEach(n => n.remove())

  switch (mode) {
    case 'gallery':
      setState({
        attendee: viewer,
        eventPhase: 'session',
        visits: [],
        myVotes: [],
      })
      navigate('#/gallery')
      break

    case 'vote':
      setState({
        attendee: viewer,
        eventPhase: 'session',
        // Pre-populate with 5 visits so voting is unlocked immediately.
        visits: [2, 5, 7, 13, 18],
        myVotes: [],
      })
      navigate('#/vote')
      break

    case 'confirm':
      setState({
        attendee: viewer,
        eventPhase: 'session',
        visits: [2, 5, 7, 13, 18],
        myVotes: PICKS.map((num, i) => ({ poster_number: num, rank: i + 1 })),
      })
      navigate('#/confirm')
      break

    case 'admin':
      setState({
        attendee: ensureAdmin(),
        eventPhase: 'session',
      })
      navigate('#/admin')
      break

    case 'results':
      setState({
        attendee: viewer,
        eventPhase: 'results',
        // Past phaseUpdatedAt → skip the 45s results grace period.
        phaseUpdatedAt: new Date(Date.now() - 60_000).toISOString(),
        visits: [2, 5, 7, 13, 18],
        myVotes: PICKS.map((num, i) => ({ poster_number: num, rank: i + 1 })),
      })
      navigate('#/vote')
      break

    default:
      navigate('#/gallery')
  }

  // Notify the tab bar (if mounted) so it highlights the active tab.
  window.dispatchEvent(new CustomEvent('demo:mode', { detail: { mode } }))
}

function navigate(hash) {
  if (window.location.hash !== hash) {
    window.location.hash = hash
  } else {
    // Force re-render if already on target.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}
