import { getParagraphs, toPublicParagraph } from '../data/paragraphs.js'
import {
  recordPracticeSession,
  listSessions,
  getDashboardStats,
} from '../services/practice.service.js'
import { createStreamingToken } from '../services/stt.service.js'

// The curated library — stripped of scoring metadata before it leaves the server.
export function listParagraphs(req, res) {
  const paragraphs = getParagraphs().map(toPublicParagraph)
  res.json({ paragraphs })
}

// Mint a short-lived AssemblyAI streaming token for the browser's websocket.
export async function streamingToken(req, res, next) {
  try {
    const token = await createStreamingToken()
    res.json(token)
  } catch (err) {
    err.status = err.status ?? 502
    next(err)
  }
}

// Grade + save a completed attempt (transcript + word timestamps come from the
// client's streaming STT), then return the scored session, the user's updated
// points/streak, and the AI-coach status.
export async function createSession(req, res, next) {
  try {
    const result = await recordPracticeSession(req.user.id, req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

// Recent history — capped to 5 on the free tier.
export async function history(req, res, next) {
  try {
    const sessions = await listSessions(req.user.id, 5)
    res.json({ sessions })
  } catch (err) {
    next(err)
  }
}

// Everything the dashboard needs (points, streak, level/XP, week, totals).
export async function stats(req, res, next) {
  try {
    const data = await getDashboardStats(req.user.id)
    if (!data) return res.status(404).json({ error: 'NotFound', message: 'User no longer exists' })
    res.json(data)
  } catch (err) {
    next(err)
  }
}
