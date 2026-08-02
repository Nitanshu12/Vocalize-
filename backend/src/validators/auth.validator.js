import { z } from 'zod'

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(80).optional(),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// Onboarding answers — fixed option sets so the DB only ever holds known values.
export const onboardingSchema = z.object({
  practice_goal: z.enum(['interview', 'presentation', 'public_speaking']),
  confidence_level: z.enum(['low', 'medium', 'high']),
  weekly_time_commitment: z.enum(['casual', 'regular', 'intense']),
})
