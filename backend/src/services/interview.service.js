import { env } from '../config/env.js'
import { pool } from '../../../Database/postgres.js'
import { levelFromPoints } from './gamification.service.js'
import { updateGamification } from './practice.service.js'

// Thin client for the Python interview-service. Every call adds the shared
// internal key so the Python side knows the request came from this gateway.
// Errors are normalised: 400/404 pass through, everything else (incl. the
// service being down) becomes a 502 so the client sees a clean "upstream" error.
async function callInterviewService(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${env.INTERVIEW_SERVICE_URL}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(env.INTERNAL_API_KEY ? { 'X-Internal-Key': env.INTERNAL_API_KEY } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error('Interview service is unavailable')
    err.status = 502
    throw err
  }

  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.detail ?? ''
    } catch {
      // non-JSON error body — ignore
    }
    const err = new Error(detail || `Interview service error (${res.status})`)
    err.status = res.status === 400 || res.status === 404 ? res.status : 502
    throw err
  }
  return res.json()
}

export function getInterviewTypes() {
  return callInterviewService('/interview/types')
}

export function startInterview(typeId, language) {
  return callInterviewService('/interview/start', {
    method: 'POST',
    body: { typeId, language },
  })
}

export function submitAnswer(threadId, answer) {
  return callInterviewService('/interview/answer', {
    method: 'POST',
    body: { threadId, answer },
  })
}

// Points for a finished interview: score/100 mapped to ~0-10, matching the
// practice-mode scale so both feed the same Speaker's Journey levels.
function pointsForInterview(overallScore) {
  return Math.round((overallScore ?? 0) / 10)
}

// Persist a completed interview + advance the user's gamification counters.
// `report` is the self-describing scorecard from the Python agent (it carries
// typeId + language), so no extra client input is needed. Returns the saved row
// and the fresh gamification state incl. a level-up flag for the celebration.
export async function saveInterviewResult(userId, report) {
  const points = pointsForInterview(report.overallScore)

  const { rows } = await pool.query(
    `insert into interview_sessions
       (user_id, type_id, language, overall_score, overall_out_of_5,
        competencies, coach, points_earned)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id, type_id, overall_score, points_earned, created_at`,
    [
      userId,
      report.typeId,
      report.language ?? 'en',
      report.overallScore,
      report.overallOutOf5 ?? null,
      JSON.stringify(report.competencies ?? []),
      report.coach ? JSON.stringify(report.coach) : null,
      points,
    ]
  )

  const counters = await updateGamification(userId, points)
  const newTotal = counters?.total_points ?? points
  const currentLevel = levelFromPoints(newTotal)
  const previousLevel = levelFromPoints(newTotal - points)
  const leveledUp = currentLevel.level > previousLevel.level

  return {
    session: rows[0],
    gamification: {
      ...counters,
      level: currentLevel,
      leveledUp,
      previousLevelNumber: leveledUp ? previousLevel.level : null,
      pointsEarned: points,
    },
  }
}

// Recent interviews for the dashboard's activity feed (most recent first).
export async function listInterviewSessions(userId, limit = 5) {
  const { rows } = await pool.query(
    `select id, type_id, overall_score, points_earned, created_at
     from interview_sessions
     where user_id = $1
     order by created_at desc
     limit $2`,
    [userId, limit]
  )
  return rows
}
