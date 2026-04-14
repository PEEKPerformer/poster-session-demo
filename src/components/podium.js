import { launchConfetti } from '../lib/confetti.js'
import { openPosterModal } from './poster-card.js'
import { hashToHue, getInitials } from '../lib/identity.js'
import { esc } from '../lib/escape.js'

/**
 * Build the results podium showing top 3 winners.
 * @param {Array} tally - Sorted vote tally from tallyVotes() (index 0 = 1st place)
 * @param {Array} posters - Full poster list from state
 * @param {Object} [options]
 * @param {string} [options.firstPlaceLabel] - Label for 1st place (default: 'NERPG 2026 Distinguished Poster')
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function createPodium(tally, posters, options = {}) {
  const wrap = document.createElement('div')
  wrap.className = 'podium'

  // 0 winners → placeholder
  if (!tally || tally.length === 0) {
    wrap.innerHTML = '<p class="podium__empty">Results coming soon...</p>'
    return { el: wrap, destroy() {} }
  }

  // Map tally to poster data
  const places = tally.slice(0, 3).map((t, i) => ({
    rank: i + 1,
    poster: posters.find(p => p.number === t.poster_number) || null,
    votes: t.vote_count,
  }))

  // Stage: ordered as 2nd | 1st | 3rd for classic podium layout
  const stage = document.createElement('div')
  stage.className = 'podium__stage'

  // Build order depends on how many winners we have
  const order = places.length === 1
    ? [places[0]]                          // center only
    : places.length === 2
      ? [places[1], places[0]]             // 2nd | 1st
      : [places[1], places[0], places[2]]  // 2nd | 1st | 3rd

  const timers = []

  const firstPlaceLabel = options.firstPlaceLabel || 'NERPG 2026 Distinguished Poster'

  for (const place of order) {
    const col = buildPodiumSlot(place, firstPlaceLabel)
    stage.appendChild(col)

    // Staggered reveal timing: 3rd=0s, 2nd=1.5s, 1st=3s
    const delay = place.rank === 3 ? 0
      : place.rank === 2 ? 1500
        : 3000

    timers.push(setTimeout(() => {
      col.classList.add('podium__slot--visible')
      // Fire confetti when 1st place reveals
      if (place.rank === 1) launchConfetti()
    }, delay))
  }

  wrap.appendChild(stage)

  return {
    el: wrap,
    destroy() {
      timers.forEach(t => clearTimeout(t))
    },
  }
}

function buildPodiumSlot(place, firstPlaceLabel) {
  const { rank, poster } = place
  const col = document.createElement('div')
  col.className = `podium__slot podium__slot--${rank}`

  const labels = { 1: firstPlaceLabel, 2: '2nd Place', 3: '3rd Place' }
  const metalClass = { 1: 'gold', 2: 'silver', 3: 'bronze' }

  // Headshot or initials fallback
  const initials = poster ? getInitials(poster.student_name) : '?'
  const hue = poster ? hashToHue(poster.student_name) : 0
  const headshotHtml = poster?.headshot_url
    ? `<img class="podium__headshot podium__headshot--${metalClass[rank]}" src="${poster.headshot_url}" alt="${poster.student_name}">`
    : `<div class="podium__headshot podium__headshot--initials podium__headshot--${metalClass[rank]}" style="background: hsl(${hue}, 45%, 35%)">${initials}</div>`

  col.innerHTML = `
    ${headshotHtml}
    <div class="podium__label">${labels[rank]}</div>
    <div class="podium__name">${esc(poster?.student_name) || 'TBD'}</div>
    ${poster?.title ? `<div class="podium__title">${esc(poster.title)}</div>` : ''}
    <div class="podium__pedestal podium__pedestal--${metalClass[rank]}">${rank}</div>
  `

  // Tappable → open poster modal
  if (poster) {
    col.style.cursor = 'pointer'
    col.addEventListener('click', () => openPosterModal(poster, {}))
  }

  return col
}

