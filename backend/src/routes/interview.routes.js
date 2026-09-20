import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { listTypes, start, answer, history } from '../controllers/interview.controller.js'
import { validate } from '../middleware/validate.js'
import { startInterviewSchema, answerSchema } from '../validators/interview.validator.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// Each start/answer runs LangGraph + Groq calls, so cap per-IP to protect the
// free-tier token quota downstream.
const interviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many interview requests' },
})

router.get('/types', authenticate, listTypes)
router.get('/sessions', authenticate, history)
router.post('/start', authenticate, interviewLimiter, validate(startInterviewSchema), start)
router.post('/answer', authenticate, interviewLimiter, validate(answerSchema), answer)

export default router
