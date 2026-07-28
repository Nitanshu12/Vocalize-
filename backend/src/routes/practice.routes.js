import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { listParagraphs, createSession, history } from '../controllers/practice.controller.js'
import { validate } from '../middleware/validate.js'
import { practiceSessionSchema } from '../validators/practice.validator.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// Submitting a session runs scoring (and, later, an LLM coach call). Cap per-IP
// submissions to protect free-tier quotas downstream.
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many sessions' },
})

// Audio arrives as an in-memory upload (we transcribe then discard — never store
// it). Cap the size to protect free-tier quota and guard against huge uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — well above a few minutes of opus
})

router.get('/paragraphs', authenticate, listParagraphs)
// multer runs before validate so req.body (text fields) is populated for Zod.
router.post(
  '/sessions',
  authenticate,
  sessionLimiter,
  upload.single('audio'),
  validate(practiceSessionSchema),
  createSession
)
router.get('/sessions', authenticate, history)

export default router
