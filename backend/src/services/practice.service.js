import { pool } from '../../../Database/postgres.js'
import { getParagraphById } from '../data/paragraphs.js'
import { scoreSession, computePoints } from './scoring.service.js'
import { generateCoachFeedback } from './aiCoach.service.js'
import { semanticCoverage } from './embedding.service.js'
import { levelFromPoints } from './gamification.service.js'


const FREE_AI_SESSIONS = 3

// Columns we return to the client for any session row. Kept in one place so the
// insert and the history query stay in sync.
const SESSION_COLUMNS = `id, source, paragraph_id, mode, timed, prep_seconds,
  duration_seconds, transcript, wpm, filler_count, coverage_pct,
  keyphrase_hit_pct, long_pauses, overall_score, points_earned, ai_feedback,
  created_at`

// Build the reference (text + grading targets) AND a small context object for
// the AI coach. Library sessions pull the curated paragraph; custom sessions
// grade against the user's own text.
function resolveReference({ source, paragraphId, customText }) {
  if (source === 'library') {
    const para = getParagraphById(paragraphId)
    if (!para) {
      const err = new Error('Unknown paragraph')
      err.status = 400
      throw err
    }
    return {
      reference: {
        text: para.text,
        keyPhrases: para.keyPhrases,
        targetWpmMin: para.targetWpmMin,
        targetWpmMax: para.targetWpmMax,
        fillerWatch: para.fillerWatch,
      },
      context: {
        kind: 'library',
        title: para.title,
        category: para.category,
        difficulty: para.difficulty,
      },
    }
  }
  // custom: no curated key phrases, so keyphrase scoring is skipped and the
  // default pace band / filler list (from scoring.service) apply.
  return {
    reference: { text: customText, keyPhrases: null },
    context: { kind: 'custom' },
  }
}

// Move the user's gamification counters forward in one atomic UPDATE. Using
// Postgres `current_date` (not JS time) keeps the streak logic timezone-safe:
//   practiced today already  -> streak unchanged
//   practiced yesterday      -> streak + 1
//   otherwise (gap / first)  -> reset to 1
async function updateGamification(userId, points) {
  const streakExpr = `case
      when last_practice_date = current_date then current_streak
      when last_practice_date = current_date - 1 then current_streak + 1
      else 1
    end`
  const { rows } = await pool.query(
    `update users set
       total_points = total_points + $2,
       current_streak = ${streakExpr},
       longest_streak = greatest(longest_streak, ${streakExpr}),
       last_practice_date = current_date,
       updated_at = now()
     where id = $1
     returning total_points, current_streak, longest_streak, last_practice_date`,
    [userId, points]
  )
  return rows[0] ?? null
}

// Score a completed practice attempt, persist it, and advance the user's
// points/streak — returning the saved session, the fresh counters, and the
// AI-coach status (whether feedback was generated, locked behind premium, or
// failed). The AI call is best-effort: if it errors, we still save the session.
export async function recordPracticeSession(userId, input) {
  const { reference, context } = resolveReference(input)

  // The transcript + word timestamps come from the client's live streaming STT
  // (AssemblyAI over a websocket). No transcript -> nothing was captured.
  const transcript = (input.transcript ?? '').trim()
  const words = Array.isArray(input.words) ? input.words : []
  if (!transcript) {
    const err = new Error('No speech was captured')
    err.status = 422
    throw err
  }

  // Semantic coverage (embeddings) is best-effort: if the model can't run, we
  // fall back to literal LCS coverage inside scoreSession.
  let semanticCoveragePct = null
  try {
    semanticCoveragePct = await semanticCoverage(reference.text, transcript)
  } catch {
    // keep null -> literal coverage only
  }

  const metrics = scoreSession({
    transcript,
    durationSeconds: input.durationSeconds,
    reference,
    words,
    semanticCoveragePct,
  })
  const points = computePoints(metrics.overallScore, input.timed)

  // Gate the AI coach: free for the first N sessions, premium afterwards.
  const priorCount = await countSessions(userId)
  const aiEligible = priorCount < FREE_AI_SESSIONS
  let aiFeedback = null
  let aiError = false
  if (aiEligible) {
    try {
      aiFeedback = await generateCoachFeedback({
        transcript,
        reference: reference.text,
        metrics,
        context,
      })
    } catch {
      aiError = true // don't let a coach failure block saving the session
    }
  }

  const { rows } = await pool.query(
    `insert into practice_sessions
       (user_id, source, paragraph_id, custom_text, mode, timed, prep_seconds,
        duration_seconds, transcript, wpm, filler_count, coverage_pct,
        keyphrase_hit_pct, long_pauses, overall_score, points_earned, ai_feedback)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     returning ${SESSION_COLUMNS}`,
    [
      userId,
      input.source,
      input.paragraphId ?? null,
      input.customText ?? null,
      input.mode,
      input.timed,
      input.prepSeconds ?? null,
      input.durationSeconds,
      transcript,
      metrics.wpm,
      metrics.fillerCount,
      metrics.coveragePct,
      metrics.keyphraseHitPct,
      metrics.longPauses,
      metrics.overallScore,
      points,
      aiFeedback ? JSON.stringify(aiFeedback) : null,
    ]
  )

  const counters = await updateGamification(userId, points)

  // Level-up detection: compare the level BEFORE this session's points were
  // added against the level AFTER. The DB update returns the new total, so the
  // old total is simply (new total - points earned this session). Backend is the
  // single source of truth here — the client just plays the celebration.
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
    ai: {
      locked: !aiEligible, // true once the free allowance is used up (premium)
      error: aiError, // true if the coach call failed but the session still saved
      remainingFree: Math.max(0, FREE_AI_SESSIONS - priorCount - 1),
    },
  }
}

// Most recent sessions first. `limit` enforces the free-tier history cap.
export async function listSessions(userId, limit = 5) {
  const { rows } = await pool.query(
    `select ${SESSION_COLUMNS}
     from practice_sessions
     where user_id = $1
     order by created_at desc
     limit $2`,
    [userId, limit]
  )
  return rows
}

// How many sessions a user has completed — used later to gate the free AI-coach
// allowance (first 3 sessions free, then premium).
export async function countSessions(userId) {
  const { rows } = await pool.query(
    'select count(*)::int as count from practice_sessions where user_id = $1',
    [userId]
  )
  return rows[0].count
}

// Format a Date (or date-string) as a local YYYY-MM-DD key.
function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Everything the dashboard needs in one call: gamification counters, the derived
// level/XP, the last 7 days of activity (for the streak flames + "week as sound"
// waveform), and lifetime aggregates.
export async function getDashboardStats(userId) {
  const { rows: userRows } = await pool.query(
    `select total_points, current_streak, longest_streak, last_practice_date
     from users where id = $1`,
    [userId]
  )
  const u = userRows[0]
  if (!u) return null

  // Points/sessions per day over the last 7 days; gaps are filled with zero below.
  const { rows: dailyRows } = await pool.query(
    `select created_at::date as date, sum(points_earned)::int as points, count(*)::int as sessions
     from practice_sessions
     where user_id = $1 and created_at >= current_date - 6
     group by created_at::date`,
    [userId]
  )
  const byDate = new Map(dailyRows.map((r) => [toISODate(r.date), r]))
  const week = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toISODate(d)
    const row = byDate.get(key)
    week.push({ date: key, points: row?.points ?? 0, sessions: row?.sessions ?? 0 })
  }

  const { rows: aggRows } = await pool.query(
    `select count(*)::int as total_sessions,
            coalesce(max(overall_score), 0)::int as best_score,
            coalesce(round(avg(wpm)), 0)::int as avg_wpm
     from practice_sessions where user_id = $1`,
    [userId]
  )
  const agg = aggRows[0]

  return {
    points: u.total_points,
    currentStreak: u.current_streak,
    longestStreak: u.longest_streak,
    level: levelFromPoints(u.total_points),
    week,
    totals: {
      totalSessions: agg.total_sessions,
      bestScore: agg.best_score,
      avgWpm: agg.avg_wpm,
    },
  }
}
