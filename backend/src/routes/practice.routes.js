import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  listParagraphs,
  createSession,
  history,
  stats,
  streamingToken,
} from '../controllers/practice.controller.js'
import { validate } from '../middleware/validate.js'
import { practiceSessionSchema } from '../validators/practice.validator.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// Submitting a session runs scoring + an LLM coach call. Cap per-IP submissions
// to protect free-tier quotas downstream.
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many sessions' },
})

// Minting streaming tokens hits AssemblyAI, so rate-limit it per IP too.
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many token requests' },
})

router.get('/paragraphs', authenticate, listParagraphs)
router.get('/streaming-token', authenticate, tokenLimiter, streamingToken)
router.post('/sessions', authenticate, sessionLimiter, validate(practiceSessionSchema), createSession)
router.get('/sessions', authenticate, history)
router.get('/stats', authenticate, stats)

export default router
