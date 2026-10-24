import { pool } from '../../../Database/postgres.js'
import { callPythonService, uploadToPythonService } from './pythonClient.js'

/*
 * Candidate profiles — the background the interviewer "reads" before the call.
 *
 * Division of labour with the Python service:
 *   Python  parses (PDF -> text -> LLM -> structured profile) and forgets.
 *   Node    owns the database, the user's identity, and the privacy rules.
 *
 * That split means personal data lives in exactly one system of record, which
 * is what makes "delete my data" a single DELETE instead of a hunt.
 */

export const TRACKS = ['school', 'college', 'professional']
export const DEFAULT_TRACK = 'college'

// Children's resumes are not something we want to hold, and the guided path
// captures everything the interview actually needs. Enforced server-side so it
// cannot be bypassed by a crafted request.
const TRACKS_WITHOUT_RESUME = new Set(['school'])

export function resumeAllowed(track) {
  return !TRACKS_WITHOUT_RESUME.has(track ?? DEFAULT_TRACK)
}

function rowToProfile(row) {
  if (!row) return null
  return {
    source: row.source,
    completeness: row.completeness,
    updatedAt: row.updated_at,
    headline: row.headline ?? '',
    goal: row.goal ?? '',
    education: row.education ?? [],
    experiences: row.experiences ?? [],
    projects: row.projects ?? [],
    skills: row.skills ?? [],
    talking_points: row.talking_points ?? [],
  }
}

/** The user's track plus their profile (null when they haven't made one). */
export async function getProfile(userId) {
  const { rows } = await pool.query(
    `select u.track,
            p.source, p.headline, p.goal, p.education, p.experiences,
            p.projects, p.skills, p.talking_points, p.completeness, p.updated_at
     from users u
     left join user_profiles p on p.user_id = u.id
     where u.id = $1`,
    [userId]
  )
  const row = rows[0]
  if (!row) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  return {
    track: row.track ?? DEFAULT_TRACK,
    profile: row.source ? rowToProfile(row) : null,
  }
}

/**
 * The brief handed to the interview agent. Strips the bookkeeping fields
 * (source/completeness/updatedAt) the prompt has no use for — every token we
 * send costs money and dilutes the model's attention.
 */
export async function getInterviewBrief(userId) {
  const { profile } = await getProfile(userId)
  if (!profile) return null
  const { source, completeness, updatedAt, ...brief } = profile
  return brief
}

export async function setTrack(userId, track) {
  const next = TRACKS.includes(track) ? track : DEFAULT_TRACK
  await pool.query('update users set track = $2, updated_at = now() where id = $1', [userId, next])
  return next
}

/**
 * Upsert the profile. One row per user: re-uploading a resume replaces the old
 * brief rather than accumulating history, which keeps "what does the system
 * know about me" a question with a single, showable answer.
 */
export async function saveProfile(userId, { source, profile, completeness }) {
  const { rows } = await pool.query(
    `insert into user_profiles
       (user_id, source, headline, goal, education, experiences, projects,
        skills, talking_points, completeness)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (user_id) do update set
       source = excluded.source,
       headline = excluded.headline,
       goal = excluded.goal,
       education = excluded.education,
       experiences = excluded.experiences,
       projects = excluded.projects,
       skills = excluded.skills,
       talking_points = excluded.talking_points,
       completeness = excluded.completeness,
       updated_at = now()
     returning source, headline, goal, education, experiences, projects,
               skills, talking_points, completeness, updated_at`,
    [
      userId,
      source,
      profile.headline ?? '',
      profile.goal ?? '',
      JSON.stringify(profile.education ?? []),
      JSON.stringify(profile.experiences ?? []),
      JSON.stringify(profile.projects ?? []),
      JSON.stringify(profile.skills ?? []),
      JSON.stringify(profile.talking_points ?? []),
      completeness ?? 0,
    ]
  )
  return rowToProfile(rows[0])
}

export async function deleteProfile(userId) {
  await pool.query('delete from user_profiles where user_id = $1', [userId])
}

/* ---------------------------- extraction paths ---------------------------- */

/** Resume upload -> parsed brief -> saved. Never persists the raw file or text. */
export async function buildFromResume(userId, file) {
  const parsed = await uploadToPythonService('/profile/parse-resume', {
    buffer: file.buffer,
    filename: file.originalname,
    mimetype: file.mimetype,
  })
  return saveProfile(userId, parsed)
}

/** Four plain-language answers -> parsed brief -> saved. */
export async function buildFromGuided(userId, answers, track) {
  const parsed = await callPythonService(
    `/profile/guided?track=${encodeURIComponent(track ?? DEFAULT_TRACK)}`,
    { method: 'POST', body: answers }
  )
  return saveProfile(userId, parsed)
}
