import { env } from '../config/env.js'

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

// Turn a piece of text into spoken MP3 audio using ElevenLabs.
// Returns a Buffer of MP3 bytes; the caller decides what to do with it.
// The API key never leaves the backend — it's read from env here, not passed in.
export async function synthesizeSpeech(text) {
  const res = await fetch(`${ELEVENLABS_URL}/${env.ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      // Multilingual model handles Indian names + English well.
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    // Bubble up a readable error so the controller can log it and return 502.
    const detail = await res.text().catch(() => '')
    throw new Error(`ElevenLabs request failed (${res.status}): ${detail.slice(0, 300)}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
