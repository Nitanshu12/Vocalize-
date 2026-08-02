import { env } from '../config/env.js'

// ── Speech-to-Text: AssemblyAI real-time streaming (token minting) ────────────
//
// We use AssemblyAI's streaming (websocket) STT: the browser streams mic audio
// directly to AssemblyAI and gets a live transcript + word timestamps, so by the
// time the user finishes there's ~no extra wait.
//
// The browser can't hold our real API key, so it can't open that websocket by
// itself. Instead this backend mints a SHORT-LIVED streaming token with the real
// key; the browser uses that temporary token to open the socket. If the token
// leaks it expires in minutes and only works for streaming.

const STREAMING_TOKEN_URL = 'https://streaming.assemblyai.com/v3/token'

// Mint a temporary streaming token for the browser. Returns AssemblyAI's JSON,
// which includes `token` (and its expiry). Throws on failure.
export async function createStreamingToken(expiresInSeconds = 300) {
  const res = await fetch(`${STREAMING_TOKEN_URL}?expires_in_seconds=${expiresInSeconds}`, {
    headers: { authorization: env.ASSEMBLYAI_API_KEY },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AssemblyAI token request failed (${res.status}): ${detail.slice(0, 200)}`)
  }
  return res.json()
}
