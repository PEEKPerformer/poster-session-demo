import { getState, setState } from '../state.js'
import { navigate } from '../router.js'
import { renderHeader } from '../components/header.js'
import { launchConfetti } from '../lib/confetti.js'
import { getStats, getEventState, supabase } from '../supabase.js'
import { track } from '../lib/track.js'
import { getFirstName } from '../lib/identity.js'
import { esc } from '../lib/escape.js'

function awardLabel(state) {
  const role = state.attendee?.role
  return (role === 'presenter' || role === 'student')
    ? 'NERPG Peer Impact Award'
    : 'NERPG Distinguished Poster Award'
}

const BASE = import.meta.env.BASE_URL || '/'

const DEFAULT_SCHEDULE = [
  { time: '2:30 PM', label: 'Prof. Anson Ma (UConn) — Additive Manufacturing of Functional Materials' },
  { time: '3:00 PM', label: 'Prof. Thanh Nguyen (UConn) — Microneedles for Drug Delivery' },
  { time: '3:30 PM', label: 'Prof. Mihai Duduta (UConn) — Soft Machines in Extreme Environments' },
  { time: '4:00 PM', label: 'Awards Ceremony' },
  { time: '4:30 PM', label: 'Social Hour/Dinner — Following the UConn Tour' },
]

export function renderConfirm(root) {
  const state = getState()
  if (!state.attendee) { navigate('#/auth'); return }

  // During results phase, redirect to #/vote which handles the celebration
  if (state.eventPhase === 'results') {
    navigate('#/vote')
    return
  }

  track('confirm_page_viewed', { visits_count: state.visits.length })

  const view = document.createElement('div')
  view.className = 'view'

  const confirmFirstName = getFirstName(state.attendee.name)
  renderHeader(view, {
    title: confirmFirstName ? `Thanks, ${confirmFirstName}!` : 'Thanks!',
    showLogo: false,
    showNav: true,
  })

  // Animated checkmark
  const check = document.createElement('div')
  check.className = 'confirm-check'
  check.innerHTML = `
    <svg viewBox="0 0 24 24">
      <polyline points="4 12 10 18 20 6"/>
    </svg>
  `
  view.appendChild(check)

  const message = document.createElement('p')
  message.className = 'text-center mt-2'
  message.style.fontSize = '1.25rem'
  message.style.fontWeight = '700'
  message.textContent = confirmFirstName
    ? `Grab a seat, ${confirmFirstName} — the talks are up next!`
    : 'Grab a seat for the talks!'
  view.appendChild(message)

  // Schedule reminder — fetched from Supabase with hardcoded fallback
  const items = state.schedule?.length ? state.schedule : DEFAULT_SCHEDULE
  const schedule = document.createElement('div')
  schedule.className = 'card w-full mt-2'
  schedule.innerHTML = `
    <p class="label-tracked mb-1">Up Next</p>
    ${items.map(s => `<div class="mt-1">
      <span class="text-gold" style="font-weight:700">${s.time}</span>
      <span>${s.label}</span>
    </div>`).join('')}
  `
  view.appendChild(schedule)

  // Push-opt-in stripped from the demo build (no service worker, no VAPID).

  // Vote summary if available
  if (state.myVotes?.length) {
    const summary = document.createElement('div')
    summary.className = 'card w-full mt-2'
    summary.innerHTML = `
      <p class="label-tracked mb-1">Your Picks — ${awardLabel(state)}</p>
      ${state.myVotes.map(v => {
        const poster = state.posters.find(p => p.number === v.poster_number)
        return `<div class="mt-1">
          <span class="text-gold" style="font-weight:800">#${v.rank}</span>
          <span style="font-weight:600">Poster ${v.poster_number}</span>
          ${poster ? `<span class="text-muted text-sm"> — ${esc(poster.title)}</span>` : ''}
        </div>`
      }).join('')}
    `
    view.appendChild(summary)
  }

  // Fun stats (loaded async)
  const statsCard = document.createElement('div')
  statsCard.className = 'card w-full mt-2'
  statsCard.id = 'confirm-stats'
  statsCard.innerHTML = '<p class="text-muted text-sm text-center">Loading event stats...</p>'
  view.appendChild(statsCard)
  loadFunStats(statsCard, state)

  // Auto-refresh stats every 30 seconds
  const statsInterval = setInterval(() => {
    if (!statsCard.parentNode) { clearInterval(statsInterval); return }
    loadFunStats(statsCard, state)
  }, 30000)

  // Listen for phase change → redirect to results celebration
  let channel = null
  if (supabase) {
    channel = supabase.channel(`confirm-phase-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_state' }, (payload) => {
        const newPhase = payload.new?.phase
        if (newPhase === 'results') {
          setState({ eventPhase: newPhase, phaseUpdatedAt: payload.new.updated_at })
          navigate('#/vote')
        }
      })
      .subscribe()
  }

  const phaseInterval = setInterval(async () => {
    try {
      const es = await getEventState()
      if (es.phase === 'results') {
        setState({ eventPhase: es.phase, phaseUpdatedAt: es.updated_at })
        navigate('#/vote')
      }
    } catch { /* offline */ }
  }, 5000)

  // Footer logos
  const footer = document.createElement('div')
  footer.className = 'footer-logos'
  footer.innerHTML = `
    <img src="${BASE}assets/logos/nerpg-logo-hires.png" alt="NERPG">
    <img src="${BASE}assets/logos/rd-logo-dark.png" alt="ACS Rubber Division">
    <img src="${BASE}assets/logos/ims-logo-dark.png" alt="IMS">
  `
  view.appendChild(footer)

  root.appendChild(view)

  // Fire confetti!
  setTimeout(() => launchConfetti(), 400)

  return () => {
    clearInterval(statsInterval)
    clearInterval(phaseInterval)
    if (channel) supabase.removeChannel(channel)
  }
}

async function loadFunStats(container, state) {
  try {
    const stats = await getStats()

    const myVisits = state.visits.length

    container.innerHTML = `
      <p class="label-tracked mb-1">Event Pulse</p>
      <div class="pulse-stats">
        <div class="pulse-stat">
          <span class="pulse-stat__num">${myVisits}</span>
          <span class="pulse-stat__label">posters you explored</span>
        </div>
        <div class="pulse-stat">
          <span class="pulse-stat__num">${stats.totalVisits}</span>
          <span class="pulse-stat__label">total visits today</span>
        </div>
        <div class="pulse-stat">
          <span class="pulse-stat__num">${stats.voters}</span>
          <span class="pulse-stat__label">votes cast</span>
        </div>
      </div>
    `
  } catch {
    container.innerHTML = '<p class="text-muted text-sm text-center">Stats unavailable offline</p>'
  }
}
