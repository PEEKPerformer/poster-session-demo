// Static data module — used when no Supabase is configured (archive mode)
// These are frozen snapshots from the NERPG Spring 2026 event.

import posters from './posters.json'
import attendees from './attendees.json'
import eventState from './event_state.json'
import tallyVotesData from './tally_votes.json'
import tallyStudentVotesData from './tally_student_votes.json'
import visits from './visits.json'
import votes from './votes.json'

export const staticPosters = posters
export const staticAttendees = attendees
export const staticEventState = eventState[0]
export const staticTallyVotes = tallyVotesData
export const staticTallyStudentVotes = tallyStudentVotesData
export const staticVisits = visits
export const staticVotes = votes
