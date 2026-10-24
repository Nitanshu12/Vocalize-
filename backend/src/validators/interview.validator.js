import { z } from 'zod'

export const startInterviewSchema = z.object({
  typeId: z.string().min(1, 'typeId is required'),
  language: z.enum(['en', 'hi']).default('en'),
})

export const answerSchema = z.object({
  threadId: z.string().min(1, 'threadId is required'),
  answer: z.string().min(1, 'answer is required').max(10000),
})
