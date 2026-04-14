import { getState, setState, queuePendingVisit } from '../state.js'
import { navigate } from '../router.js'
import { renderHeader } from '../components/header.js'
import { createPosterCard, openPosterModal } from '../components/poster-card.js'
import { createNumpad } from '../components/numpad.js'
import { tallyVotes, tallyStudentVotes, logVisit, getStats, getVisitLeaderboard, getEventState, supabase } from '../supabase.js'
import { track } from '../lib/track.js'
import { haptic } from '../lib/haptics.js'
import { getFirstName } from '../lib/identity.js'
import { seededShuffle } from '../lib/shuffle.js'

// ── Visit milestone encouragement ──────────────────────
const shownMilestones = new Set()
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const MIN_CHECKINS_FOR_COMPETITIVE = 15

function checkVisitMilestone() {
  const s = getState()
  const visited = s.visits.length
  const total = s.posters.length
  if (!total || visited === 0) return

  const eligible = countEligibleVisits()
  const remaining = total - visited
  let msgs = null
  let key = null

  // Percentage thresholds (of total posters)
  const pct = visited / total

  // "All visited" always takes priority
  if (visited === total) {
    key = 'all'
  } else if (eligible === 3) {
    // Skip — vote-ready toast handles this exact moment
    return
  } else if (remaining === 1) {
    key = 'r1'
    msgs = [
      'One poster left — you\'ve got this!',
      'Just one more for a clean sweep!',
      'So close! One poster to go.',
      'The last poster awaits — finish strong!',
    ]
  } else if (remaining === 2 && total > 5) {
    key = 'r2'
    msgs = [
      'Just 2 more for a clean sweep!',
      'Almost there — only 2 left!',
      'Two posters away from seeing them all!',
      'Down to the final 2 — keep going!',
    ]
  } else if (pct >= 0.75 && total > 6) {
    key = 'p75'
    msgs = [
      `${visited} of ${total} — you're on a roll!`,
      `Three quarters done! ${remaining} left to explore.`,
      `${visited} posters down — almost a clean sweep!`,
    ]
  } else if (pct >= 0.5 && total > 6) {
    key = 'p50'
    msgs = [
      `Halfway! ${visited} of ${total} explored.`,
      `${visited} down, ${remaining} to go — nice pace!`,
      `Over halfway there! ${remaining} posters left.`,
      `${visited} of ${total} — you're crushing it!`,
    ]
  } else if (pct >= 0.25 && total > 6) {
    key = 'p25'
    msgs = [
      `${visited} posters explored — great start!`,
      `Quarter of the way! ${remaining} more to discover.`,
      `${visited} down, ${remaining} to go!`,
    ]
  } else if (visited === 1) {
    key = 'v1'
    msgs = [
      `First poster explored! ${remaining} more to discover.`,
      `Great start! ${remaining} posters to go.`,
      `And you're off! ${remaining} more waiting for you.`,
      `One down! ${remaining} more to explore.`,
    ]
  }

  if (!key || shownMilestones.has(key)) return
  shownMilestones.add(key)

  track('visit_milestone_reached', { milestone: key, visits_count: visited, total_posters: total })

  if (key === 'all') {
    showAllVisitedCelebration()
  } else {
    showEncouragementToast(pick(msgs))
    // Try to show a competitive toast at 50% if enough people are participating
    if (key === 'p50') tryCompetitiveToast(visited)
  }
}

async function tryCompetitiveToast(myVisits) {
  if (shownMilestones.has('competitive')) return
  try {
    const [stats, leaderboard] = await Promise.all([getStats(), getVisitLeaderboard()])
    if (stats.checkins < MIN_CHECKINS_FOR_COMPETITIVE) return
    // Find what percentile the user is in
    const below = leaderboard.filter(c => c < myVisits).length
    const pctile = Math.round((below / leaderboard.length) * 100)
    if (pctile >= 50) {
      shownMilestones.add('competitive')
      // Delay so it doesn't stack with the milestone toast
      setTimeout(() => {
        const msgs = [
          `You've explored more posters than ${pctile}% of attendees!`,
          `Top ${100 - pctile}% explorer — keep it up!`,
          `Ahead of ${pctile}% of the room!`,
        ]
        showEncouragementToast(pick(msgs))
        track('competitive_toast_shown', { percentile: pctile, visits: myVisits, checkins: stats.checkins })
      }, 5000)
    }
  } catch { /* offline — skip competitive toast */ }
}

function showEncouragementToast(text) {
  const existing = document.querySelector('.vote-ready-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'vote-ready-toast'
  toast.textContent = text
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('vote-ready-toast--visible'))
  setTimeout(() => {
    toast.classList.remove('vote-ready-toast--visible')
    setTimeout(() => toast.remove(), 400)
  }, 3500)
}

function showAllVisitedCelebration() {
  // Big confetti burst
  import('../lib/confetti.js').then(({ launchConfetti }) => launchConfetti())

  const msgs = [
    '&#127942; You explored every poster! Amazing.',
    '&#127942; All posters visited — what a run!',
    '&#127942; Clean sweep! You saw them all.',
    '&#127942; Every single poster — legend status.',
  ]

  // Special toast
  const existing = document.querySelector('.vote-ready-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'vote-ready-toast'
  toast.innerHTML = pick(msgs)
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('vote-ready-toast--visible'))
  setTimeout(() => {
    toast.classList.remove('vote-ready-toast--visible')
    setTimeout(() => toast.remove(), 400)
  }, 5000)

  // Progress bar permanent glow
  const progress = document.querySelector('.visit-progress')
  if (progress) progress.classList.add('visit-progress--complete')
}

export function renderGallery(root) {
  const state = getState()

  // Gallery is always accessible — no auth required
  const isLoggedIn = !!state.attendee
  const isPublic = state.eventPhase === 'results'

  const hash = window.location.hash
  const isFamilyView = hash.includes('family=1') || hash.includes('family=true')
  track('gallery_viewed', {
    phase: state.eventPhase,
    is_logged_in: isLoggedIn,
    poster_count: state.posters.length,
    visits_count: state.visits.length,
    is_family_view: isFamilyView,
  })

  const view = document.createElement('div')
  view.className = 'view'
  view.style.maxWidth = '720px'

  const galleryFirstName = isLoggedIn ? getFirstName(state.attendee.name) : null
  renderHeader(view, {
    title: 'Poster Gallery',
    subtitle: galleryFirstName ? `Welcome back, ${galleryFirstName}` : 'NERPG Spring Event 2026',
    showNav: isLoggedIn, // only show nav links if logged in
  })

  // If not logged in, show a sign-in prompt
  if (!isLoggedIn) {
    const authPrompt = document.createElement('div')
    authPrompt.className = 'card w-full text-center mb-2'
    authPrompt.innerHTML = `
      <p class="text-sm text-muted">Have an access code? <button class="btn--text text-gold" id="go-auth" style="font-size:0.875rem">Sign in</button> to log visits and vote.</p>
    `
    authPrompt.querySelector('#go-auth')?.addEventListener('click', () => navigate('#/auth'))
    view.appendChild(authPrompt)
  }

  if (!state.posters.length) {
    const empty = document.createElement('div')
    empty.className = 'card w-full text-center'
    empty.innerHTML = '<p class="text-muted">No posters loaded yet.</p>'
    view.appendChild(empty)
    root.appendChild(view)
    return
  }

  // Search filter
  const searchWrap = document.createElement('div')
  searchWrap.className = 'gallery-search w-full'
  searchWrap.innerHTML = `
    <input type="text" class="gallery-search__input" placeholder="Search posters..." autocomplete="off" autocorrect="off" spellcheck="false">
  `
  view.appendChild(searchWrap)

  // Notes export — visible when the user has actually written notes.
  if (isLoggedIn) {
    import('../components/poster-card.js').then(({ getAllNotes }) => {
      const notes = getAllNotes()
      if (!notes.length) return
      const wrap = document.createElement('div')
      wrap.className = 'gallery-notes-export w-full'
      wrap.innerHTML = `
        <button type="button" class="btn btn--text gallery-notes-export__btn">
          &#9998; Export ${notes.length} note${notes.length === 1 ? '' : 's'}
        </button>
      `
      wrap.querySelector('button').addEventListener('click', async () => {
        const posters = state.posters
        const lines = notes.map(n => {
          const p = posters.find(x => x.number === n.poster_number)
          const title = p?.title ? ` — ${p.title}` : ''
          const author = p?.student_name ? ` (${p.student_name})` : ''
          return `Poster #${n.poster_number}${title}${author}\n${n.text}\n`
        })
        const text = `My NERPG Notes\n${new Date().toLocaleString()}\n\n${lines.join('\n')}`
        try {
          await navigator.clipboard.writeText(text)
          wrap.querySelector('button').textContent = '✓ Copied to clipboard'
          track('notes_exported', { note_count: notes.length })
          setTimeout(() => {
            wrap.querySelector('button').innerHTML = `&#9998; Export ${notes.length} note${notes.length === 1 ? '' : 's'}`
          }, 2500)
        } catch {
          // Fallback: download as text file
          const blob = new Blob([text], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `nerpg-notes-${new Date().toISOString().slice(0, 10)}.txt`
          a.click()
          URL.revokeObjectURL(url)
          track('notes_exported', { note_count: notes.length, via: 'download' })
        }
      })
      searchWrap.after(wrap)
    })
  }

  // Filter toggles (only for logged-in users during session)
  let filterMode = 'all' // 'all' | 'unvisited'
  if (isLoggedIn && !isPublic) {
    const filterWrap = document.createElement('div')
    filterWrap.className = 'gallery-filters'
    filterWrap.innerHTML = `
      <button class="gallery-filter gallery-filter--active" data-filter="all">All</button>
      <button class="gallery-filter" data-filter="unvisited">Not Yet Visited</button>
    `
    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]')
      if (!btn) return
      filterMode = btn.dataset.filter
      filterWrap.querySelectorAll('.gallery-filter').forEach(b => b.classList.remove('gallery-filter--active'))
      btn.classList.add('gallery-filter--active')
      renderFiltered(searchInput.value.trim())
      const count = grid.querySelectorAll('.poster-card').length
      track('gallery_filter_changed', { filter: filterMode, result_count: count })
    })
    view.appendChild(filterWrap)
  }

  // Visit progress bar (logged-in attendees during session phase)
  let progressEl = null
  if (isLoggedIn && !isPublic) {
    progressEl = document.createElement('div')
    progressEl.className = 'visit-progress'
    progressEl.innerHTML = `
      <div class="visit-progress__label"></div>
      <div class="visit-progress__track"><div class="visit-progress__fill"></div></div>
    `
    view.appendChild(progressEl)
    updateProgress()
  }

  function updateProgress() {
    if (!progressEl) return
    const s = getState()
    const visited = s.visits.length
    const eligible = countEligibleVisits()
    const total = s.posters.length
    const label = progressEl.querySelector('.visit-progress__label')
    const fill = progressEl.querySelector('.visit-progress__fill')
    if (visited >= total && total > 0) {
      label.innerHTML = `All <strong>${total}</strong> posters explored!`
      fill.style.width = '100%'
      progressEl.classList.add('visit-progress--complete')
    } else if (eligible < 3) {
      label.innerHTML = `<strong>${eligible}</strong> of <strong>3</strong> to unlock voting`
      fill.style.width = `${Math.min(100, (eligible / 3) * 100)}%`
    } else {
      label.innerHTML = `Voting from <strong>${eligible}</strong> of <strong>${total}</strong> posters`
      fill.style.width = total ? `${(visited / total) * 100}%` : '0%'
    }
  }

  // Live pulse counter (session phase only)
  const showPulse = state.eventPhase === 'session'
  if (showPulse) {
    const pulse = document.createElement('div')
    pulse.className = 'gallery-pulse'
    pulse.innerHTML = `<span class="gallery-pulse__dot"></span> <span class="gallery-pulse__count" id="visit-pulse">—</span> poster visits and counting`
    view.appendChild(pulse)

    getStats().then(stats => {
      const el = view.querySelector('#visit-pulse')
      if (el) el.textContent = stats.totalVisits
    })
  }

  const grid = document.createElement('div')
  grid.className = 'poster-grid'
  view.appendChild(grid)

  root.appendChild(view)

  // Prepare poster list
  let allPosters = [...state.posters]
  let winners = null

  function renderFiltered(query) {
    let filtered = allPosters

    // Unvisited filter
    if (filterMode === 'unvisited') {
      const visits = getState().visits
      filtered = filtered.filter(p => !visits.includes(p.number))
    }

    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q)
        || (p.student_name && p.student_name.toLowerCase().includes(q))
        || (p.advisor && p.advisor.toLowerCase().includes(q))
        || (p.highlights && p.highlights.some(h => h.toLowerCase().includes(q)))
        || String(p.number) === q
      )
    }
    renderCards(grid, filtered, winners, state, updateProgress)
  }

  const searchInput = searchWrap.querySelector('.gallery-search__input')
  let searchDebounce = null
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim()
    renderFiltered(q)
    clearTimeout(searchDebounce)
    if (q) {
      searchDebounce = setTimeout(() => {
        const count = grid.querySelectorAll('.poster-card').length
        track('gallery_searched', { query_length: q.length, result_count: count })
      }, 500)
    }
  })

  // Load winners for post-event mode (keep ranked order),
  // otherwise shuffle per attendee to prevent positional bias.
  // Respect the 2-minute grace period so voters don't see results early.
  if (isPublic) {
    const GRACE_MS = 45 * 1000
    const switchedAt = state.phaseUpdatedAt ? new Date(state.phaseUpdatedAt).getTime() : 0
    const graceRemaining = Math.max(0, (switchedAt + GRACE_MS) - Date.now())

    if (graceRemaining > 0) {
      // During grace period: show countdown, then reveal winners
      const banner = document.createElement('div')
      banner.className = 'vote-countdown'
      view.insertBefore(banner, grid)

      const deadline = Date.now() + graceRemaining
      function tick() {
        const remaining = Math.max(0, deadline - Date.now())
        if (remaining <= 0) {
          banner.innerHTML = '<strong>Tallying results...</strong>'
          setTimeout(() => {
            banner.remove()
            loadWinnersWithCallback(grid, state, (w) => {
              winners = w
              renderFiltered(searchInput.value.trim())
            })
          }, 2000)
          return
        }
        const secs = Math.ceil(remaining / 1000)
        const m = Math.floor(secs / 60)
        const s = secs % 60
        banner.innerHTML = `Results in <strong>${m}:${String(s).padStart(2, '0')}</strong>`
        setTimeout(tick, 1000)
      }
      tick()

      const seed = state.attendee?.code || ''
      allPosters = shuffleByCompleteness(allPosters, seed)
      renderCards(grid, allPosters, null, state, updateProgress)
    } else {
      loadWinnersWithCallback(grid, state, (w) => {
        winners = w
        renderFiltered(searchInput.value.trim())
      })
    }
  } else {
    const seed = state.attendee?.code || ''
    allPosters = shuffleByCompleteness(allPosters, seed)
    renderCards(grid, allPosters, null, state, updateProgress)
  }

  // Quick-log FAB + bottom sheet (logged-in, session phase only)
  let numpad = null
  const showQuickLog = isLoggedIn && !isPublic
  if (showQuickLog) {
    const ql = buildQuickLog(state, () => {
      // After logging, re-render cards to show visited badge
      renderCards(grid, allPosters, winners, getState(), updateProgress)
      updateProgress()
    })
    numpad = ql.numpad
    document.body.appendChild(ql.fab)
    document.body.appendChild(ql.sheet)
  }

  // Auto-open poster modal from deep link (#/poster/N)
  autoOpenPoster(state)

  // Realtime: live pulse counter + anonymous activity ticker
  let channel = null
  let lastTickerTime = 0
  if (supabase) {
    const channelName = `gallery-live-${Date.now()}`
    const builder = supabase.channel(channelName)

    // Live visit pulse (session phase only)
    if (showPulse) {
      builder.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits' }, (payload) => {
        // Bump the counter
        const el = view.querySelector('#visit-pulse')
        if (el) {
          const current = parseInt(el.textContent) || 0
          const newCount = current + 1
          el.textContent = newCount
          el.classList.add('gallery-pulse__count--bump')
          setTimeout(() => el.classList.remove('gallery-pulse__count--bump'), 300)

          // Milestone celebrations
          if (isMilestone(newCount)) {
            lastTickerTime = Date.now() // suppress normal ticker
            showMilestoneTicker(newCount)
            return
          }
        }

        // Anonymous ticker (max one every 8 seconds, skip own visits)
        const now = Date.now()
        const d = payload.new
        if (d.attendee_code === state.attendee?.code) return
        if (now - lastTickerTime > 8000) {
          lastTickerTime = now
          const poster = state.posters.find(p => p.number === d.poster_number)
          const title = poster?.title
          const phrases = title ? [
            `Someone's checking out "${title}"`,
            `"${title}" just got a visitor`,
            `Someone stopped by "${title}"`,
          ] : [
            `Someone just visited Poster #${d.poster_number}`,
          ]
          showActivityTicker(phrases[Math.floor(Math.random() * phrases.length)])
        }
      })
    }

    // Auto-detect phase changes — re-render when admin switches phases
    builder.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_state' }, (payload) => {
      const newPhase = payload.new?.phase
      if (newPhase && newPhase !== getState().eventPhase) {
        setState({
          eventPhase: newPhase,
          phaseUpdatedAt: payload.new.updated_at || new Date().toISOString(),
        })
        // Re-trigger hashchange to re-render the gallery with/without podium
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
    })

    channel = builder.subscribe()
  }

  // Polling fallback — checks every 5s in case Realtime isn't enabled for event_state
  const pollInterval = setInterval(async () => {
    if (!view.parentNode) return
    try {
      const es = await getEventState()
      if (es.phase && es.phase !== getState().eventPhase) {
        setState({ eventPhase: es.phase, phaseUpdatedAt: es.updated_at })
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
    } catch { /* offline, ignore */ }
  }, 5000)

  return () => {
    if (channel) supabase.removeChannel(channel)
    clearInterval(pollInterval)
    if (numpad) numpad._destroy()
    document.querySelector('.quick-log-fab')?.remove()
    document.querySelector('.quick-log-sheet')?.remove()
  }
}

function autoOpenPoster(state) {
  const num = window.__nerpg_auto_poster
  if (!num) return
  const poster = state.posters.find(p => p.number === num)
  if (!poster) return // data not loaded yet — will retry on re-render after syncData

  delete window.__nerpg_auto_poster
  track('poster_card_opened', { poster_number: poster.number, visited: state.visits.includes(poster.number), source: 'deep_link' })
  const isVisited = state.visits.includes(poster.number)
  const attendee = state.attendee
  openPosterModal(poster, {
    visited: isVisited,
    onLogVisit: attendee ? (p) => {
      const current = getState()
      if (!current.visits.includes(p.number)) {
        setState({ visits: [p.number, ...current.visits] })
      }
      logVisit(attendee.code, p.number).then(ok => {
        if (!ok) queuePendingVisit(attendee.code, p.number)
      })
    } : null,
  })
}

async function loadWinnersWithCallback(grid, state, onLoaded) {
  let winners = {}
  try {
    const [tally, studentTally] = await Promise.all([tallyVotes(), tallyStudentVotes()])
    // Distinguished Poster: reveal 3rd → 2nd → 1st with staggered delays
    if (tally.length >= 3) {
      winners[tally[2].poster_number] = { label: '3rd Place', delay: 0 }
    }
    if (tally.length >= 2) {
      winners[tally[1].poster_number] = { label: '2nd Place', delay: 1500 }
    }
    if (tally.length >= 1) {
      winners[tally[0].poster_number] = { label: 'NERPG 2026 Distinguished Poster', delay: 3000 }
    }
    // Student Choice Award winner (only 1st place badge)
    if (studentTally.length >= 1) {
      const scNum = studentTally[0].poster_number
      // If already a Distinguished winner, append to their label
      if (winners[scNum]) {
        const existing = winners[scNum]
        existing.label = `${existing.label} + Peer Impact`
      } else {
        winners[scNum] = { label: 'NERPG Peer Impact Award', delay: 3500 }
      }
    }
  } catch { /* no winners available */ }

  onLoaded(winners)
}


/** True if a field has real content (not null, empty, or "TBA"). */
function filled(val) {
  return !!val && String(val).trim().toLowerCase() !== 'tba'
}

/** Count how many profile fields a poster has filled in. */
function profileCompleteness(poster) {
  let score = 0
  if (filled(poster.title)) score++
  if (filled(poster.headshot_url)) score++
  if (filled(poster.blurb)) score++
  if (filled(poster.abstract)) score++
  if (poster.highlights && poster.highlights.length > 0) score++
  if (filled(poster.linkedin_url)) score++
  if (filled(poster.advisor)) score++
  return score
}

/** Shuffle, then stable-sort by profile completeness (most complete first). */
function shuffleByCompleteness(arr, seed) {
  seededShuffle(arr, seed)
  arr.sort((a, b) => profileCompleteness(b) - profileCompleteness(a))
  return arr
}

function renderCards(grid, posters, winners, state = null, onProgress = null) {
  grid.innerHTML = ''
  const visits = state?.visits || []
  const attendee = state?.attendee
  for (let i = 0; i < posters.length; i++) {
    const poster = posters[i]
    const winnerData = winners ? winners[poster.number] || null : null
    const winnerLabel = winnerData?.label || winnerData || null
    const isVisited = visits.includes(poster.number)

    // If winner has a delay, render without label first, add it later
    const hasDelay = winnerData?.delay != null && winnerData.delay > 0
    const card = createPosterCard(poster, {
      blind: false,
      winnerLabel: hasDelay ? null : winnerLabel,
      visited: isVisited,
      onLogVisit: attendee ? (p) => handleLogVisit(p, attendee.code, grid, posters, winners, state, onProgress) : null,
    })

    // Stagger entrance animation
    card.style.animationDelay = `${i * 50}ms`
    card.style.animation = 'fadeIn 0.3s ease both'

    // Winner card gold border — apply immediately for no-delay winners (e.g. 3rd place)
    if (winnerLabel && !hasDelay) {
      card.classList.add('card--active')
    }

    // Delayed winner badge reveal
    if (hasDelay && winnerLabel) {
      setTimeout(() => {
        const badge = document.createElement('div')
        badge.className = 'winner-badge winner-badge--reveal'
        badge.textContent = winnerLabel
        card.style.position = 'relative'
        card.appendChild(badge)
        card.classList.add('card--active')
      }, winnerData.delay)
    }

    grid.appendChild(card)
  }
}

function isMilestone(count) {
  if (count <= 50) return count % 25 === 0   // 25, 50
  return count % 50 === 0                     // 100, 150, 200...
}

function showMilestoneTicker(count) {
  const existing = document.querySelector('.activity-ticker')
  if (existing) existing.remove()

  const ticker = document.createElement('div')
  ticker.className = 'activity-ticker activity-ticker--milestone'
  ticker.innerHTML = `&#127881; ${count} poster visits! &#127881;`
  document.body.appendChild(ticker)
  requestAnimationFrame(() => ticker.classList.add('activity-ticker--visible'))
  setTimeout(() => {
    ticker.classList.remove('activity-ticker--visible')
    setTimeout(() => ticker.remove(), 400)
  }, 5000)
}

function showActivityTicker(text) {
  // Don't stack tickers
  const existing = document.querySelector('.activity-ticker')
  if (existing) existing.remove()

  const ticker = document.createElement('div')
  ticker.className = 'activity-ticker'
  ticker.textContent = text
  document.body.appendChild(ticker)
  requestAnimationFrame(() => ticker.classList.add('activity-ticker--visible'))
  setTimeout(() => {
    ticker.classList.remove('activity-ticker--visible')
    setTimeout(() => ticker.remove(), 400)
  }, 3500)
}

function buildQuickLog(state, onAfterLog) {
  const attendee = state.attendee

  // FAB
  const fab = document.createElement('button')
  fab.className = 'quick-log-fab'
  fab.setAttribute('aria-label', 'Quick log a visit by poster number')
  fab.textContent = 'Log #'

  // Bottom sheet
  const sheet = document.createElement('div')
  sheet.className = 'quick-log-sheet'
  sheet.innerHTML = `
    <div class="quick-log-backdrop"></div>
    <div class="quick-log-panel">
      <div class="quick-log-handle"><span class="quick-log-handle__label">&times; Close</span><div class="quick-log-handle__bar"></div></div>
      <div class="quick-log-display quick-log-display--empty">—</div>
      <div class="quick-log-confirm hidden"></div>
      <button class="btn btn--gold btn--full quick-log-log" disabled>Log Visit</button>
      <p class="quick-log-msg hidden"></p>
      <button class="quick-log-cancel" type="button">Cancel</button>
    </div>
  `

  const panel = sheet.querySelector('.quick-log-panel')
  const display = sheet.querySelector('.quick-log-display')
  const confirm = sheet.querySelector('.quick-log-confirm')
  const logBtn = sheet.querySelector('.quick-log-log')
  const msg = sheet.querySelector('.quick-log-msg')

  let currentPoster = null

  function openSheet() {
    sheet.classList.add('quick-log-sheet--open')
    fab.classList.add('quick-log-fab--hidden')
    track('quick_log_opened', { current_visits: getState().visits.length })
  }

  function closeSheet() {
    sheet.classList.remove('quick-log-sheet--open')
    fab.classList.remove('quick-log-fab--hidden')
    // Reset state
    numpad._setValue('')
    display.textContent = '—'
    display.classList.add('quick-log-display--empty')
    confirm.classList.add('hidden')
    logBtn.disabled = true
    msg.classList.add('hidden')
    currentPoster = null
  }

  // Numpad
  const numpad = createNumpad(
    (value) => {
      if (value) {
        display.textContent = value
        display.classList.remove('quick-log-display--empty')
      } else {
        display.textContent = '—'
        display.classList.add('quick-log-display--empty')
      }

      const num = parseInt(value, 10)
      const poster = state.posters.find(p => p.number === num)

      if (poster) {
        currentPoster = poster
        confirm.classList.remove('hidden')
        confirm.innerHTML = `<div class="quick-log-confirm__title">${poster.title}</div>
          <div class="quick-log-confirm__student">${poster.student_name}</div>`
        logBtn.disabled = false

        if (getState().visits.includes(poster.number)) {
          haptic.trigger('warning')
          msg.textContent = 'Already logged!'
          msg.className = 'quick-log-msg text-gold'
          logBtn.disabled = true
        } else {
          msg.classList.add('hidden')
        }
      } else {
        currentPoster = null
        confirm.classList.add('hidden')
        logBtn.disabled = true
        msg.classList.add('hidden')
      }
    },
    () => {
      display.textContent = '—'
      display.classList.add('quick-log-display--empty')
      confirm.classList.add('hidden')
      logBtn.disabled = true
      msg.classList.add('hidden')
      currentPoster = null
    }
  )

  panel.appendChild(numpad)

  // Log visit handler
  logBtn.addEventListener('click', async () => {
    if (!currentPoster) return
    logBtn.disabled = true
    logBtn.textContent = 'Logging...'

    const num = currentPoster.number
    const current = getState()
    if (!current.visits.includes(num)) {
      setState({ visits: [num, ...current.visits] })
    }

    const ok = await logVisit(attendee.code, num)
    if (!ok) queuePendingVisit(attendee.code, num)

    track('visit_logged', {
      poster_number: num,
      total_visits: getState().visits.length,
      source: 'quick_log',
      was_offline: !ok,
    })

    haptic.trigger('success')
    msg.textContent = 'Logged!'
    msg.className = 'quick-log-msg text-gold'
    logBtn.textContent = 'Log Visit'

    // Fire sparks from the log button
    import('../lib/sparks.js').then(({ launchSparksFrom }) => launchSparksFrom(logBtn))

    onAfterLog()
    showVoteReadyToast()
    checkVisitMilestone()
    updateNavDot()

    setTimeout(() => closeSheet(), 1200)
  })

  // Open/close handlers
  fab.addEventListener('click', () => { haptic.trigger('medium'); openSheet() })
  sheet.querySelector('.quick-log-backdrop').addEventListener('click', closeSheet)
  sheet.querySelector('.quick-log-handle').addEventListener('click', closeSheet)
  sheet.querySelector('.quick-log-cancel').addEventListener('click', closeSheet)

  // Escape key closes the sheet
  function onEscape(e) {
    if (e.key === 'Escape' && sheet.classList.contains('quick-log-sheet--open')) {
      closeSheet()
    }
  }
  document.addEventListener('keydown', onEscape)

  // Expose cleanup for the escape listener
  const origDestroy = numpad._destroy
  numpad._destroy = () => {
    origDestroy()
    document.removeEventListener('keydown', onEscape)
  }

  return { fab, sheet, numpad }
}

function updateNavDot() {
  const s = getState()
  const voteLink = document.querySelector('[data-route="#/vote"]')
  if (!voteLink) return
  const ready = s.visits.length >= 3 && !s.myVotes?.length && s.eventPhase !== 'results'
  if (ready && !voteLink.querySelector('.header__dot')) {
    voteLink.insertAdjacentHTML('beforeend', '<span class="header__dot"></span>')
  }
}

function countEligibleVisits() {
  const s = getState()
  const myCode = s.attendee?.code
  return s.visits.filter(num => {
    const poster = s.posters.find(p => p.number === num)
    return !poster || poster.presenter_code !== myCode
  }).length
}

function showVoteReadyToast() {
  const eligible = countEligibleVisits()
  if (eligible !== 3) return
  // Only show once per session
  if (window.__nerpg_vote_toast_shown) return
  window.__nerpg_vote_toast_shown = true
  track('voting_unlocked', { visits_count: 3 })

  const msgs = [
    '&#9989; 3 visited — voting unlocked! Keep exploring!',
    '&#9989; Voting unlocked! Visit more to broaden your picks.',
    '&#9989; You can vote now! More visits = better choices.',
    '&#9989; Nice — voting is live! Keep exploring for the full picture.',
  ]

  const toast = document.createElement('div')
  toast.className = 'vote-ready-toast'
  toast.innerHTML = pick(msgs)
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('vote-ready-toast--visible'))

  // Milestone celebration: confetti burst + progress bar glow + haptic
  haptic.trigger('success')
  import('../lib/confetti.js').then(({ launchConfetti }) => launchConfetti())
  const progress = document.querySelector('.visit-progress')
  if (progress) {
    progress.classList.add('visit-progress--glow')
    setTimeout(() => progress.classList.remove('visit-progress--glow'), 1500)
  }

  setTimeout(() => {
    toast.classList.remove('vote-ready-toast--visible')
    setTimeout(() => toast.remove(), 400)
  }, 4000)
}

async function handleLogVisit(poster, code, grid, posters, winners, state, onProgress) {
  // Optimistic local update
  const current = getState()
  if (!current.visits.includes(poster.number)) {
    const newVisits = [poster.number, ...current.visits]
    setState({ visits: newVisits })
  }

  // Try to sync to Supabase
  const ok = await logVisit(code, poster.number)
  if (!ok) {
    queuePendingVisit(code, poster.number)
  }

  track('visit_logged', {
    poster_number: poster.number,
    total_visits: getState().visits.length,
    source: 'modal',
    was_offline: !ok,
  })

  // Re-render cards to update visited states
  renderCards(grid, posters, winners, getState(), onProgress)

  if (onProgress) onProgress()
  showVoteReadyToast()
  checkVisitMilestone()
}
