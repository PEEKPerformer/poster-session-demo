// Demo stub — all data served from bundled JSON, no network calls, no realtime.
// The simulator drives phase changes and toasts directly via setState + showToast.
// Existing app code falls through to the "no supabase" branches, which already
// return the static fixtures — so we only need to re-export a sane surface.

import {
  staticPosters, staticAttendees, staticEventState,
  staticTallyVotes, staticTallyStudentVotes, staticVisits, staticVotes,
} from './data/static.js'

export const supabase = null

export async function validateCode(code) {
  const normalized = (code || '').toUpperCase().trim()
  const match = staticAttendees.find(a => a.code === normalized)
  if (!match) return { data: null, error: { code: 'not_found', message: 'Invalid code' } }
  return { data: { code: match.code, name: match.name, role: match.role }, error: null }
}

export async function getPosters() { return staticPosters.filter(p => p.active !== false) }

export async function getAllPostersAdmin() {
  return staticPosters.map(p => ({
    number: p.number, title: p.title, student_name: p.student_name, active: p.active !== false,
  }))
}

export async function getEventState() {
  // Demo: read from the running app's state when available so tab-triggered
  // phase changes (e.g. clicking Results) aren't clobbered by the 5s poll in
  // vote.js which otherwise overwrites state.eventPhase back to 'session'.
  try {
    const live = typeof window !== 'undefined' && window.__demoGetState?.()
    if (live?.eventPhase) {
      return {
        phase: live.eventPhase,
        updated_at: live.phaseUpdatedAt || staticEventState.updated_at,
        schedule: staticEventState.schedule || [],
      }
    }
  } catch { /* fall through */ }
  return {
    phase: staticEventState.phase,
    updated_at: staticEventState.updated_at,
    schedule: staticEventState.schedule || [],
  }
}

// Visits — in-memory, so the viewer can log their own during the demo.
let inMemoryVisits = staticVisits.map(v => ({ ...v }))

export async function logVisit(attendeeCode, posterNumber) {
  if (inMemoryVisits.some(v => v.attendee_code === attendeeCode && v.poster_number === posterNumber)) {
    return true
  }
  inMemoryVisits.push({
    attendee_code: attendeeCode,
    poster_number: posterNumber,
    visited_at: new Date().toISOString(),
  })
  return true
}

export async function getVisits(attendeeCode) {
  return inMemoryVisits
    .filter(v => v.attendee_code === attendeeCode)
    .map(v => ({ poster_number: v.poster_number, visited_at: v.visited_at }))
}

// Votes — in-memory so the demo can mutate tallies as voting progresses.
let inMemoryVotes = staticVotes.map(v => ({ ...v }))

export async function submitVotes(attendeeCode, rankedPosterNumbers) {
  // Clear any existing votes for this attendee first (same semantics as a real reset+insert)
  inMemoryVotes = inMemoryVotes.filter(v => v.attendee_code !== attendeeCode)
  for (const [i, num] of rankedPosterNumbers.entries()) {
    inMemoryVotes.push({
      attendee_code: attendeeCode,
      poster_number: num,
      rank: i + 1,
      submitted_at: new Date().toISOString(),
    })
  }
  return { ok: true, message: null }
}

export async function getMyVotes(attendeeCode) {
  return inMemoryVotes
    .filter(v => v.attendee_code === attendeeCode)
    .map(v => ({ poster_number: v.poster_number, rank: v.rank }))
    .sort((a, b) => a.rank - b.rank)
}

function recomputeTallies() {
  // Demo doesn't need to recompute — we use the static snapshots so the results
  // screen renders the historically-true winners. If we ever want the viewer's
  // own votes to affect results, we can swap this to a live tally.
  return { distinguished: staticTallyVotes, peer: staticTallyStudentVotes }
}

export async function tallyVotes() { return recomputeTallies().distinguished }
export async function tallyStudentVotes() { return recomputeTallies().peer }

export async function getStats() {
  const attendees = staticAttendees.length
  const visits = inMemoryVisits.length
  const votes = inMemoryVotes.length
  const voters = new Set(inMemoryVotes.map(v => v.attendee_code)).size
  // Return both naming conventions — some views read snake_case, others
  // camelCase (confirm.js uses totalVisits / voters).
  return {
    total_attendees: attendees, attendees,
    total_visits: visits,       totalVisits: visits,
    total_votes: votes,         totalVotes: votes,
    total_voters: voters,       voters,
  }
}

export async function getRecentActivity(limit = 20) {
  const items = []
  for (const v of inMemoryVisits.slice(-20)) {
    const a = staticAttendees.find(x => x.code === v.attendee_code)
    items.push({
      type: 'visit', time: v.visited_at, attendee_code: v.attendee_code,
      attendee_name: a?.name || null, attendee_role: a?.role || null,
      poster_number: v.poster_number,
    })
  }
  items.sort((a, b) => new Date(b.time) - new Date(a.time))
  return items.slice(0, limit)
}

export async function getVisitLeaderboard() {
  const counts = {}
  for (const { attendee_code } of inMemoryVisits) {
    counts[attendee_code] = (counts[attendee_code] || 0) + 1
  }
  return Object.values(counts).sort((a, b) => a - b)
}

export async function setEventPhase() { return true }
export async function updateSchedule() { return true }

// Admin/board methods — stubbed with realistic demo data.
export async function getAllVisitCounts() {
  const counts = {}
  for (const v of inMemoryVisits) {
    counts[v.poster_number] = (counts[v.poster_number] || 0) + 1
  }
  return counts
}
export async function getAllAttendees() {
  return staticAttendees.map(a => ({ ...a, checked_in_at: a.checked_in_at || null }))
}
export async function getVoterCodes() {
  return Array.from(new Set(inMemoryVotes.map(v => v.attendee_code)))
}
export async function updateAttendeeName() { return true }
export async function adminTogglePoster() { return true }
export async function adminResetVotes() { return true }
export async function adminResetAttendeeVotes() { return true }
export async function resetAttendeeVotes() { return true }
export async function togglePosterActive() { return true }
export async function updatePoster() { return true }
export async function getBoardMemberData() { return {} }

// Check-in RPCs — stubbed; demo doesn't go through /checkin.
export async function createWalkupAttendee() { return { ok: false, error: { message: 'demo mode' } } }
export async function searchAttendeesForCheckin() { return { ok: false, results: [], error: { message: 'demo mode' } } }
export async function getTodayCheckins() { return [] }
