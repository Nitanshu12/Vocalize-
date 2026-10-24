import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import {
  show,
  updateTrack,
  remove,
  fromGuided,
  fromResume,
  resumeUpload,
} from '../controllers/profile.controller.js'
import { validate } from '../middleware/validate.js'
import { guidedSchema, trackSchema } from '../validators/profile.validator.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// Profile extraction runs a Groq call per request, so it gets a much tighter
// budget than the read routes. A user legitimately builds their profile a
// handful of times, not hundreds.
const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many profile updates — try again shortly' },
})

/**
 * Multer rejects oversized or malformed uploads by throwing, which would
 * otherwise surface as an opaque 500. Translating it here keeps the failure
 * actionable for the person who picked the wrong file.
 */
function handleResumeUpload(req, res, next) {
  resumeUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'That file is larger than 5 MB — please upload a smaller resume.'
          : 'We could not read that upload. Please try a different file.'
      return res.status(400).json({ error: 'ValidationError', message })
    }
    if (err) return next(err)
    next()
  })
}

router.get('/', authenticate, show)
router.put('/track', authenticate, validate(trackSchema), updateTrack)
router.post('/guided', authenticate, extractLimiter, validate(guidedSchema), fromGuided)
router.post('/resume', authenticate, extractLimiter, handleResumeUpload, fromResume)
router.delete('/', authenticate, remove)

export default router
