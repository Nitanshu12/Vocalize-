import {
  getInterviewTypes,
  startInterview,
  submitAnswer,
  saveInterviewResult,
  listInterviewSessions,
} from '../services/interview.service.js'

// The interview catalogue (browser-safe) — powers the setup + brief screens.
export async function listTypes(req, res, next) {
  try {
    const types = await getInterviewTypes()
    res.json({ types })
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
export async function start(req, res, next) {
  try {
    const data = await startInterview(req.body.typeId, req.body.language)
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
