import './style.css'
import './demo/demo.css'
import { initRouter, registerRoute, navigate } from './router.js'
import { loadState, getState, setState, subscribe, getPendingVisits, clearPendingVisits, getPendingVotes, clearPendingVotes } from './state.js'
import { getPosters, getEventState, logVisit, submitVotes, getMyVotes } from './supabase.js'
import { initNetwork } from './lib/network.js'
import { track, identify } from './lib/track.js'

import { renderAuth } from './views/auth.js'
import { renderGallery } from './views/gallery.js'
import { renderVote } from './views/vote.js'
import { renderConfirm } from './views/confirm.js'

import { startDemo } from './demo/simulator.js'
import { mountDemoBanner } from './demo/banner.js'

// Admin view — lazy-loaded for the admin scene of the demo.
const renderAdmin = (root) => import('./views/admin.js').then(m => m.renderAdmin(root))

async function boot() {
  loadState()

  // Re-identify returning users on boot
  const saved = getState().attendee
  if (saved) identify(saved.code, { name: saved.name, role: saved.role })

  // Register routes
  registerRoute('#/auth', renderAuth)
  registerRoute('#/gallery', renderGallery)
  registerRoute('#/vote', renderVote)
  registerRoute('#/confirm', renderConfirm)
  registerRoute('#/admin', renderAdmin)

  // Auto-auth: if ?code= param present, route to auth
  if (new URLSearchParams(window.location.search).get('code')) {
    window.location.hash = '#/auth'
  }

  // Legacy redirect: #/pad → #/gallery (pad merged into gallery)
  if (window.location.hash === '#/pad') {
    window.location.hash = '#/gallery'
  }

  // Deep-link: #/poster/N → open gallery with that poster's modal
  const posterMatch = window.location.hash.match(/^#\/poster\/(\d+)$/)
  if (posterMatch) {
    window.__nerpg_auto_poster = parseInt(posterMatch[1], 10)
    window.location.hash = '#/gallery'
  }

  // Init router
  const root = document.querySelector('#app')
  initRouter(root)

  // Init polymer network background — decorative, defer to idle so it
  // doesn't contend with LCP-critical work.
  const canvas = document.querySelector('#network-canvas')
  if (canvas) {
    const run = () => initNetwork(canvas)
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 })
    else setTimeout(run, 800)
  }

  // Fetch poster data + event state, then re-render current view
  syncData().then(() => {
    // Re-trigger current route to pick up fresh data
    const hash = window.location.hash || '#/gallery'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    // Boot the demo — mount the banner and start the scripted timeline.
    mountDemoBanner()
    startDemo()
  })

  // No forced redirect — gallery is the public landing page.
  // Individual views (vote, admin) handle their own auth guards.

  // Sync pending visits + re-fetch data when coming online
  window.addEventListener('online', () => {
    const pending = getPendingVisits()
    const pendingVotes = getPendingVotes()
    track('app_came_online', { pending_visits: pending.length, has_pending_votes: !!pendingVotes })
    hideOfflineBanner()
    syncPendingVisits()
    syncPendingVotesQueue()
    syncData().then(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
  })
  window.addEventListener('offline', () => {
    track('app_went_offline')
    showOfflineBanner()
  })

  // Show banner immediately if already offline
  if (!navigator.onLine) showOfflineBanner()

  // Re-sync when phone wakes from sleep/background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncData().then(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
    }
  })

  // Idle nudge — remind attendees to keep exploring
  initIdleNudge()
}

async function syncData() {
  try {
    const [posters, eventState] = await Promise.all([
      getPosters(),
      getEventState(),
    ])
    if (posters.length) setState({ posters })
    if (eventState.phase) setState({
      eventPhase: eventState.phase,
      phaseUpdatedAt: eventState.updated_at,
      schedule: eventState.schedule || [],
      lastSync: Date.now(),
    })
  } catch {
    console.warn('[NERPGApp] Offline: using cached data')
  }
}

async function syncPendingVisits() {
  const pending = getPendingVisits()
  if (!pending.length) return

  const remaining = []
  let synced = 0
  for (const visit of pending) {
    const ok = await logVisit(visit.attendee_code, visit.poster_number)
    if (!ok) {
      remaining.push(visit)
      break // network still down — keep the rest too
    }
    synced++
  }

  if (synced > 0) {
    track('visit_synced_offline', { count_synced: synced, count_remaining: pending.length - synced })
  }

  // Keep un-synced items (including ones we didn't attempt after a failure)
  if (remaining.length) {
    const failedIndex = pending.indexOf(remaining[0])
    const allRemaining = pending.slice(failedIndex)
    localStorage.setItem('nerpg_pending_visits', JSON.stringify(allRemaining))
  } else {
    clearPendingVisits()
  }
}

async function syncPendingVotesQueue() {
  const pending = getPendingVotes()
  if (!pending) return

  const result = await submitVotes(pending.attendee_code, pending.selections)
  if (result.ok) {
    track('vote_synced_offline')
    clearPendingVotes()
  } else {
    // Check if votes already exist (PK conflict = previously succeeded)
    const existing = await getMyVotes(pending.attendee_code)
    if (existing.length > 0) {
      clearPendingVotes() // Already voted — clear stale queue
    }
  }
}

function showOfflineBanner() {
  if (document.querySelector('.offline-banner')) return
  const banner = document.createElement('div')
  banner.className = 'offline-banner'
  banner.textContent = 'Offline — visits will sync when reconnected'
  document.body.appendChild(banner)
}

function hideOfflineBanner() {
  document.querySelector('.offline-banner')?.remove()
}

// ── Idle nudge ──────────────────────────────────────────

function initIdleNudge() {
  const IDLE_MS = 15 * 60 * 1000 // 15 minutes
  let nudgeTimer = null
  let nudgeShown = false

  function resetTimer() {
    nudgeShown = false
    clearTimeout(nudgeTimer)
    nudgeTimer = setTimeout(checkIdle, IDLE_MS)
  }

  function checkIdle() {
    if (nudgeShown) return
    const state = getState()
    if (!state.attendee || state.attendee.role === 'admin') return
    if (state.eventPhase !== 'session') return

    const visited = state.visits.length
    const total = state.posters.length
    if (visited === 0 || visited >= total) return

    nudgeShown = true
    track('idle_nudge_shown', {
      reason: 'idle_during_session',
      visits_count: visited,
      total_posters: total,
      progress_pct: Math.round(100 * visited / total),
    })
    showToast(`You've visited ${visited} poster${visited === 1 ? '' : 's'} — keep exploring!`)
  }

  // Reset on state changes (visit logged, etc.)
  subscribe(() => resetTimer())

  // Reset on user interaction
  document.addEventListener('click', resetTimer, { passive: true })
  resetTimer()
}

function showToast(text) {
  if (document.querySelector('.toast')) return
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = text
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('toast--visible'))
  setTimeout(() => {
    toast.classList.remove('toast--visible')
    setTimeout(() => toast.remove(), 300)
  }, 5000)
}

boot()
