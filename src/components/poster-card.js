import { track } from '../lib/track.js'
import { haptic } from '../lib/haptics.js'
import { hashToHue, getInitials } from '../lib/identity.js'
import { esc } from '../lib/escape.js'


function blurbHtml(poster) {
  if (poster.blurb) {
    return `<div class="poster-card__detail"><p class="poster-card__summary">${esc(poster.blurb)}</p></div>`
  }
  if (poster.abstract) {
    return `<div class="poster-card__detail"><p class="poster-card__summary text-muted">Tap to read the abstract</p></div>`
  }
  return `<div class="poster-card__detail"><p class="poster-card__summary text-muted">Stop by to learn about this research!</p></div>`
}

/**
 * Render a poster card.
 * @param {Object} poster - { number, title, student_name, advisor, blurb, highlights, toc_image_url, headshot_url, linkedin_url }
 * @param {Object} options
 * @param {boolean} options.blind - Hide student name (for voting)
 * @param {number|null} options.rank - Show rank badge (1, 2, 3) or null
 * @param {string|null} options.winnerLabel - "Distinguished Poster", etc. for post-event
 * @param {Function|null} options.onClick - Click handler (overrides default modal)
 * @param {boolean} options.showModal - Show detail modal on tap (default: true when no onClick)
 * @param {boolean} options.visited - Show visited checkmark badge
 * @param {Function|null} options.onLogVisit - Callback for "Log Visit" from modal
 */
export function createPosterCard(poster, options = {}) {
  const { blind = false, rank = null, winnerLabel = null, onClick = null, showModal = true, visited = false, onLogVisit = null, showNotes = false, tapHint = null } = options

  const card = document.createElement('div')
  card.className = `card poster-card${rank ? ' card--active' : ''}`
  card.style.cursor = 'pointer'

  // Headshot or initials fallback
  const initials = getInitials(poster.student_name)
  const hue = hashToHue(poster.student_name)
  const headshotHtml = poster.headshot_url
    ? `<img class="poster-card__headshot" src="${esc(poster.headshot_url)}" alt="${esc(poster.student_name)}" loading="lazy" decoding="async" width="80" height="80">`
    : `<div class="poster-card__headshot poster-card__headshot--initials" style="background: hsl(${hue}, 45%, 35%)">${initials}</div>`

  // Highlights (distilled bullet points)
  const highlights = poster.highlights || []
  const highlightsHtml = highlights.length
    ? `<ul class="poster-card__highlights">${highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`
    : ''

  // LinkedIn is intentionally not rendered on list cards — the entire card
  // is a tap target for expansion/ranking, and a stopPropagation anchor here
  // created a large dead-zone (44x44 per card). LinkedIn lives in the modal.

  // Poster number badge
  const numberBadge = `<div class="poster-card__number">${poster.number}</div>`

  // Rank badge (voting)
  const rankBadge = rank ? `<div class="rank-badge">#${rank}</div>` : ''

  // Winner badge (post-event)
  const winnerBadgeHtml = winnerLabel ? `<div class="winner-badge">${winnerLabel}</div>` : ''

  // Visited checkmark badge
  const visitedBadgeHtml = visited && !rank ? '<div class="visited-badge">&#10003;</div>' : ''

  // Note indicator (show on gallery cards, or when showNotes is set)
  const noteText = getNoteForPoster(poster.number)
  const hasNote = noteText && !blind
  const noteIndicatorHtml = hasNote ? '<div class="note-indicator" title="You have a note">&#9998;</div>' : ''

  // Student info (hidden in blind voting mode)
  const nameHtml = !blind && poster.student_name
    ? `<div class="poster-card__student">${esc(poster.student_name)}</div>`
    : ''
  const advisorHtml = !blind && poster.advisor
    ? `<div class="poster-card__advisor">${esc(poster.advisor)}</div>`
    : ''

  // Dynamic title sizing: short titles get bigger text, long ones scale down
  const titleLen = poster.title.length
  const titleClass = titleLen <= 10 ? 'poster-card__title--lg'
    : titleLen <= 40 ? 'poster-card__title--md'
    : titleLen <= 70 ? ''
    : titleLen <= 100 ? 'poster-card__title--sm'
    : 'poster-card__title--xs'

  // Show notes inline on voting cards
  const inlineNoteHtml = showNotes && noteText
    ? `<div class="poster-card__note"><span class="poster-card__note-label">My note:</span> ${esc(noteText)}</div>`
    : ''

  card.innerHTML = `
    ${numberBadge}
    ${rankBadge}
    ${winnerBadgeHtml}
    ${visitedBadgeHtml}
    ${noteIndicatorHtml}
    <div class="poster-card__header">
      ${headshotHtml}
      <div class="poster-card__info">
        <div class="poster-card__title ${titleClass}">${esc(poster.title)}</div>
        ${nameHtml}
        ${advisorHtml}
      </div>
    </div>
    ${!blind ? blurbHtml(poster) : ''}
    ${inlineNoteHtml}
    ${!blind && tapHint !== false ? `<div class="poster-card__tap-hint">${esc(tapHint || 'Tap for details')}</div>` : ''}
  `

  // Click handler
  if (onClick) {
    card.addEventListener('click', () => onClick(poster))
  } else if (showModal && !blind) {
    card.addEventListener('click', () => openPosterModal(poster, { visited, onLogVisit }))
  }

  return card
}

/**
 * Full-screen detail modal for a poster.
 */
export function openPosterModal(poster, { visited = false, onLogVisit = null } = {}) {
  // Prevent stacking
  const existing = document.querySelector('.poster-modal')
  if (existing) existing.remove()

  const modalOpenedAt = Date.now()
  track('poster_card_opened', {
    poster_number: poster.number,
    visited,
    source: 'gallery',
  })

  const initials = getInitials(poster.student_name)
  const hue = hashToHue(poster.student_name)

  const headshotHtml = poster.headshot_url
    ? `<img class="modal__headshot" src="${esc(poster.headshot_url)}" alt="${esc(poster.student_name)}" decoding="async" width="120" height="120">`
    : `<div class="modal__headshot modal__headshot--initials" style="background: hsl(${hue}, 45%, 35%)">${initials}</div>`

  const highlights = poster.highlights || []
  const highlightsHtml = highlights.length
    ? `<ul class="modal__highlights">${highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`
    : ''

  const linkedinIconHtml = poster.linkedin_url
    ? `<a class="modal__linkedin-icon" href="${poster.linkedin_url}" target="_blank" rel="noopener" title="LinkedIn profile" onclick="event.stopPropagation(); window.posthog && window.posthog.capture('poster_linkedin_clicked', { poster_number: ${poster.number} })">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
       </a>`
    : ''

  const overlay = document.createElement('div')
  overlay.className = 'poster-modal'
  overlay.innerHTML = `
    <div class="poster-modal__handle">
      <div class="poster-modal__handle-bar"></div>
    </div>
    <div class="poster-modal__swipe-hint hidden">
      <span class="poster-modal__swipe-arrow">&#8595;</span> Swipe down to close
    </div>
    <div class="poster-modal__scroll">
      <div class="poster-modal__hero">
        <div class="poster-modal__number">#${poster.number}</div>
        ${headshotHtml}
        <div class="poster-modal__name">${esc(poster.student_name)} ${linkedinIconHtml}</div>
        ${poster.advisor ? `<div class="poster-modal__advisor">${esc(poster.advisor)}</div>` : ''}
      </div>
      <div class="poster-modal__body">
        <h2 class="poster-modal__title">${esc(poster.title)}</h2>
        ${poster.blurb ? `<p class="poster-modal__summary">${esc(poster.blurb)}</p>` : ''}
        ${onLogVisit ? `
          <button class="btn btn--gold btn--full modal__log-visit" ${visited ? 'disabled' : ''}>
            ${visited ? '&#10003; Visited' : `Log Visit #${poster.number}`}
          </button>
        ` : ''}
        <div class="modal__notes modal__notes--promoted">
          <label class="modal__notes-label" for="poster-note-${poster.number}">
            <span class="modal__notes-label-icon">&#9998;</span>
            ${getNoteForPoster(poster.number) ? 'Your note' : 'Jot a note to remember this one'}
          </label>
          <textarea
            class="modal__notes-input"
            id="poster-note-${poster.number}"
            placeholder="Questions to follow up on, why you liked it, who to introduce them to…"
            rows="3"
          >${getNoteForPoster(poster.number)}</textarea>
          <p class="modal__notes-disclaimer text-muted text-xs">Saved to this device. Export from the gallery.</p>
        </div>
        ${highlightsHtml ? `<div class="poster-modal__section-label">Key Points</div>` : ''}
        ${highlightsHtml}
        ${poster.abstract ? `
          <button class="poster-modal__abstract-toggle" aria-expanded="false">
            <span>Read Full Abstract</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
          </button>
          <div class="poster-modal__abstract" hidden>
            <div class="poster-modal__section-label">In the presenter's words</div>
            <p>${esc(poster.abstract)}</p>
          </div>
        ` : ''}
      </div>
    </div>
    <div class="poster-modal__footer">
      <button class="poster-modal__close" type="button">&times; Close</button>
    </div>
  `

  // Notes — always visible now (promoted from hidden toggle).
  const noteInput = overlay.querySelector(`#poster-note-${poster.number}`)
  const notesLabel = overlay.querySelector('.modal__notes-label')
  let noteTracked = false
  if (noteInput) {
    noteInput.addEventListener('focus', () => {
      setTimeout(() => noteInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
    })
    noteInput.addEventListener('input', () => {
      if (!noteTracked && noteInput.value.trim()) {
        noteTracked = true
        track('poster_note_added', { poster_number: poster.number })
      }
      saveNoteForPoster(poster.number, noteInput.value)
      if (notesLabel) {
        const hasText = !!noteInput.value.trim()
        const textNode = notesLabel.childNodes[notesLabel.childNodes.length - 1]
        if (textNode) textNode.nodeValue = hasText ? ' Your note' : ' Jot a note to remember this one'
      }
    })
  }

  // Log Visit button handler
  const logVisitBtn = overlay.querySelector('.modal__log-visit')
  if (logVisitBtn && onLogVisit && !visited) {
    logVisitBtn.addEventListener('click', () => {
      haptic.trigger('success')
      logVisitBtn.disabled = true
      logVisitBtn.textContent = '✓ Visited'
      // Fire sparks from the button
      import('../lib/sparks.js').then(({ launchSparksFrom }) => launchSparksFrom(logVisitBtn))
      onLogVisit(poster)
    })
  }

  // Abstract toggle
  const toggleBtn = overlay.querySelector('.poster-modal__abstract-toggle')
  const abstractEl = overlay.querySelector('.poster-modal__abstract')
  if (toggleBtn && abstractEl) {
    toggleBtn.addEventListener('click', () => {
      const expanded = abstractEl.hidden
      abstractEl.hidden = !expanded
      toggleBtn.setAttribute('aria-expanded', String(expanded))
      toggleBtn.querySelector('span').textContent = expanded ? 'Hide Abstract' : 'Read Full Abstract'
      toggleBtn.querySelector('svg').style.transform = expanded ? 'rotate(180deg)' : ''
      if (expanded) track('poster_abstract_expanded', { poster_number: poster.number })
    })
  }

  // Close handlers
  function closeModal() {
    track('poster_modal_closed', { poster_number: poster.number, time_open_ms: Date.now() - modalOpenedAt })
    overlay.remove()
  }
  overlay.querySelector('.poster-modal__close').addEventListener('click', () => { haptic.trigger('light'); closeModal() })
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal() })

  // Swipe-down to close
  const scrollEl = overlay.querySelector('.poster-modal__scroll')
  let touchStartY = 0
  let touchStartX = 0
  let dragging = false
  let touchStartedOnInteractive = false

  scrollEl.addEventListener('touchstart', (e) => {
    if (scrollEl.scrollTop > 0) return
    touchStartY = e.touches[0].clientY
    touchStartX = e.touches[0].clientX
    // If the touch starts on a button/link/input, never promote to drag.
    // Prevents finger-jitter swipes from stealing taps on Hide Abstract,
    // Log Visit, notes toggle, etc. (Mobile Safari reliability fix.)
    touchStartedOnInteractive = !!e.target.closest('button, a, input, textarea, select, label')
  }, { passive: true })

  scrollEl.addEventListener('touchmove', (e) => {
    if (touchStartedOnInteractive) return
    const dy = e.touches[0].clientY - touchStartY
    const dx = Math.abs(e.touches[0].clientX - touchStartX)

    // Only swipe down, and require more vertical than horizontal movement
    if (dy < 0 || dx > dy * 0.7) {
      if (dragging) {
        // Was dragging but now moving horizontally — snap back
        overlay.classList.remove('poster-modal--dragging')
        overlay.style.transform = ''
        overlay.style.opacity = ''
        dragging = false
      }
      return
    }

    // Don't start drag if scroll area has been scrolled down
    if (scrollEl.scrollTop > 0) return

    if (!dragging && dy > 10) {
      dragging = true
      overlay.classList.add('poster-modal--dragging')
    }

    if (dragging) {
      e.preventDefault()
      overlay.style.transform = `translateY(${dy}px)`
      overlay.style.opacity = String(Math.max(0.3, 1 - dy / 400))
    }
  }, { passive: false })

  scrollEl.addEventListener('touchend', (e) => {
    if (!dragging) return
    dragging = false
    overlay.classList.remove('poster-modal--dragging')

    const dy = e.changedTouches[0].clientY - touchStartY
    if (dy > 120) {
      // Close with animation
      overlay.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
      overlay.style.transform = 'translateY(100%)'
      overlay.style.opacity = '0'
      setTimeout(closeModal, 200)
    } else {
      // Snap back
      overlay.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
      overlay.style.transform = ''
      overlay.style.opacity = ''
      setTimeout(() => { overlay.style.transition = '' }, 200)
    }
  }, { passive: true })

  // Show swipe hint the first 2 times
  const hintKey = 'nerpg_modal_swipe_hint'
  const hintCount = parseInt(localStorage.getItem(hintKey) || '0', 10)
  if (hintCount < 2) {
    const hint = overlay.querySelector('.poster-modal__swipe-hint')
    if (hint) hint.classList.remove('hidden')
    localStorage.setItem(hintKey, String(hintCount + 1))
  }

  overlay.setAttribute('tabindex', '-1')
  document.body.appendChild(overlay)

  // Focus overlay for keyboard close (Escape)
  overlay.focus()

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('poster-modal--open'))
}

function getNoteForPoster(num) {
  try { return localStorage.getItem(`nerpg_note_${num}`) || '' } catch { return '' }
}

function saveNoteForPoster(num, text) {
  try {
    if (text.trim()) {
      localStorage.setItem(`nerpg_note_${num}`, text)
    } else {
      localStorage.removeItem(`nerpg_note_${num}`)
    }
  } catch { /* storage full */ }
}

export function getAllNotes() {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const m = key && key.match(/^nerpg_note_(\d+)$/)
      if (m) out.push({ poster_number: parseInt(m[1], 10), text: localStorage.getItem(key) })
    }
  } catch { /* storage blocked */ }
  return out.sort((a, b) => a.poster_number - b.poster_number)
}

