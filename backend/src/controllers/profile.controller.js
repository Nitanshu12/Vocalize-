import multer from 'multer'
import {
  getProfile,
  setTrack,
  deleteProfile,
  buildFromResume,
  buildFromGuided,
  resumeAllowed,
} from '../services/profile.service.js'

/*
 * Uploads are held in MEMORY, never written to disk.
 *
 * A resume is small and short-lived here: we forward the buffer to the Python
 * parser and drop it. Nothing on disk means no stray PII to clean up, no
 * temp-file permissions to get wrong, and nothing left behind if the process
 * dies mid-request. The 5 MB cap matches the parser's own limit so an oversized
 * file is rejected before it crosses the network a second time.
 */
export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('resume')

export async function show(req, res, next) {
  try {
    res.json(await getProfile(req.user.id))
  } catch (err) {
    next(err)
  }
}

export async function updateTrack(req, res, next) {
  try {
    res.json({ track: await setTrack(req.user.id, req.body.track) })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteProfile(req.user.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function fromGuided(req, res, next) {
  try {
    const { track } = await getProfile(req.user.id)
    res.status(201).json({ profile: await buildFromGuided(req.user.id, req.body, track) })
  } catch (err) {
    next(err)
  }
}

export async function fromResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ValidationError', message: 'No resume file received' })
    }
    // Enforced here, not just hidden in the UI: a school account cannot upload a
    // resume even with a hand-crafted request.
    const { track } = await getProfile(req.user.id)
    if (!resumeAllowed(track)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Resume upload is not available on this account — use the quick questions instead.',
      })
    }
    res.status(201).json({ profile: await buildFromResume(req.user.id, req.file) })
  } catch (err) {
    next(err)
  }
}
