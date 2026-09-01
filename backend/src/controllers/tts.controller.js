import { findUserById } from '../services/auth.service.js'
import { synthesizeSpeech } from '../services/tts.service.js'

// Builds the personalised onboarding greeting and returns it as MP3 audio.
// The name comes from the authenticated user in the DB — never from the client —
// so nobody can spend our ElevenLabs quota on arbitrary text.
export async function greeting(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'NotFound', message: 'User no longer exists' })
    }

    const firstName = user.name?.trim().split(/\s+/)[0] || 'there'
    const text = `Hello ${firstName}. Welcome to the Vocalize community. Before we begin your journey, let's get to know you a little.`

    const audio = await synthesizeSpeech(text)

    res.set('Content-Type', 'audio/mpeg')
    res.set('Cache-Control', 'no-store')
    res.send(audio)
  } catch (err) {
    // A failure here is an upstream (ElevenLabs) problem, not a client error.
    err.status = err.status ?? 502
    next(err)
  }
}

// Speaks an arbitrary short line — used by the interviewer's voice. The text is
// the AI-generated question our own agent produced, but since it arrives from
// the client we cap the length and rate-limit the route to bound ElevenLabs
// quota abuse.
export async function speak(req, res, next) {
  try {
    const text = (req.body?.text ?? '').toString().trim().slice(0, 800)
    if (!text) {
      return res.status(400).json({ error: 'ValidationError', message: 'text is required' })
    }
    const audio = await synthesizeSpeech(text)
    res.set('Content-Type', 'audio/mpeg')
    res.set('Cache-Control', 'no-store')
    res.send(audio)
  } catch (err) {
    err.status = err.status ?? 502
    next(err)
  }
}
