import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, refresh, logout, me, onboarding } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema, onboardingSchema } from '../validators/auth.validator.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// Protects the free-tier posture of the whole app: caps brute-force and
// signup-spam attempts per IP, independent of any per-user limits added later.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many attempts, try again later' },
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, me)
router.patch('/onboarding', authenticate, validate(onboardingSchema), onboarding)

export default router
