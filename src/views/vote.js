import { submitVotes, getMyVotes, tallyVotes, tallyStudentVotes, getEventState, supabase } from '../supabase.js'
import { getState, setState, queuePendingVotes } from '../state.js'
import { navigate } from '../router.js'
import { renderHeader } from '../components/header.js'
import { createPosterCard } from '../components/poster-card.js'
import { createPodium } from '../components/podium.js'
import { track } from '../lib/track.js'
import { haptic } from '../lib/haptics.js'
import { getFirstName } from '../lib/identity.js'
import { seededShuffle } from '../lib/shuffle.js'
import { esc } from '../lib/escape.js'

const GRACE_MS = 45 * 1000

function isStudentVoter(state) {
  const role = state.attendee?.role
  return role === 'presenter' || role === 'student'
}

function awardName(state) {
  return isStudentVoter(state) ? 'NERPG Peer Impact Award' : 'NERPG Distinguished Poster Award'
}

export function renderVote(root) {
  const state = getState()
  if (!state.attendee) { navigate('#/auth'); return }

  track('vote_page_viewed', {
    phase: state.eventPhase,
    visits_count: state.visits.length,
    role: state.attendee.role,
  })

  const view = document.createElement('div')
  view.className = 'view'

  // Append immediately so the router owns this DOM node.
  // If a second hashchange fires before the async completes,
  // the router clears root and this view becomes orphaned (harmless).
  root.appendChild(view)

  // Tracks podium instances for cleanup
  let podiumInstances = []
  let morphTimer = null

  // Check if already voted
  checkExistingVotes(state.attendee.code, view, state, (pi) => { podiumInstances.push(pi) }, (t) => { morphTimer = t })

  // Auto-detect phase change → re-render vote page in-place
  // Uses realtime when available, polls as fallback
  let channel = null
  if (supabase) {
    channel = supabase.channel(`vote-phase-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_state' }, (payload) => {
        const newPhase = payload.new?.phase
        if (newPhase && newPhase !== getState().eventPhase) {
          const updatedAt = payload.new.updated_at || new Date().toISOString()
          setState({ eventPhase: newPhase, phaseUpdatedAt: updatedAt })
          window.dispatchEvent(new HashChangeEvent('hashchange'))
        }
      })
      .subscribe()
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
    podiumInstances.forEach(pi => pi.destroy())
    if (morphTimer) clearTimeout(morphTimer)
  }
}

async function checkExistingVotes(code, view, state, onPodium, onMorphTimer) {
  // If the view was removed from the DOM by a subsequent route change, bail out
  if (!view.parentNode) return

  const existing = await getMyVotes(code)
  if (!view.parentNode) return // check again after async

  const isResults = state.eventPhase === 'results'

  // If phaseUpdatedAt is missing during results, fetch it fresh to avoid skipping grace
  let phaseUpdatedAt = state.phaseUpdatedAt
  if (isResults && !phaseUpdatedAt) {
    try {
      const es = await getEventState()
      if (es.updated_at) {
        phaseUpdatedAt = es.updated_at
        setState({ phaseUpdatedAt })
      }
    } catch { /* offline — fall through with null */ }
    if (!view.parentNode) return
  }

  // Calculate grace period
  const switchedAt = phaseUpdatedAt ? new Date(phaseUpdatedAt).getTime() : 0
  const graceRemaining = isResults ? Math.max(0, (switchedAt + GRACE_MS) - Date.now()) : 0
  const graceExpired = isResults && graceRemaining <= 0

  // Results + grace expired → celebration (regardless of vote status)
  if (graceExpired) {
    renderResultsCelebration(view, state, onPodium)
    return
  }

  if (existing.length > 0) {
    // During session, redirect to the nicer confirm page (schedule + stats)
    if (!isResults) {
      if (!state.myVotes?.length) {
        setState({ myVotes: existing.map(v => ({ poster_number: v.poster_number, rank: v.rank })) })
      }
      navigate('#/confirm')
      return
    }
    renderAlreadyVoted(view, state, existing, graceRemaining, onPodium, onMorphTimer)
    return
  }

  // Check event phase — allow voting during 'session' phase, or for admins anytime
  const isPrivileged = state.attendee?.role === 'admin'
  const isSession = state.eventPhase === 'session'
  const inGracePeriod = graceRemaining > 0

  if (!isSession && !isPrivileged && !inGracePeriod) {
    renderNotReady(view, state)
    return
  }

  renderVotingUI(view, state, inGracePeriod ? graceRemaining : 0, onPodium, onMorphTimer)
}

function renderAlreadyVoted(view, state, votes, graceMs = 0, onPodium = null, onMorphTimer = null) {
  const votedFirstName = getFirstName(state.attendee?.name)
  renderHeader(view, {
    title: votedFirstName ? `${votedFirstName}, You've Voted` : "You've Voted",
    subtitle: awardName(state),
    showLogo: false,
  })

  // Countdown banner when voting is closing
  if (graceMs > 0) {
    const banner = document.createElement('div')
    banner.className = 'vote-countdown'
    view.appendChild(banner)

    const deadline = Date.now() + graceMs

    function tick() {
      const remaining = Math.max(0, deadline - Date.now())
      if (remaining <= 0) {
        banner.innerHTML = '<strong>Tallying results...</strong>'
        // Morph into celebration after a brief pause
        if (onMorphTimer && onPodium) {
          const t = setTimeout(() => {
            if (!view.parentNode) return
            renderResultsCelebration(view, state, onPodium)
          }, 2000)
          onMorphTimer(t)
        }
        return
      }
      const secs = Math.ceil(remaining / 1000)
      const m = Math.floor(secs / 60)
      const s = secs % 60
      banner.innerHTML = `Results in <strong>${m}:${String(s).padStart(2, '0')}</strong>`
      setTimeout(tick, 1000)
    }

    tick()
  }

  const card = document.createElement('div')
  card.className = 'card w-full'
  card.innerHTML = `
    <p class="text-sm text-muted mb-1">Your picks:</p>
    ${votes.map(v => {
      const poster = state.posters.find(p => p.number === v.poster_number)
      const ord = ['1st', '2nd', '3rd'][v.rank - 1] || `#${v.rank}`
      return `<div class="mt-1">
        <span class="text-gold" style="font-weight:800">${ord}</span>
        <span style="font-weight:600">Poster #${v.poster_number}</span>
        ${poster ? `<span class="text-muted text-sm"> — ${esc(poster.title)}</span>` : ''}
      </div>`
    }).join('')}
  `
  view.appendChild(card)

  const info = document.createElement('p')
  info.className = 'text-muted text-sm text-center mt-2'
  info.textContent = graceMs > 0
    ? 'Votes are final. Results coming soon...'
    : 'Votes are final. Results will be announced soon!'
  view.appendChild(info)
}

function renderNotReady(view, state) {
  renderHeader(view, {
    title: 'Voting',
    subtitle: awardName(state),
    showLogo: false,
  })

  const msg = document.createElement('div')
  msg.className = 'card w-full text-center'
  msg.innerHTML = `
    <p class="text-muted">
      Voting has closed. Results will be announced soon.
    </p>
  `
  view.appendChild(msg)
}

function renderVotingUI(view, state, graceMs = 0, onPodium, onMorphTimer) {
  renderHeader(view, {
    title: 'Vote Top 3',
    subtitle: awardName(state),
    showLogo: false,
  })

  // Grace period countdown banner
  if (graceMs > 0) {
    const banner = document.createElement('div')
    banner.className = 'vote-countdown'
    view.appendChild(banner)

    const deadline = Date.now() + graceMs

    function tick() {
      const remaining = Math.max(0, deadline - Date.now())
      if (remaining <= 0) {
        banner.innerHTML = '<strong>Voting closed!</strong>'
        const btn = view.querySelector('.btn--gold')
        if (btn) { btn.disabled = true; btn.textContent = 'Voting Closed' }
        // Morph into celebration after a brief pause
        const t = setTimeout(() => {
          if (!view.parentNode) return
          renderResultsCelebration(view, state, onPodium)
        }, 2000)
        onMorphTimer(t)
        return
      }
      const secs = Math.ceil(remaining / 1000)
      const m = Math.floor(secs / 60)
      const s = secs % 60
      banner.innerHTML = `Voting closes in <strong>${m}:${String(s).padStart(2, '0')}</strong>`
      setTimeout(tick, 1000)
    }

    tick()
  }

  // Filter to only visited posters, excluding own poster for presenters
  const myCode = state.attendee?.code
  const visited = state.posters.filter(p =>
    state.visits.includes(p.number) && p.presenter_code !== myCode
  )
  const visitedPosters = seededShuffle([...visited], state.attendee?.code || '')

  if (visitedPosters.length < 3) {
    const msg = document.createElement('div')
    msg.className = 'card w-full text-center'
    msg.innerHTML = `
      <p class="text-muted">
        Visit at least <strong class="text-gold">3 posters</strong> before voting.
      </p>
      <p class="text-muted text-sm mt-1">
        You've visited ${visitedPosters.length} so far.
      </p>
      <button class="btn btn--outline mt-2" id="go-gallery">Visit More Posters</button>
    `
    view.appendChild(msg)
    msg.querySelector('#go-gallery')?.addEventListener('click', () => navigate('#/gallery'))
    return
  }

  const instructions = document.createElement('div')
  instructions.className = 'vote-instructions'
  instructions.innerHTML = `
    <div class="vote-instructions__step">
      <span class="vote-instructions__num">1</span>
      <span class="vote-instructions__text">Tap your <strong class="text-gold">favorite</strong> poster</span>
    </div>
    <div class="vote-instructions__step">
      <span class="vote-instructions__num">2</span>
      <span class="vote-instructions__text">Tap your <strong class="text-gold">2nd</strong> and <strong class="text-gold">3rd</strong> picks</span>
    </div>
    <div class="vote-instructions__step">
      <span class="vote-instructions__num">3</span>
      <span class="vote-instructions__text">Review and submit</span>
    </div>
  `
  view.appendChild(instructions)

  // Nudge: show how many posters they're voting from
  const total = state.posters.length
  const nudge = document.createElement('div')
  nudge.className = 'vote-nudge'
  if (visitedPosters.length >= total) {
    nudge.innerHTML = `Voting from all <strong>${total}</strong> posters`
  } else {
    nudge.innerHTML = `Voting from <strong>${visitedPosters.length}</strong> of <strong>${total}</strong> posters — <a href="#/gallery">visit more to expand your options</a>`
  }
  view.appendChild(nudge)

  // State: ranked selections
  let selections = [] // [posterNumber, posterNumber, posterNumber]

  // Poster grid
  const grid = document.createElement('div')
  grid.className = 'poster-grid'

  function renderGrid() {
    grid.innerHTML = ''
    for (const poster of visitedPosters) {
      const rankIndex = selections.indexOf(poster.number)
      const rank = rankIndex >= 0 ? rankIndex + 1 : null

      const card = createPosterCard(poster, {
        blind: false,
        showNotes: true, // show personal notes to aid memory
        rank,
        tapHint: rank ? `#${rank} — tap to change` : 'Tap to rank',
        onClick: () => {
          if (rank) {
            haptic.trigger('light')
            track('vote_poster_deselected', { poster_number: poster.number, previous_rank: rank })
            selections = selections.filter(n => n !== poster.number)
          } else if (selections.length < 3) {
            haptic.trigger('light')
            selections.push(poster.number)
            track('vote_poster_selected', { poster_number: poster.number, rank_assigned: selections.length })
          }
          renderGrid()
          updateSubmitState()
        },
      })
      grid.appendChild(card)
    }
  }

  view.appendChild(grid)

  // Summary bar
  const summary = document.createElement('div')
  summary.className = 'card w-full mt-2'
  summary.id = 'vote-summary'
  view.appendChild(summary)

  // Submit button
  const submitBtn = document.createElement('button')
  submitBtn.className = 'btn btn--gold btn--full mt-2'
  submitBtn.disabled = true
  submitBtn.textContent = 'Submit Votes'
  view.appendChild(submitBtn)

  function updateSubmitState() {
    submitBtn.disabled = selections.length !== 3

    const ordinal = ['1st', '2nd', '3rd']
    const summaryHtml = [1, 2, 3].map(i => {
      const num = selections[i - 1]
      if (num) {
        const poster = state.posters.find(p => p.number === num)
        return `<span class="text-gold" style="font-weight:800">${ordinal[i - 1]}</span> — Poster #${num}${poster ? ` — ${esc(poster.title)}` : ''}`
      }
      return `<span class="text-muted">${ordinal[i - 1]} —</span>`
    }).join('<br>')

    summary.innerHTML = `<div class="text-sm">${summaryHtml}</div>`
  }

  submitBtn.addEventListener('click', () => {
    if (selections.length !== 3) return
    track('vote_submit_clicked', { selections })
    showVoteConfirmation(selections, state, submitBtn)
  })

  renderGrid()
  updateSubmitState()
}

/** Morph the vote view into the results celebration — podium + confetti right here. */
async function renderResultsCelebration(view, state, onPodium) {
  // Clear everything and rebuild
  view.innerHTML = ''

  renderHeader(view, {
    title: 'Results',
    subtitle: 'NERPG Spring Event 2026',
    showLogo: false,
  })

  // Loading state while tally fetches
  const placeholder = document.createElement('p')
  placeholder.className = 'text-muted text-center'
  placeholder.textContent = 'Tallying votes...'
  view.appendChild(placeholder)

  let tally = []
  let studentTally = []
  try {
    ;[tally, studentTally] = await Promise.all([tallyVotes(), tallyStudentVotes()])
  } catch { /* no results yet */ }

  // If view was unmounted during fetch, bail
  if (!view.parentNode) return

  placeholder.remove()
  track('results_viewed')

  // Distinguished Poster podium (attendee/admin votes)
  const dpHeader = document.createElement('div')
  dpHeader.className = 'results-section-header'
  dpHeader.innerHTML = `
    <h2 class="results-section-header__title">Distinguished Poster Award</h2>
    <p class="results-section-header__sub">Voted by NERPG industry attendees · Cash prize</p>
  `
  view.appendChild(dpHeader)

  const podium = createPodium(tally, state.posters)
  view.appendChild(podium.el)
  onPodium(podium)

  // Peer Impact podium (presenter/student votes)
  if (studentTally.length > 0) {
    const divider = document.createElement('hr')
    divider.className = 'results-divider'
    view.appendChild(divider)

    const piHeader = document.createElement('div')
    piHeader.className = 'results-section-header'
    piHeader.innerHTML = `
      <h2 class="results-section-header__title">Peer Impact Award</h2>
      <p class="results-section-header__sub">Voted by fellow student presenters and attendees</p>
    `
    view.appendChild(piHeader)

    const studentPodium = createPodium(studentTally, state.posters, {
      firstPlaceLabel: 'NERPG 2026 Peer Impact Award',
    })
    view.appendChild(studentPodium.el)
    onPodium(studentPodium)
  }

  // Link to full gallery
  const link = document.createElement('button')
  link.className = 'btn btn--outline mt-2'
  link.textContent = 'View All Posters'
  link.addEventListener('click', () => navigate('#/gallery'))
  view.appendChild(link)
}

function showVoteConfirmation(selections, state, submitBtn) {
  // Prevent duplicates
  if (document.querySelector('.vote-confirm-overlay')) return

  const ordinal = ['1st', '2nd', '3rd']
  const summaryHtml = selections.map((num, i) => {
    const poster = state.posters.find(p => p.number === num)
    return `<div class="vote-confirm__pick">
      <span class="text-gold" style="font-weight:800">${ordinal[i]}</span>
      <span>Poster #${num}${poster ? ` — ${esc(poster.title)}` : ''}</span>
    </div>`
  }).join('')

  const overlay = document.createElement('div')
  overlay.className = 'vote-confirm-overlay'
  overlay.innerHTML = `
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem;">Submit Your Votes?</h3>
      <p class="text-muted text-sm text-center mb-1">${awardName(state)} — this cannot be changed.</p>
      <div class="vote-confirm__picks">${summaryHtml}</div>
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="vote-cancel">Go Back</button>
        <button class="btn btn--gold" id="vote-confirm">Confirm</button>
      </div>
    </div>
  `

  overlay.querySelector('#vote-cancel').addEventListener('click', () => {
    track('vote_confirmation_cancelled')
    overlay.remove()
  })
  overlay.querySelector('.vote-confirm-overlay__backdrop').addEventListener('click', () => {
    track('vote_confirmation_cancelled')
    overlay.remove()
  })

  overlay.querySelector('#vote-confirm').addEventListener('click', async () => {
    const confirmBtn = overlay.querySelector('#vote-confirm')
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Submitting...'
    overlay.querySelector('#vote-cancel').disabled = true

    const { ok, message } = await submitVotes(state.attendee.code, selections)

    const showInlineError = (text) => {
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Confirm'
      overlay.querySelector('#vote-cancel').disabled = false
      const existing = overlay.querySelector('.vote-confirm__error')
      if (existing) existing.remove()
      const err = document.createElement('p')
      err.className = 'vote-confirm__error text-sm text-center mt-1'
      err.style.color = 'var(--error)'
      err.textContent = text
      overlay.querySelector('.vote-confirm__actions').before(err)
    }

    const trackProps = (wasOffline) => ({
      selections,
      rank_1_poster: selections[0] ?? null,
      rank_2_poster: selections[1] ?? null,
      rank_3_poster: selections[2] ?? null,
      n_picks: selections.length,
      visits_count: state.visits.length,
      was_offline: wasOffline,
    })

    if (ok) {
      haptic.trigger('success')
      track('vote_submitted', trackProps(false))
      setState({
        myVotes: selections.map((num, i) => ({ poster_number: num, rank: i + 1 })),
      })
      overlay.remove()
      navigate('#/confirm')
    } else if (message && (message.includes('Voting is closed') || message.includes('Cannot vote'))) {
      haptic.trigger('error')
      track('vote_submit_failed', { reason: 'server_rejected', error_message: message })
      showInlineError(message)
    } else if (!navigator.onLine) {
      // Genuinely offline — queue and navigate with offline indicator
      haptic.trigger('success')
      track('vote_submitted', trackProps(true))
      queuePendingVotes(state.attendee.code, selections)
      setState({
        myVotes: selections.map((num, i) => ({ poster_number: num, rank: i + 1 })),
        pendingVoteSync: true,
      })
      overlay.remove()
      navigate('#/confirm')
    } else {
      // Online but failed (network blip, RLS denial, auth expiry). Surface it.
      haptic.trigger('error')
      track('vote_submit_failed', { reason: 'network_or_server', error_message: message || 'unknown' })
      showInlineError(message || 'Submission failed — please try again.')
    }
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('vote-confirm-overlay--open'))
}

