import { env } from '../config/env.js'

// ── Speech-to-Text: Groq Whisper (authoritative transcript) ──────────────────
//
// Flow:  audio buffer  ->  Groq Whisper (whisper-large-v3-turbo)  ->  { transcript, words[] }
//
// We send the recorded audio to Groq's OpenAI-compatible transcription endpoint,
// ask for verbose_json + WORD-level timestamps, and return a clean shape our
// scoring service can use. Audio is transient: we transcribe and discard it,
// never storing it anywhere.
//
// Best-effort, like aiCoach: this THROWS on any network/API error, and the
// caller decides how to degrade (fall back to the client's Web Speech transcript).

const GROQ_TRANSCRIPTIONS_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3-turbo'

// Transcribe one recorded attempt.
//   audioBuffer : Buffer   (raw bytes from the upload)
//   filename    : string   (MUST carry the real extension, e.g. "attempt.webm" —
//                           Groq detects the audio format from this extension)
//   mimetype    : string   (e.g. "audio/webm")
// Returns: { transcript: string, words: Array<{ word, start, end }> }
export async function transcribeAudio({ audioBuffer, filename, mimetype }) {
  const form = new FormData()
  // The filename (with extension) is what lets Groq detect the format — without a
  // correct extension the API rejects the file even if the bytes are valid.
  form.append('file', new Blob([audioBuffer], { type: mimetype || 'audio/webm' }), filename || 'attempt.webm')
  form.append('model', WHISPER_MODEL)
  form.append('response_format', 'verbose_json') // needed to get any timestamps
  form.append('timestamp_granularities[]', 'word') // ask specifically for word-level

  // Note: we do NOT set Content-Type ourselves — fetch adds the correct multipart
  // boundary automatically when the body is a FormData.
  const res = await fetch(GROQ_TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: form,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq transcription failed (${res.status}): ${detail.slice(0, 300)}`)
  }

  const data = await res.json()
  // Map to our own shape so the raw Groq response never leaks past this service.
  const words = Array.isArray(data.words)
    ? data.words.map((w) => ({ word: w.word, start: w.start, end: w.end }))
    : []
  return { transcript: (data.text ?? '').trim(), words }
}
