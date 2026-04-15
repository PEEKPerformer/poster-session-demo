// Tour runner. Walks through TIMELINE entries, delegating rendering to
// setDemoMode (for view state) + highlight (for spotlight tooltips) +
// showToast/showFeedItem (for ambient narration).
//
// Each run randomizes the viewer's codename and the ambient actors so
// repeat viewings feel different.

import { getState, setState, subscribe } from '../state.js'
import { TIMELINE as BASE_TIMELINE } from './timeline.js'
import { CODENAME_POOL, getCodeFact } from '../lib/codename-facts.js'
import { staticAttendees } from '../data/static.js'
import { setDemoMode } from './mode.js'
import { highlight, clearHighlight } from './highlight.js'
import { startTrivia } from './trivia.js'

// Which codenames are safe demo-viewer identities — anything with a polymer
// fact (the welcome overlay needs one) minus the admin code.
const VIEWER_POOL = CODENAME_POOL.filter(c => !!getCodeFact(c))

const ROLE_BY_CODE = Object.fromEntries(
  staticAttendees.map(a => [a.code, a.role])
)

let activeTimeline = BASE_TIMELINE
let timerId = null
let startedAt = 0
let pausedElapsed = 0
let speed = 1
let nextIndex = 0
let paused = false
// Controls (tabs, scrub, content-touch-to-pause) are LOCKED during the
// scripted tour — otherwise viewers fight the simulator and land in broken
// states. Unlocked via an 'unlock' timeline event near the CTA.
let locked = true
const listeners = new Set()
const lockListeners = new Set()

export function onSimState(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isDemoLocked() { return locked }
export function onDemoLockChange(fn) {
  lockListeners.add(fn)
  return () => lockListeners.delete(fn)
}
export function unlockDemo() {
  if (!locked) return
  locked = false
  document.body.classList.remove('demo-locked')
  lockListeners.forEach(fn => fn(false))
  showToast('🔓 Your turn — tap any tab to explore', 'gold', 5500)
}

function emit() {
  const state = { paused, speed, progress: getElapsed() / getTotal(), elapsed: getElapsed(), nextIndex }
  listeners.forEach(fn => fn(state))
}

function getTotal() { return activeTimeline[activeTimeline.length - 1].t }
function getElapsed() {
  if (paused) return pausedElapsed
  return (performance.now() - startedAt) * speed + pausedElapsed
}

// ── Randomization ─────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function chooseViewer() {
  const code = pick(VIEWER_POOL)
  const role = ROLE_BY_CODE[code] || 'attendee'
  // Map presenter/student codes to student role so they vote Peer Impact
  // (demo covers both tracks via randomness).
  const demoRole = ['presenter', 'student'].includes(role) ? 'student' : 'attendee'
  return { code, name: 'Guest', role: demoRole }
}

function randomizeTimeline(viewer) {
  const actorPool = shuffle(VIEWER_POOL.filter(c => c !== viewer.code && c !== 'ADMN'))
  let cursor = 0
  const nextActor = () => actorPool[(cursor++) % actorPool.length]

  return BASE_TIMELINE.map(ev => {
    if (ev.type === 'feed' && ev.actor === '_rand_') {
      return { ...ev, actor: nextActor() }
    }
    if (ev.type === 'narrator' && ev.trackAware) {
      const track = viewer.role === 'student'
        ? 'Peer Impact (student / presenter panel)'
        : 'Distinguished (industry panel)'
      return { ...ev, text: ev.text.replace('{track}', track) }
    }
    return ev
  })
}

// ── Lifecycle ─────────────────────────────────────────────────

export function startDemo() {
  const viewer = chooseViewer()
  window.__demoViewer = viewer
  activeTimeline = randomizeTimeline(viewer)

  setState({
    attendee: viewer,
    eventPhase: 'session',
    visits: [],
    myVotes: [],
  })

  // Clean any leftover overlays from a prior run.
  document.querySelectorAll(
    '.welcome-overlay, .demo-title-card, .demo-scene-card, .demo-cta-overlay, .demo-trivia, .poster-modal, .demo-feed, .demo-highlight-spot, .demo-highlight-tip, .demo-resume-chip, .demo-prompt, .design-dna, .thankyou-reel'
  ).forEach(n => n.remove())
  document.body.classList.remove('has-demo-prompt')
  clearHighlight()

  // Reset lock — restart puts controls back under the scripted tour.
  locked = true
  document.body.classList.add('demo-locked')
  lockListeners.forEach(fn => fn(true))

  nextIndex = 0
  pausedElapsed = 0
  paused = false
  startedAt = performance.now()
  loop()
}

export function pauseDemo() {
  if (paused) return
  paused = true
  pausedElapsed = getElapsed()
  clearTimeout(timerId)
  clearHighlight()
  showResumeChip()
  emit()
}

export function resumeDemo() {
  if (!paused) return
  paused = false
  startedAt = performance.now()
  hideResumeChip()
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

// Seek to an absolute timeline position (ms). Replays state-changing events
// (mode/phase/welcome/etc.) without delays, skips pure ephemerals (toasts,
// scene cards, feed, highlights, bursts) so the view lands in the right
// composed state for that moment in the timeline. Always pauses; viewer
// hits play to resume from the new position.
export function seekDemo(targetMs) {
  clearTimeout(timerId)
  paused = true

  // Clear visual ephemera
  document.querySelectorAll(
    '.demo-toast, .demo-scene-card, .demo-feed, .demo-title-card, .welcome-overlay, .poster-modal, .demo-cta-overlay, .demo-trivia, .demo-resume-chip, .demo-prompt, .design-dna, .thankyou-reel'
  ).forEach(n => n.remove())
  document.body.classList.remove('has-demo-prompt')
  clearHighlight()

  // Reset viewer state to base then re-apply state-changing events up to target
  setState({
    attendee: window.__demoViewer || { code: 'CHAIN', name: 'Guest', role: 'attendee' },
    eventPhase: 'session',
    visits: [],
    myVotes: [],
  })

  nextIndex = 0
  while (nextIndex < activeTimeline.length && activeTimeline[nextIndex].t <= targetMs) {
    const ev = activeTimeline[nextIndex]
    // Only apply structural / state-changing events on seek; skip ephemerals
    // and welcome (welcome would re-pop; let user replay the tour to see it)
    if (['mode', 'phase', 'switch-attendee', 'navigate', 'open-modal',
         'submit-ballot', 'log-visit', 'select', 'click-phase-flip',
         'cta-overlay', 'trivia'].includes(ev.type)) {
      try { handleEvent(ev) } catch { /* skip */ }
    }
    nextIndex++
  }

  pausedElapsed = targetMs
  showResumeChip()
  emit()
}

export function getTotalDuration() { return getTotal() }

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

    case 'narrator':
    case 'toast':
      showToast(ev.text, ev.kind || 'default', ev.duration)
      break

    case 'feed':
      showFeedItem(`${ev.actor} ${ev.action}`)
      break

    case 'mode':
      setDemoMode(ev.mode)
      break

    case 'highlight':
      highlight(ev.selector, ev.text, {
        duration: ev.duration || 4500,
        position: ev.position || 'bottom',
        label: ev.label,
      })
      break

    case 'welcome': {
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

    case 'log-visit': {
      // Tour-driven visit log (used to seed visits[1] before prompting the
      // viewer to log 2 more themselves).
      const next = [...getState().visits]
      if (!next.includes(ev.poster)) next.push(ev.poster)
      setState({ visits: next })
      break
    }

    case 'prompt-action': {
      // Pause tour, show a sticky prompt, resume when predicate(state) is true
      // (or when viewer hits Skip, or after timeoutMs).
      pauseElapsedTimer()
      showActionPrompt(ev.text, ev.condition, ev.timeoutMs || 90_000, () => {
        resumeElapsedTimer()
      })
      break
    }

    case 'open-modal': {
      // Call the poster-card component API directly rather than clicking an
      // off-screen card — more robust and doesn't depend on DOM layout.
      if (window.location.hash !== '#/gallery') window.location.hash = '#/gallery'
      setTimeout(() => {
        const poster = getState().posters.find(p => p.number === ev.poster)
        if (!poster) return
        import('../components/poster-card.js').then(m => {
          m.openPosterModal(poster, {
            visited: getState().visits.includes(ev.poster),
            onLogVisit: () => {},
          })
        })
      }, 220)
      break
    }

    case 'close-modal': {
      const close = document.querySelector('.poster-modal__close')
      if (close) close.click()
      else document.querySelectorAll('.poster-modal').forEach(n => n.remove())
      break
    }

    case 'burst': {
      // Apple-commercial moment: fire a rapid cascade of feed items so the
      // "event feels alive" at peak. Each shifts in at a tight stagger; the
      // feed's rolling 4-item window creates the churn.
      const items = ev.items || []
      items.forEach((text, i) => setTimeout(() => showFeedItem(text), i * (ev.stagger || 260)))
      if (ev.toast) setTimeout(() => showToast(ev.toast, ev.kind || 'gold', ev.toastDuration || 4500), items.length * (ev.stagger || 260))
      break
    }

    case 'confetti':
      import('../lib/confetti.js').then(m => m.launchConfetti()).catch(() => {})
      break

    case 'trivia':
      pauseElapsedTimer()
      startTrivia(() => resumeElapsedTimer())
      break

    case 'cta-overlay':
      import('./cta.js').then(m => m.showCtaOverlay())
      break

    case 'design-dna':
      import('./design-dna.js').then(m => m.showDesignDna(ev.duration || 14000))
      break

    case 'thankyou-reel':
      import('./thankyou-reel.js').then(m => m.showThankYouReel(ev.duration || 10500))
      break

    case 'unlock':
      unlockDemo()
      break

    case 'loop':
      setTimeout(() => restartDemo(), 0)
      break
  }
}

// ── Tour loop ─────────────────────────────────────────────────

let loopPausedExternally = false
function pauseElapsedTimer() {
  // Used by sub-flows like trivia that should freeze the timeline while they run.
  loopPausedExternally = true
  pausedElapsed = getElapsed()
  clearTimeout(timerId)
}
function resumeElapsedTimer() {
  loopPausedExternally = false
  startedAt = performance.now()
  loop()
}

function loop() {
  if (paused || loopPausedExternally) return
  const elapsed = getElapsed()
  while (nextIndex < activeTimeline.length && activeTimeline[nextIndex].t <= elapsed) {
    try { handleEvent(activeTimeline[nextIndex]) }
    catch (e) { console.warn('[demo] event failed:', activeTimeline[nextIndex], e) }
    nextIndex++
  }
  emit()
  if (nextIndex < activeTimeline.length) {
    timerId = setTimeout(loop, 33)
  }
}

// ── Pause-on-interaction ──────────────────────────────────────

// Real user pointerdowns (distinct from simulator-synthesized clicks, which
// don't emit pointer events) pause the tour so the viewer can explore.
export function attachInteractionPause() {
  document.addEventListener('pointerdown', (e) => {
    if (paused) return
    // While locked, the tour is in charge — don't pause on content touches.
    if (locked) return
    // Don't pause on interactions with the demo controls themselves.
    if (e.target.closest('.demo-banner, .demo-tabs, .demo-resume-chip, .demo-cta-overlay, .demo-trivia, .demo-prompt')) return
    // If the tour is asking the viewer to do something (semi-interactive
    // checkpoint), don't auto-pause \u2014 the viewer IS supposed to interact.
    if (document.querySelector('.demo-prompt')) return
    pauseDemo()
  }, { passive: true })
}

function showResumeChip() {
  if (document.querySelector('.demo-resume-chip')) return
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'demo-resume-chip'
  chip.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2v10l8-5z"/></svg>
    <span>Resume tour</span>
  `
  chip.addEventListener('click', () => resumeDemo())
  document.body.appendChild(chip)
  requestAnimationFrame(() => chip.classList.add('demo-resume-chip--visible'))
}
function hideResumeChip() {
  const chip = document.querySelector('.demo-resume-chip')
  if (chip) {
    chip.classList.remove('demo-resume-chip--visible')
    setTimeout(() => chip.remove(), 300)
  }
}

// ── Visual helpers ────────────────────────────────────────────

function showToast(text, kind, duration = 3800) {
  const toast = document.createElement('div')
  toast.className = `demo-toast demo-toast--${kind}`
  toast.textContent = text
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('demo-toast--visible'))
  setTimeout(() => {
    toast.classList.remove('demo-toast--visible')
    setTimeout(() => toast.remove(), 300)
  }, duration)
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

// ── Interactive prompts (semi-interactive moments) ────────────

const PREDICATES = {
  'visits>=3':       s => (s.visits?.length || 0) >= 3,
  'visits>=2-more':  s => (s.visits?.length || 0) >= 3, // demo seeds 1 visit, prompt is for 2 more
  'votes==3':        s => (s.myVotes?.length || 0) === 3,
}

function showActionPrompt(text, conditionKey, timeoutMs, onComplete) {
  document.querySelectorAll('.demo-prompt').forEach(n => n.remove())
  const prompt = document.createElement('div')
  prompt.className = 'demo-prompt'
  prompt.innerHTML = `
    <span class="demo-prompt__pulse"></span>
    <span class="demo-prompt__text">${text}</span>
    <button type="button" class="demo-prompt__skip">Skip \u2192</button>
  `
  document.body.appendChild(prompt)
  document.body.classList.add('has-demo-prompt')
  requestAnimationFrame(() => prompt.classList.add('demo-prompt--visible'))

  const predicate = PREDICATES[conditionKey] || (() => false)
  let unsub = null
  let timeoutId = null

  const cleanup = () => {
    if (unsub) unsub()
    if (timeoutId) clearTimeout(timeoutId)
    prompt.classList.remove('demo-prompt--visible')
    document.body.classList.remove('has-demo-prompt')
    setTimeout(() => prompt.remove(), 250)
    onComplete()
  }

  // Check immediately in case condition is already satisfied.
  if (predicate(getState())) {
    setTimeout(cleanup, 200)
    return
  }

  unsub = subscribe(state => { if (predicate(state)) cleanup() })
  prompt.querySelector('.demo-prompt__skip').addEventListener('click', cleanup)
  timeoutId = setTimeout(cleanup, timeoutMs)
}
