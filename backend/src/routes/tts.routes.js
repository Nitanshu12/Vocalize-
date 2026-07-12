import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { greeting } from '../controllers/tts.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// TTS calls burn ElevenLabs free-tier quota, so cap them tightly per IP —
// the greeting only needs to play a handful of times per onboarding.
const ttsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many audio requests, try again later' },
})

router.post('/greeting', ttsLimiter, authenticate, greeting)

export default router
