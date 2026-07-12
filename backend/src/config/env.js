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
  // Default is ElevenLabs' stock "Rachel" voice — override in .env to change it.
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
})

export const env = schema.parse(process.env)
