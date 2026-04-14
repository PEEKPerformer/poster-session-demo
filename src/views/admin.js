import {
  getEventState, setEventPhase, updateSchedule,
  getStats, tallyVotes, tallyStudentVotes, getPosters, getAllPostersAdmin, getAllVisitCounts, getRecentActivity,
  getAllAttendees, updateAttendeeName, adminTogglePoster, adminResetVotes, adminResetAttendeeVotes,
  getVoterCodes, supabase,
} from '../supabase.js'
import { getState, setState } from '../state.js'
import { navigate } from '../router.js'
import { renderHeader } from '../components/header.js'
import { track } from '../lib/track.js'

const PHASES = ['session', 'results']

// Lookup maps — populated by loadAll(), used by feed rendering
let attendeeMap = new Map()  // code → { name, role }
let posterMap = new Map()    // posterNumber → student_name

function formatName(code, name, role) {
  const display = name || code
  const badge = (role === 'presenter' || role === 'student') ? `[${role}] ` : ''
  return `${badge}${display}`
}

// Vote batching — buffer realtime vote INSERTs, flush after 300ms
const voteBuffer = new Map()  // attendeeCode → { ranks: [], timer, feed }
function bufferVote(feed, attendeeCode, rank, posterNumber, serverTime) {
  if (voteBuffer.has(attendeeCode)) {
    const entry = voteBuffer.get(attendeeCode)
    entry.ranks.push({ rank, poster_number: posterNumber })
    clearTimeout(entry.timer)
    entry.timer = setTimeout(() => flushVote(attendeeCode), 300)
  } else {
    voteBuffer.set(attendeeCode, {
      ranks: [{ rank, poster_number: posterNumber }],
      feed,
      serverTime,
      timer: setTimeout(() => flushVote(attendeeCode), 300),
    })
  }
}
function flushVote(attendeeCode) {
  const entry = voteBuffer.get(attendeeCode)
  if (!entry) return
  voteBuffer.delete(attendeeCode)
  const info = attendeeMap.get(attendeeCode)
  const who = formatName(attendeeCode, info?.name, info?.role)
  entry.ranks.sort((a, b) => a.rank - b.rank)
  const rankLabels = ['1st', '2nd', '3rd']
  const parts = entry.ranks.map(r => `${rankLabels[r.rank - 1] || `#${r.rank}`} #${r.poster_number}`)
  addFeedItem(entry.feed, `${who} voted: ${parts.join(', ')}`, 'vote', entry.serverTime)
}

export function renderAdmin(root) {
  const state = getState()
  if (!state.attendee || state.attendee.role !== 'admin') {
    navigate('#/auth')
    return
  }

  // Reset lookup maps on each render to avoid stale data
  attendeeMap = new Map()
  posterMap = new Map()

  const view = document.createElement('div')
  view.className = 'view'
  view.style.maxWidth = '720px'

  renderHeader(view, {
    title: 'Admin',
    subtitle: 'Event Control',
    showLogo: false,
  })

  // Phase toggle
  const phaseSection = document.createElement('div')
  phaseSection.className = 'w-full'
  phaseSection.innerHTML = `
    <p class="label-tracked mb-1">Event Phase</p>
    <div class="phase-toggle" id="phase-toggle"></div>
  `
  view.appendChild(phaseSection)

  // Schedule editor
  const schedSection = document.createElement('div')
  schedSection.className = 'w-full'
  schedSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Schedule</p>
    <div id="schedule-editor"></div>
    <button class="btn btn--outline btn--full mt-1" id="add-schedule-item">+ Add Item</button>
    <button class="btn btn--gold btn--full mt-1" id="save-schedule">Save Schedule</button>
  `
  view.appendChild(schedSection)

  // Poster toggles
  const posterSection = document.createElement('div')
  posterSection.className = 'w-full'
  posterSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Posters</p>
    <div id="poster-toggle-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `
  view.appendChild(posterSection)

  // Stats
  const statsSection = document.createElement('div')
  statsSection.className = 'w-full'
  statsSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Live Stats</p>
    <div class="stat-grid" id="stats-grid">
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-checkins">—</div>
        <div class="stat-card__label">Check-ins</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-visits">—</div>
        <div class="stat-card__label">Total Visits</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-voters">—</div>
        <div class="stat-card__label">Voters</div>
      </div>
    </div>
  `
  view.appendChild(statsSection)

  // Attendee management
  const attendeeSection = document.createElement('div')
  attendeeSection.className = 'w-full'
  attendeeSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Attendees</p>
    <div id="attendee-list-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `
  view.appendChild(attendeeSection)

  // Per-poster visit counts
  const visitCountSection = document.createElement('div')
  visitCountSection.className = 'w-full'
  visitCountSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Poster Traffic</p>
    <div id="visit-counts-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `
  view.appendChild(visitCountSection)

  // Results
  const resultsSection = document.createElement('div')
  resultsSection.className = 'w-full'
  resultsSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Results</p>
    <div id="results-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
    <button class="btn btn--danger btn--full mt-1" id="reset-votes-btn">Reset All Votes</button>
  `
  view.appendChild(resultsSection)

  resultsSection.querySelector('#reset-votes-btn').addEventListener('click', () => {
    showResetVotesConfirmation(view)
  })

  // Live activity feed
  const feedSection = document.createElement('div')
  feedSection.className = 'w-full'
  feedSection.innerHTML = `
    <p class="label-tracked mb-1 mt-3">Live Feed</p>
    <div class="admin-feed" id="admin-feed">
      <p class="text-muted text-sm">Waiting for activity...</p>
    </div>
  `
  view.appendChild(feedSection)

  // Refresh button
  const refreshBtn = document.createElement('button')
  refreshBtn.className = 'btn btn--outline btn--full mt-3'
  refreshBtn.textContent = 'Refresh All'
  refreshBtn.addEventListener('click', () => loadAll(view))
  view.appendChild(refreshBtn)

  root.appendChild(view)

  // Initial load
  renderPhaseToggle(view)
  renderScheduleEditor(view)
  loadAll(view)
  loadRecentFeed(view)

  // Realtime subscriptions — unique name avoids server-side channel conflicts on re-render
  let channel = null
  if (supabase) {
    const feed = view.querySelector('#admin-feed')
    const channelName = `admin-live-${Date.now()}`
    channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits' }, (payload) => {
        loadStats(view)
        loadVisitCounts(view)
        const d = payload.new
        const info = attendeeMap.get(d.attendee_code)
        const who = formatName(d.attendee_code, info?.name, info?.role)
        const presenter = posterMap.get(d.poster_number)
        const presenterSnip = presenter ? ` — ${presenter}` : ''
        addFeedItem(feed, `${who} visited #${d.poster_number}${presenterSnip}`, 'visit', d.visited_at)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, (payload) => {
        loadStats(view)
        loadResults(view)
        const d = payload.new
        bufferVote(feed, d.attendee_code, d.rank, d.poster_number, d.submitted_at)
      })
      .subscribe()
  }

  return () => {
    if (channel) supabase.removeChannel(channel)
  }
}

function renderPhaseToggle(view) {
  const container = view.querySelector('#phase-toggle')
  if (!container) return
  container.innerHTML = ''

  const currentPhase = getState().eventPhase

  for (const phase of PHASES) {
    const btn = document.createElement('button')
    btn.className = `phase-btn${phase === currentPhase ? ' phase-btn--active' : ''}`
    btn.textContent = phase
    btn.addEventListener('click', () => {
      if (phase === currentPhase) return
      showPhaseConfirmation(phase, currentPhase, view)
    })
    container.appendChild(btn)
  }
}

function showPhaseConfirmation(newPhase, currentPhase, view) {
  if (document.querySelector('.vote-confirm-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'vote-confirm-overlay'
  overlay.innerHTML = `
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem;">Change Event Phase?</h3>
      <p class="text-sm text-center mb-1">
        <span class="text-muted">${currentPhase}</span>
        <span class="text-gold" style="font-weight:700"> → ${newPhase}</span>
      </p>
      <p class="text-muted text-xs text-center mb-1">This affects all attendees immediately.</p>
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="phase-cancel">Cancel</button>
        <button class="btn btn--gold" id="phase-confirm">Switch</button>
      </div>
    </div>
  `

  overlay.querySelector('#phase-cancel').addEventListener('click', () => overlay.remove())
  overlay.querySelector('.vote-confirm-overlay__backdrop').addEventListener('click', () => overlay.remove())

  overlay.querySelector('#phase-confirm').addEventListener('click', async () => {
    const confirmBtn = overlay.querySelector('#phase-confirm')
    confirmBtn.disabled = true
    confirmBtn.textContent = '...'

    const ok = await setEventPhase(getState().attendee.code, newPhase)
    overlay.remove()

    if (ok) {
      track('admin_phase_changed', {
        phase: newPhase,
        from_phase: currentPhase,
        to_phase: newPhase,
        source: 'admin_ui',
      })
      setState({ eventPhase: newPhase, phaseUpdatedAt: new Date().toISOString() })
      renderPhaseToggle(view)
    }
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('vote-confirm-overlay--open'))
}

function renderScheduleEditor(view) {
  const container = view.querySelector('#schedule-editor')
  if (!container) return

  const state = getState()
  const items = state.schedule?.length ? state.schedule : [
    { time: '2:30 PM', label: 'Prof. Anson Ma — Rheology & Additive Manufacturing' },
    { time: '3:15 PM', label: 'Prof. Mihai Duduta — Silicones for Extreme Environments' },
    { time: '4:00 PM', label: 'Awards Ceremony' },
  ]

  container.innerHTML = ''
  items.forEach((item, i) => {
    const row = document.createElement('div')
    row.className = 'schedule-row'
    row.innerHTML = `
      <input class="schedule-row__time" value="${item.time}" placeholder="Time">
      <input class="schedule-row__label" value="${item.label}" placeholder="Description">
      <button class="schedule-row__remove" data-index="${i}">&times;</button>
    `
    container.appendChild(row)
  })

  // Remove item handlers
  container.querySelectorAll('.schedule-row__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.schedule-row').remove()
    })
  })

  // Add item
  view.querySelector('#add-schedule-item')?.addEventListener('click', () => {
    const row = document.createElement('div')
    row.className = 'schedule-row'
    row.innerHTML = `
      <input class="schedule-row__time" value="" placeholder="Time">
      <input class="schedule-row__label" value="" placeholder="Description">
      <button class="schedule-row__remove">&times;</button>
    `
    row.querySelector('.schedule-row__remove').addEventListener('click', () => row.remove())
    container.appendChild(row)
  })

  // Save handler
  view.querySelector('#save-schedule')?.addEventListener('click', async () => {
    const rows = container.querySelectorAll('.schedule-row')
    const schedule = Array.from(rows).map(row => ({
      time: row.querySelector('.schedule-row__time').value.trim(),
      label: row.querySelector('.schedule-row__label').value.trim(),
    })).filter(s => s.time && s.label)

    const btn = view.querySelector('#save-schedule')
    btn.disabled = true
    btn.textContent = 'Saving...'

    const ok = await updateSchedule(getState().attendee.code, schedule)
    btn.disabled = false
    btn.textContent = ok ? 'Saved!' : 'Error'
    if (ok) {
      track('admin_schedule_saved', { item_count: schedule.length })
      setState({ schedule })
    }
    setTimeout(() => { btn.textContent = 'Save Schedule' }, 2000)
  })
}

function addFeedItem(feed, text, type, serverTimestamp) {
  // Remove placeholder
  const placeholder = feed.querySelector('.text-muted')
  if (placeholder) placeholder.remove()

  const item = document.createElement('div')
  item.className = `feed-item feed-item--${type}`
  const ts = serverTimestamp ? new Date(serverTimestamp) : new Date()
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const timeSpan = document.createElement('span')
  timeSpan.className = 'feed-item__time'
  timeSpan.textContent = time
  item.appendChild(timeSpan)
  item.appendChild(document.createTextNode(` ${text}`))
  feed.prepend(item)

  // Cap at 50 items
  while (feed.children.length > 50) feed.lastChild.remove()
}

async function loadRecentFeed(view) {
  const feed = view.querySelector('#admin-feed')
  if (!feed) return
  try {
    const items = await getRecentActivity(20)
    if (!items.length) return
    feed.innerHTML = ''
    for (const item of items) {
      const who = formatName(
        item.attendee_code,
        item.attendee_name || attendeeMap.get(item.attendee_code)?.name,
        item.attendee_role || attendeeMap.get(item.attendee_code)?.role,
      )
      let text
      if (item.type === 'visit') {
        const presenter = posterMap.get(item.poster_number)
        const presenterSnip = presenter ? ` — ${presenter}` : ''
        text = `${who} visited #${item.poster_number}${presenterSnip}`
      } else {
        const rankLabels = ['1st', '2nd', '3rd']
        const parts = (item.ranks || []).map(r => `${rankLabels[r.rank - 1] || `#${r.rank}`} #${r.poster_number}`)
        text = `${who} voted: ${parts.join(', ')}`
      }
      const el = document.createElement('div')
      el.className = `feed-item feed-item--${item.type}`
      const t = new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const timeSpan = document.createElement('span')
      timeSpan.className = 'feed-item__time'
      timeSpan.textContent = t
      el.appendChild(timeSpan)
      el.appendChild(document.createTextNode(` ${text}`))
      feed.appendChild(el)
    }
  } catch { /* keep placeholder */ }
}

async function loadAll(view) {
  await Promise.all([
    loadStats(view),
    loadAttendees(view),
    loadPosterToggles(view),
    loadVisitCounts(view),
    loadResults(view),
  ])
  // Build lookup maps from loaded data for feed enrichment
  try {
    const attendees = await getAllAttendees()
    attendeeMap = new Map(attendees.map(a => [a.code, { name: a.name, role: a.role }]))
  } catch { /* keep previous map */ }
  const posters = getState().posters
  if (posters?.length) {
    posterMap = new Map(posters.map(p => [p.number, p.student_name]))
  }
}

async function loadStats(view) {
  try {
    const stats = await getStats()
    const checkins = view.querySelector('#stat-checkins')
    const visits = view.querySelector('#stat-visits')
    const voters = view.querySelector('#stat-voters')
    if (checkins) checkins.textContent = stats.checkins
    if (visits) visits.textContent = stats.totalVisits
    if (voters) voters.textContent = stats.voters
  } catch {
    // Keep showing previous values
  }
}

async function loadPosterToggles(view) {
  const container = view.querySelector('#poster-toggle-container')
  if (!container) return

  try {
    const posters = await getAllPostersAdmin()
    if (!posters.length) {
      container.innerHTML = '<p class="text-muted text-sm">No posters found.</p>'
      return
    }

    container.innerHTML = ''
    for (const poster of posters) {
      const row = document.createElement('div')
      row.className = `poster-toggle-row${poster.active ? '' : ' poster-toggle-row--inactive'}`
      row.innerHTML = `
        <span class="text-gold" style="font-weight:800; min-width:2rem">#${poster.number}</span>
        <div class="poster-toggle-row__info">
          <div class="poster-toggle-row__title">${poster.title}</div>
          <div class="poster-toggle-row__student">${poster.student_name}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${poster.active ? 'checked' : ''}>
          <span class="toggle-switch__slider"></span>
        </label>
      `
      const checkbox = row.querySelector('input')
      checkbox.addEventListener('change', async () => {
        const newActive = checkbox.checked
        checkbox.disabled = true
        const ok = await adminTogglePoster(getState().attendee.code, poster.number, newActive)
        checkbox.disabled = false
        if (ok) {
          track('admin_poster_toggled', { poster_number: poster.number, active: newActive })
          poster.active = newActive
          row.classList.toggle('poster-toggle-row--inactive', !newActive)
        } else {
          checkbox.checked = !newActive // revert
        }
      })
      container.appendChild(row)
    }
  } catch {
    container.innerHTML = '<p class="text-muted text-sm">Error loading posters.</p>'
  }
}

async function loadAttendees(view) {
  const container = view.querySelector('#attendee-list-container')
  if (!container) return

  try {
    const [attendees, voterCodes] = await Promise.all([getAllAttendees(), getVoterCodes()])
    if (!attendees.length) {
      container.innerHTML = '<p class="text-muted text-sm">No attendees found.</p>'
      return
    }

    // Group by role
    const groups = { admin: [], presenter: [], student: [], attendee: [] }
    for (const a of attendees) {
      (groups[a.role] || groups.attendee).push(a)
    }

    const roleLabels = { admin: 'Admins', presenter: 'Presenters', student: 'Students', attendee: 'Voters' }
    let html = `<div class="attendee-list">`

    for (const role of ['presenter', 'student', 'attendee', 'admin']) {
      const list = groups[role]
      if (!list.length) continue

      html += `<p class="text-xs text-muted mt-1 mb-0" style="font-weight:600; text-transform:uppercase; letter-spacing:0.05em">${roleLabels[role]} (${list.length})</p>`

      for (const a of list) {
        const isPlaceholder = a.name.startsWith('Voter ')
        const hasVoted = voterCodes.has(a.code)
        html += `
          <div class="attendee-row" data-code="${a.code}">
            <span class="attendee-row__code">${a.code}</span>
            <span class="attendee-row__name ${isPlaceholder ? 'text-muted' : ''}">${a.name}</span>
            ${hasVoted ? `<button class="attendee-row__reset btn--text" data-code="${a.code}" data-name="${a.name.replace(/"/g, '&quot;')}" style="color:var(--error)">Reset Votes</button>` : ''}
            <button class="attendee-row__edit btn--text" data-code="${a.code}" data-name="${a.name.replace(/"/g, '&quot;')}">Edit</button>
          </div>
        `
      }
    }

    html += `</div>`
    container.innerHTML = html

    // Edit handlers
    container.querySelectorAll('.attendee-row__edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code
        const currentName = btn.dataset.name
        showEditNameDialog(code, currentName, view)
      })
    })

    // Reset votes handlers
    container.querySelectorAll('.attendee-row__reset').forEach(btn => {
      btn.addEventListener('click', () => {
        showResetAttendeeVotesConfirmation(btn.dataset.code, btn.dataset.name, view)
      })
    })
  } catch {
    container.innerHTML = '<p class="text-muted text-sm">Error loading attendees.</p>'
  }
}

function showEditNameDialog(code, currentName, view) {
  if (document.querySelector('.vote-confirm-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'vote-confirm-overlay'
  overlay.innerHTML = `
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem;">Edit Name</h3>
      <p class="text-muted text-xs text-center mb-1">Code: <strong>${code}</strong></p>
      <input type="text" class="input" id="edit-name-input" value="${currentName.replace(/"/g, '&quot;')}" placeholder="Attendee name" style="margin-bottom:0.75rem">
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="edit-cancel">Cancel</button>
        <button class="btn btn--gold" id="edit-save">Save</button>
      </div>
    </div>
  `

  overlay.querySelector('#edit-cancel').addEventListener('click', () => overlay.remove())
  overlay.querySelector('.vote-confirm-overlay__backdrop').addEventListener('click', () => overlay.remove())

  overlay.querySelector('#edit-save').addEventListener('click', async () => {
    const input = overlay.querySelector('#edit-name-input')
    const newName = input.value.trim()
    if (!newName) return

    const saveBtn = overlay.querySelector('#edit-save')
    saveBtn.disabled = true
    saveBtn.textContent = '...'

    const ok = await updateAttendeeName(getState().attendee.code, code, newName)
    overlay.remove()

    if (ok) {
      track('admin_attendee_name_updated', { target_code: code })
      loadAttendees(view)
    }
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => {
    overlay.classList.add('vote-confirm-overlay--open')
    overlay.querySelector('#edit-name-input')?.focus()
  })
}

function showResetAttendeeVotesConfirmation(code, name, view) {
  if (document.querySelector('.vote-confirm-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'vote-confirm-overlay'
  overlay.innerHTML = `
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem; color:var(--error)">Reset Votes?</h3>
      <p class="text-sm text-center mb-1">Delete all votes for <strong>${name}</strong> (${code})?</p>
      <p class="text-muted text-xs text-center mb-1">They'll be able to vote again.</p>
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="reset-attendee-cancel">Cancel</button>
        <button class="btn btn--danger" id="reset-attendee-confirm">Reset Votes</button>
      </div>
    </div>
  `

  overlay.querySelector('#reset-attendee-cancel').addEventListener('click', () => overlay.remove())
  overlay.querySelector('.vote-confirm-overlay__backdrop').addEventListener('click', () => overlay.remove())

  overlay.querySelector('#reset-attendee-confirm').addEventListener('click', async () => {
    const confirmBtn = overlay.querySelector('#reset-attendee-confirm')
    confirmBtn.disabled = true
    confirmBtn.textContent = '...'

    const ok = await adminResetAttendeeVotes(getState().attendee.code, code)
    overlay.remove()

    if (ok) {
      track('admin_attendee_votes_reset', { target_code: code })
      // If admin reset their own votes, clear local state too
      if (code === getState().attendee.code) {
        setState({ myVotes: [] })
      }
      loadStats(view)
      loadResults(view)
      loadAttendees(view)
    }
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('vote-confirm-overlay--open'))
}

function showResetVotesConfirmation(view) {
  if (document.querySelector('.vote-confirm-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'vote-confirm-overlay'
  overlay.innerHTML = `
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem; color:var(--error)">Reset All Votes?</h3>
      <p class="text-muted text-xs text-center mb-1">This permanently deletes every submitted vote. This action cannot be undone.</p>
      <p class="text-sm text-center mb-1">Type <strong style="color:var(--error)">RESET</strong> to confirm</p>
      <input type="text" class="input" id="reset-confirm-input" placeholder="Type RESET" autocomplete="off" style="margin-bottom:0.75rem; text-align:center">
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="reset-cancel">Cancel</button>
        <button class="btn btn--danger" id="reset-confirm" disabled>Reset All Votes</button>
      </div>
    </div>
  `

  const input = overlay.querySelector('#reset-confirm-input')
  const confirmBtn = overlay.querySelector('#reset-confirm')

  input.addEventListener('input', () => {
    confirmBtn.disabled = input.value.trim() !== 'RESET'
  })

  overlay.querySelector('#reset-cancel').addEventListener('click', () => overlay.remove())
  overlay.querySelector('.vote-confirm-overlay__backdrop').addEventListener('click', () => overlay.remove())

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = '...'

    const ok = await adminResetVotes(getState().attendee.code)
    overlay.remove()

    if (ok) {
      track('admin_all_votes_reset')
      setState({ myVotes: [] })
      loadStats(view)
      loadResults(view)
    }
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => {
    overlay.classList.add('vote-confirm-overlay--open')
    input.focus()
  })
}

async function loadVisitCounts(view) {
  const container = view.querySelector('#visit-counts-container')
  if (!container) return

  try {
    const counts = await getAllVisitCounts()
    const posters = getState().posters

    if (!counts.length) {
      container.innerHTML = '<p class="text-muted text-sm">No visits yet.</p>'
      return
    }

    // Build a horizontal bar chart
    const maxCount = Math.max(...counts.map(c => c.count))
    const barsHtml = counts.map(c => {
      const poster = posters.find(p => p.number === c.poster_number)
      const pct = maxCount ? (c.count / maxCount * 100) : 0
      return `
        <div class="visit-bar">
          <div class="visit-bar__label">#${c.poster_number}</div>
          <div class="visit-bar__track">
            <div class="visit-bar__fill" style="width: ${pct}%"></div>
          </div>
          <div class="visit-bar__count">${c.count}</div>
        </div>
      `
    }).join('')

    container.innerHTML = `<div class="visit-bars">${barsHtml}</div>`
  } catch {
    container.innerHTML = '<p class="text-muted text-sm">Error loading visit counts.</p>'
  }
}

async function loadResults(view) {
  const container = view.querySelector('#results-container')
  if (!container) return

  try {
    const [tally, studentTally] = await Promise.all([tallyVotes(), tallyStudentVotes()])

    if (!tally.length && !studentTally.length) {
      container.innerHTML = '<p class="text-muted text-sm">No votes yet.</p>'
      return
    }

    container.innerHTML = ''

    if (tally.length) {
      const label = document.createElement('p')
      label.className = 'text-xs text-muted mt-1 mb-0'
      label.style.cssText = 'font-weight:600; text-transform:uppercase; letter-spacing:0.05em'
      label.textContent = 'Distinguished Poster (attendee votes)'
      container.appendChild(label)
      container.appendChild(buildResultsTable(tally))
    }

    if (studentTally.length) {
      const label = document.createElement('p')
      label.className = 'text-xs text-muted mt-1 mb-0'
      label.style.cssText = 'font-weight:600; text-transform:uppercase; letter-spacing:0.05em'
      label.textContent = 'Peer Impact Award (presenter/student votes)'
      container.appendChild(label)
      container.appendChild(buildResultsTable(studentTally))
    }
  } catch {
    container.innerHTML = '<p class="text-muted text-sm">Error loading results.</p>'
  }
}

function buildResultsTable(tally) {
  const table = document.createElement('table')
  table.className = 'results-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Poster</th>
        <th>Score</th>
        <th>1st</th>
        <th>2nd</th>
        <th>3rd</th>
      </tr>
    </thead>
    <tbody>
      ${tally.map((row, i) => `
        <tr>
          <td class="results-table__rank">${i + 1}</td>
          <td>
            <strong>#${row.poster_number}</strong>
            <span class="text-muted text-xs"> ${row.student_name}</span>
            <br><span class="text-sm">${row.poster_title}</span>
          </td>
          <td class="text-gold" style="font-weight:800">${row.weighted_score}</td>
          <td>${row.first_place_count}</td>
          <td>${row.second_place_count}</td>
          <td>${row.third_place_count}</td>
        </tr>
      `).join('')}
    </tbody>
  `
  return table
}
