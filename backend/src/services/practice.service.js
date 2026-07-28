import { pool } from '../../../Database/postgres.js'
import { getParagraphById } from '../data/paragraphs.js'
import { scoreSession, computePoints } from './scoring.service.js'
import { generateCoachFeedback } from './aiCoach.service.js'
import { transcribeAudio } from './stt.service.js'
import { semanticCoverage } from './embedding.service.js'


const FREE_AI_SESSIONS = 3

// Columns we return to the client for any session row. Kept in one place so the
// insert and the history query stay in sync.
const SESSION_COLUMNS = `id, source, paragraph_id, mode, timed, prep_seconds,
  duration_seconds, transcript, wpm, filler_count, coverage_pct,
  keyphrase_hit_pct, long_pauses, overall_score, points_earned, ai_feedback,
  created_at`

// Get the authoritative transcript. We prefer Groq Whisper on the uploaded audio
// (accurate, keeps fillers, gives word timestamps); if that fails or there's no
// audio, we fall back to the client's live Web Speech transcript so a session is
// never lost to an STT hiccup.
async function resolveTranscript(input) {
  if (input.audio?.buffer?.length) {
    try {
      const stt = await transcribeAudio({
        audioBuffer: input.audio.buffer,
        filename: input.audio.filename,
        mimetype: input.audio.mimetype,
      })
      if (stt.transcript) return { transcript: stt.transcript, words: stt.words, source: 'whisper' }
    } catch (err) {
      // TEMP DEBUG — surface why Whisper failed before we fall back
      console.error('[STT] Whisper failed, falling back to client transcript:', err.message)
    }
  }
  const fallback = (input.clientTranscript ?? '').trim()
  return { transcript: fallback, words: [], source: fallback ? 'fallback' : 'none' }
}

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

  // Transcribe first (Whisper, with client-transcript fallback). No words -> no
  // speech was captured at all, so there's nothing to grade.
  const { transcript, words, source: transcriptSource } = await resolveTranscript(input)
  if (!transcript) {
    const err = new Error('No speech could be transcribed')
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

  // TEMP DEBUG — diagnosing filler/pause capture. Remove once resolved.
  console.log('[practice debug]', {
    hasAudio: Boolean(input.audio?.buffer?.length),
    transcriptSource, // 'whisper' = good; 'fallback'/'none' = Whisper didn't run
    words: words.length, // 0 = no word timestamps (fillers/pauses can't be measured well)
    fillerCount: metrics.fillerCount,
    longPauses: metrics.longPauses,
    transcriptSnippet: transcript.slice(0, 200), // do the words "um/uh" appear at all?
  })

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

  const gamification = await updateGamification(userId, points)
  return {
    session: rows[0],
    gamification,
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
