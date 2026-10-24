import { callPythonService } from './pythonClient.js'
import { pool } from '../../../Database/postgres.js'
import { levelFromPoints } from './gamification.service.js'
import { updateGamification } from './practice.service.js'

// Rounds on offer for this user's track — a school user never sees an HR
// screening round, a graduate never sees the children's one.
export function getInterviewTypes(track) {
  const query = track ? `?track=${encodeURIComponent(track)}` : ''
  return callPythonService(`/interview/types${query}`)
}

// The candidate brief travels with the start call. It is read from OUR
// database rather than accepted from the browser, so a client cannot inject a
// fake background to fish for particular questions.
export function startInterview(typeId, language, profile = null) {
  return callPythonService('/interview/start', {
    method: 'POST',
    body: { typeId, language, profile },
  })
}

export function submitAnswer(threadId, answer) {
  return callPythonService('/interview/answer', {
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
