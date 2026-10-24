import {
  getInterviewTypes,
  startInterview,
  submitAnswer,
  saveInterviewResult,
  listInterviewSessions,
} from '../services/interview.service.js'
import { getProfile, getInterviewBrief } from '../services/profile.service.js'

// The interview catalogue (browser-safe) — powers the setup + brief screens.
// Narrowed to the user's track, so the rounds on offer match who they are.
export async function listTypes(req, res, next) {
  try {
    const { track } = await getProfile(req.user.id)
    const types = await getInterviewTypes(track)
    res.json({ types, track })
  } catch (err) {
    next(err)
  }
}

// Recent interviews for the dashboard activity feed.
export async function history(req, res, next) {
  try {
    const sessions = await listInterviewSessions(req.user.id, 5)
    res.json({ sessions })
  } catch (err) {
    next(err)
  }
}

// Begin an interview — returns { threadId, question } (the opening line).
// The candidate brief is fetched server-side from our own database, never taken
// from the request body: the browser cannot invent a background for itself.
// A missing profile is fine — the agent falls back to generic questions.
export async function start(req, res, next) {
  try {
    const profile = await getInterviewBrief(req.user.id)
    const data = await startInterview(req.body.typeId, req.body.language, profile)
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

// Submit one answer — returns the next { question }, or on the final turn
// { done, report } enriched with the saved session + gamification (points,
// level, level-up flag) so the client can celebrate and refresh the journey.
export async function answer(req, res, next) {
  try {
    const data = await submitAnswer(req.body.threadId, req.body.answer)
    if (data?.done && data.report) {
      try {
        const saved = await saveInterviewResult(req.user.id, data.report)
        return res.json({ ...data, gamification: saved.gamification, sessionId: saved.session.id })
      } catch {
        // Persistence/gamification failed — still return the report so the user
        // sees their result; the score just won't count toward their journey.
        return res.json({ ...data, saveFailed: true })
      }
    }
    res.json(data)
  } catch (err) {
    next(err)
  }
}
