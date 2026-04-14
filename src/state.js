const STORAGE_KEY = 'nerpg_app_state'
const PENDING_VISITS_KEY = 'nerpg_pending_visits'

const defaults = {
  attendee: null,       // { code, name, role } or null
  posters: [],          // cached poster list
  visits: [],           // this attendee's visit poster_numbers
  myVotes: [],          // this attendee's submitted votes
  eventPhase: 'session',
  phaseUpdatedAt: null,
  schedule: [],         // [{time, label}, ...] from Supabase
  lastSync: null,
}

let state = { ...defaults }
let listeners = []

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved) state = { ...defaults, ...saved }
  } catch { /* ignore corrupt data */ }
  return state
}

export function getState() {
  return state
}

export function setState(partial) {
  state = { ...state, ...partial }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach(fn => fn(state))
}

export function subscribe(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function clearState() {
  state = { ...defaults }
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(PENDING_VISITS_KEY)
  listeners.forEach(fn => fn(state))
}

// ── Offline visit queue ────────────────────────────────

export function queuePendingVisit(attendeeCode, posterNumber) {
  const pending = getPendingVisits()
  const key = `${attendeeCode}:${posterNumber}`
  if (pending.some(v => `${v.attendee_code}:${v.poster_number}` === key)) return
  pending.push({
    attendee_code: attendeeCode,
    poster_number: posterNumber,
    queued_at: Date.now(),
  })
  localStorage.setItem(PENDING_VISITS_KEY, JSON.stringify(pending))
}

export function getPendingVisits() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_VISITS_KEY)) || []
  } catch {
    return []
  }
}

export function clearPendingVisits() {
  localStorage.removeItem(PENDING_VISITS_KEY)
}

// ── Offline vote queue ─────────────────────────────────

const PENDING_VOTES_KEY = 'nerpg_pending_votes'

export function queuePendingVotes(attendeeCode, rankedPosterNumbers) {
  const pending = {
    attendee_code: attendeeCode,
    selections: rankedPosterNumbers,
    queued_at: Date.now(),
  }
  localStorage.setItem(PENDING_VOTES_KEY, JSON.stringify(pending))
}

export function getPendingVotes() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_VOTES_KEY)) || null
  } catch {
    return null
  }
}

export function clearPendingVotes() {
  localStorage.removeItem(PENDING_VOTES_KEY)
}
