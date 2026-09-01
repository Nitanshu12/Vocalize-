import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  NODE_ENV: z.string().default('development'),
  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  // Default is ElevenLabs' "Sarah" voice (warm, reassuring) — works on the free
  // API tier. Override in .env with any voice_id from your account's voice list.
  ELEVENLABS_VOICE_ID: z.string().default('EXAVITQu4vr4xnSDxMaL'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  // Groq model that supports tool calling — required for LangChain's structured
  // (JSON) output. Groq retired the Llama-3.3 name; gpt-oss-20b is current, fast,
  // and tool-capable. Check /v1/models if this ever 404s ("model_not_found").
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
  // AssemblyAI powers the authoritative transcript: word timestamps + reliable
  // disfluency (um/uh) detection, which Whisper strips out.
  ASSEMBLYAI_API_KEY: z.string().min(1, 'ASSEMBLYAI_API_KEY is required'),
  // The Python interview-service (LangGraph agent). Node proxies to it; the
  // browser never calls it directly.
  INTERVIEW_SERVICE_URL: z.string().default('http://localhost:8000'),
  // Shared secret sent as X-Internal-Key so the Python service only answers Node.
  // Must match INTERNAL_API_KEY in interview-service/.env (leave blank in dev).
  INTERNAL_API_KEY: z.string().default(''),
})

export const env = schema.parse(process.env)
