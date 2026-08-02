import { z } from 'zod'

// A completed practice attempt. Transcript + word timestamps are produced by the
// client's live streaming STT (AssemblyAI over a websocket) and posted here as
// JSON. The server still does all grading — it never trusts any client scores.
export const practiceSessionSchema = z
  .object({
    source: z.enum(['library', 'custom']),
    paragraphId: z.string().max(120).optional(),
    customText: z.string().min(1).max(5000).optional(),
    mode: z.enum(['audio', 'video']).default('audio'),
    timed: z.boolean().default(false),
    prepSeconds: z.number().int().min(0).max(3600).optional(),
    durationSeconds: z.number().int().positive().max(3600),
    transcript: z.string().min(1).max(20000),
    // Word timestamps (seconds) for pause detection — optional, capped to avoid abuse.
    words: z
      .array(
        z.object({
          word: z.string().max(80),
          start: z.number().nonnegative(),
          end: z.number().nonnegative(),
        })
      )
      .max(5000)
      .optional(),
  })
  // Conditional requirements: a library session needs a paragraphId; a custom
  // session needs the user's own text to grade against.
  .superRefine((val, ctx) => {
    if (val.source === 'library' && !val.paragraphId) {
      ctx.addIssue({ code: 'custom', path: ['paragraphId'], message: 'paragraphId is required for library sessions' })
    }
    if (val.source === 'custom' && !val.customText) {
      ctx.addIssue({ code: 'custom', path: ['customText'], message: 'customText is required for custom sessions' })
    }
  })
