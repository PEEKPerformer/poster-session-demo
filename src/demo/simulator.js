// Timeline runner. Walks through TIMELINE entries in order, dispatching each
// at its scheduled (scaled) time. Supports play/pause/restart/speed changes.

import { getState, setState } from '../state.js'
import { logVisit } from '../supabase.js'
import { TIMELINE } from './timeline.js'

const DEMO_ATTENDEE = { code: 'DEMO', name: 'Guest viewer', role: 'attendee' }

let timerId = null
let startedAt = 0
let pausedAt = 0
let pausedElapsed = 0
let speed = 1
let nextIndex = 0
let paused = false
const selections = []
const listeners = new Set()

export function onSimState(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  const state = { paused, speed, progress: getElapsed() / getTotal(), elapsed: getElapsed() }
  listeners.forEach(fn => fn(state))
}

function getTotal() { return TIMELINE[TIMELINE.length - 1].t }
function getElapsed() {
  if (paused) return pausedElapsed
  return (performance.now() - startedAt) * speed + pausedElapsed
}

export function startDemo() {
  // Reset only the viewer-specific state. Keep posters + schedule that
  // syncData loaded — clearing them would leave the gallery empty.
  setState({
    attendee: DEMO_ATTENDEE,
    eventPhase: 'session',
    visits: [],
    myVotes: [],
  })
  nextIndex = 0
  selections.length = 0
  pausedElapsed = 0
  paused = false
  startedAt = performance.now()
  loop()
}

export function pauseDemo() {
  if (paused) return
  paused = true
  pausedAt = performance.now()
  pausedElapsed = getElapsed()
  clearTimeout(timerId)
  emit()
}

export function resumeDemo() {
  if (!paused) return
  paused = false
  startedAt = performance.now()
  loop()
}

export function restartDemo() {
  clearTimeout(timerId)
  startDemo()
}

export function setDemoSpeed(newSpeed) {
  const currentElapsed = getElapsed()
  speed = newSpeed
  startedAt = performance.now()
  pausedElapsed = currentElapsed
  emit()
}

export function getDemoSpeed() { return speed }

// ── Event handlers ────────────────────────────────────────────

function handleEvent(ev) {
  switch (ev.type) {
    case 'banner-intro':
      // Banner initializes itself on page load; this is a noop but left
      // in the timeline so the first entry marks t=0 clearly.
      break

    case 'navigate':
      if (window.location.hash !== ev.hash) window.location.hash = ev.hash
      break

    case 'toast':
      showToast(ev.text, ev.kind || 'default')
      break

    case 'feed':
      showFeedItem(`${ev.actor} ${ev.action}`)
      break

    case 'open-modal': {
      // Click the card for the given poster to open its modal.
      const state = getState()
      if (window.location.hash !== '#/gallery') window.location.hash = '#/gallery'
      // Give the router a tick to render, then click.
      setTimeout(() => {
        const cards = document.querySelectorAll('.poster-card')
        const poster = state.posters.find(p => p.number === ev.poster)
        if (!poster) return
        for (const card of cards) {
          const title = card.querySelector('.poster-card__title')?.textContent || ''
          if (title.startsWith(poster.title.slice(0, 20))) {
            card.click()
            break
          }
        }
      }, 120)
      break
    }

    case 'close-modal': {
      const close = document.querySelector('.poster-modal__close')
      if (close) close.click()
      break
    }

    case 'log-visit': {
      const state = getState()
      const next = [...state.visits]
      if (!next.includes(ev.poster)) next.push(ev.poster)
      setState({ visits: next })
      // Call mock logVisit so in-memory store stays consistent.
      logVisit(DEMO_ATTENDEE.code, ev.poster).catch(() => {})
      // Animate the Log Visit button if the modal is open.
      const btn = document.querySelector('.modal__log-visit')
      if (btn && !btn.disabled) btn.click()
      break
    }

    case 'select': {
      selections[ev.rank - 1] = ev.poster
      // Try to click the matching card on /vote for visual feedback.
      if (window.location.hash === '#/vote') {
        const cards = document.querySelectorAll('.poster-card')
        const state = getState()
        const poster = state.posters.find(p => p.number === ev.poster)
        if (poster) {
          for (const card of cards) {
            const title = card.querySelector('.poster-card__title')?.textContent || ''
            if (title.startsWith(poster.title.slice(0, 20))) {
              card.click()
              break
            }
          }
        }
      }
      break
    }

    case 'submit-ballot': {
      // Skip the confirm overlay; just set the myVotes directly for speed.
      const picks = selections.filter(Boolean)
      setState({
        myVotes: picks.map((num, i) => ({ poster_number: num, rank: i + 1 })),
      })
      break
    }

    case 'phase':
      setState({ eventPhase: ev.to, phaseUpdatedAt: new Date().toISOString() })
      break

    case 'cta-overlay':
      import('./cta.js').then(m => m.showCtaOverlay())
      break

    case 'loop':
      // Schedule the restart one tick out so we finish the current loop() call
      // cleanly before state gets reset.
      setTimeout(() => restartDemo(), 0)
      break
  }
}

function loop() {
  if (paused) return
  const elapsed = getElapsed()
  while (nextIndex < TIMELINE.length && TIMELINE[nextIndex].t <= elapsed) {
    try { handleEvent(TIMELINE[nextIndex]) }
    catch (e) { console.warn('[demo] event failed:', TIMELINE[nextIndex], e) }
    nextIndex++
  }
  emit()
  if (nextIndex < TIMELINE.length) {
    // setTimeout (not rAF) so the timeline still advances when the tab isn't
    // focused. rAF would stall in a background tab.
    timerId = setTimeout(loop, 33)
  }
}

// ── Visual helpers ────────────────────────────────────────────

function showToast(text, kind) {
  const toast = document.createElement('div')
  toast.className = `demo-toast demo-toast--${kind}`
  toast.textContent = text
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('demo-toast--visible'))
  setTimeout(() => {
    toast.classList.remove('demo-toast--visible')
    setTimeout(() => toast.remove(), 300)
  }, 3800)
}

function showFeedItem(text) {
  let feed = document.querySelector('.demo-feed')
  if (!feed) {
    feed = document.createElement('div')
    feed.className = 'demo-feed'
    document.body.appendChild(feed)
  }
  const item = document.createElement('div')
  item.className = 'demo-feed__item'
  item.innerHTML = `<span class="demo-feed__dot"></span>${text}`
  feed.prepend(item)
  requestAnimationFrame(() => item.classList.add('demo-feed__item--visible'))
  // Keep last 4 items
  const items = feed.querySelectorAll('.demo-feed__item')
  for (let i = 4; i < items.length; i++) items[i].remove()
  setTimeout(() => item.remove(), 8000)
}
