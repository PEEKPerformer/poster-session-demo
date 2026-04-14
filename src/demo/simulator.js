// Timeline runner. Walks through TIMELINE entries in order, dispatching each
// at its scheduled (scaled) time. Supports play/pause/restart/speed changes.

import { getState, setState } from '../state.js'
import { logVisit } from '../supabase.js'
import { TIMELINE } from './timeline.js'

// Assign a real polymer codename so the welcome-overlay fact renders. CHAIN
// is a good showcase ("A single polyisoprene chain in natural rubber...").
const DEMO_ATTENDEE = { code: 'CHAIN', name: 'Guest', role: 'attendee' }
const DEMO_ADMIN    = { code: 'ADMN',  name: 'Brenden Ferland', role: 'admin' }

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
  // Clean any lingering overlays from a previous run
  document.querySelectorAll('.welcome-overlay, .demo-title-card, .demo-scene-card, .demo-cta-overlay, .poster-modal, .demo-feed').forEach(n => n.remove())
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
    case 'title-card':
      showTitleCard(ev)
      break

    case 'scene-card':
      showSceneCard(ev)
      break

    case 'welcome': {
      // Fire the app's real welcome overlay so the polymer codename + fact render.
      import('../views/auth.js').then(m => {
        const { attendee } = getState()
        m.showWelcome(attendee.name, attendee.role, attendee.code, () => {})
      })
      break
    }

    case 'dismiss-welcome': {
      const w = document.querySelector('.welcome-overlay')
      if (w) {
        const btn = w.querySelector('.welcome-btn')
        if (btn) btn.click(); else w.remove()
      }
      break
    }

    case 'switch-attendee':
      setState({ attendee: ev.attendee === 'admin' ? DEMO_ADMIN : DEMO_ATTENDEE })
      // Re-render current route so header/nav update for the new role
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      break

    case 'navigate':
      if (window.location.hash !== ev.hash) {
        window.location.hash = ev.hash
      } else {
        // Force re-render even if already on the target hash.
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
      break

    case 'toast':
      showToast(ev.text, ev.kind || 'default')
      break

    case 'feed':
      showFeedItem(`${ev.actor} ${ev.action}`)
      break

    case 'open-modal': {
      const state = getState()
      if (window.location.hash !== '#/gallery') window.location.hash = '#/gallery'
      setTimeout(() => {
        const poster = state.posters.find(p => p.number === ev.poster)
        if (!poster) return
        const cards = document.querySelectorAll('.poster-card')
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
      logVisit(DEMO_ATTENDEE.code, ev.poster).catch(() => {})
      const btn = document.querySelector('.modal__log-visit')
      if (btn && !btn.disabled) btn.click()
      break
    }

    case 'select': {
      selections[ev.rank - 1] = ev.poster
      if (window.location.hash === '#/vote') {
        const state = getState()
        const poster = state.posters.find(p => p.number === ev.poster)
        if (!poster) break
        const cards = document.querySelectorAll('.poster-card')
        for (const card of cards) {
          const title = card.querySelector('.poster-card__title')?.textContent || ''
          if (title.startsWith(poster.title.slice(0, 20))) {
            card.click()
            break
          }
        }
      }
      break
    }

    case 'submit-ballot': {
      const picks = selections.filter(Boolean)
      setState({
        myVotes: picks.map((num, i) => ({ poster_number: num, rank: i + 1 })),
      })
      break
    }

    case 'phase':
      // Set phaseUpdatedAt well in the past so the 45s results grace period is
      // already expired — demo skips the "voting just closed" interstitial
      // and jumps straight to the celebration podium.
      setState({
        eventPhase: ev.to,
        phaseUpdatedAt: new Date(Date.now() - 60_000).toISOString(),
      })
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      break

    case 'click-phase-flip': {
      const btn = document.querySelector('[data-phase="results"]')
                || Array.from(document.querySelectorAll('button')).find(b => /flip|results/i.test(b.textContent) && !b.disabled)
      if (btn) {
        btn.click()
        setTimeout(() => {
          const confirm = document.querySelector('#phase-confirm')
          if (confirm) confirm.click()
          setState({
            eventPhase: 'results',
            phaseUpdatedAt: new Date(Date.now() - 60_000).toISOString(),
          })
        }, 400)
      } else {
        setState({
          eventPhase: 'results',
          phaseUpdatedAt: new Date(Date.now() - 60_000).toISOString(),
        })
      }
      break
    }

    case 'confetti':
      import('../lib/confetti.js').then(m => m.launchConfetti()).catch(() => {})
      break

    case 'cta-overlay':
      import('./cta.js').then(m => m.showCtaOverlay())
      break

    case 'loop':
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
  const items = feed.querySelectorAll('.demo-feed__item')
  for (let i = 4; i < items.length; i++) items[i].remove()
  setTimeout(() => item.remove(), 9000)
}

function showTitleCard({ lines = [], sub, duration = 3500 }) {
  document.querySelectorAll('.demo-title-card').forEach(n => n.remove())
  const card = document.createElement('div')
  card.className = 'demo-title-card'
  card.innerHTML = `
    <div class="demo-title-card__inner">
      ${lines.map((l, i) => `<div class="demo-title-card__line demo-title-card__line--${i}">${l}</div>`).join('')}
      ${sub ? `<div class="demo-title-card__sub">${sub}</div>` : ''}
    </div>
  `
  document.body.appendChild(card)
  requestAnimationFrame(() => card.classList.add('demo-title-card--visible'))
  setTimeout(() => {
    card.classList.remove('demo-title-card--visible')
    setTimeout(() => card.remove(), 400)
  }, duration)
}

function showSceneCard({ text, duration = 2000 }) {
  document.querySelectorAll('.demo-scene-card').forEach(n => n.remove())
  const card = document.createElement('div')
  card.className = 'demo-scene-card'
  card.textContent = text
  document.body.appendChild(card)
  requestAnimationFrame(() => card.classList.add('demo-scene-card--visible'))
  setTimeout(() => {
    card.classList.remove('demo-scene-card--visible')
    setTimeout(() => card.remove(), 400)
  }, duration)
}
