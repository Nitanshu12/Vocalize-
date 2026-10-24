import { z } from 'zod'

export const trackSchema = z.object({
  track: z.enum(['school', 'college', 'professional']),
})

// Every field is optional, but at least one must carry real text — otherwise we
// would spend a model call turning four empty strings into an empty profile.
export const guidedSchema = z
  .object({
    studying_or_working: z.string().max(2000).default(''),
    experience: z.string().max(2000).default(''),
    skills: z.string().max(2000).default(''),
    goal: z.string().max(2000).default(''),
  })
  .refine(
    (v) => [v.studying_or_working, v.experience, v.skills, v.goal].some((s) => s.trim().length > 0),
    { message: 'Please answer at least one question.' }
  )
