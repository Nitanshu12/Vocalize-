import { ChatGroq } from '@langchain/groq'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { env } from '../config/env.js'

// ── The AI Coach: a small LangChain chain ────────────────────────────────────
//
// Flow:  prompt template  ->  ChatGroq (LLM)  ->  structured output parser
//
// We do NOT ask the model for free-form text and then parse it. Instead we bind
// a Zod schema with `.withStructuredOutput`, which makes Groq return data that
// already matches this exact shape (via tool calling). That's why the model must
// support tool calling — see GROQ_MODEL in env.js.

// The shape of the coaching feedback we store and show. `.describe(...)` text is
// sent to the model as field instructions, so it doubles as documentation.
const feedbackSchema = z.object({
  headline: z.string().describe('One warm, encouraging sentence summarising the delivery'),
  strengths: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe('1-3 specific things the speaker did well, grounded in the transcript/metrics'),
  improvements: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe('1-3 specific, actionable things to improve — kind, never harsh'),
  nextTip: z.string().describe('One concrete tip to try on the very next attempt'),
})

// Build the chain once at module load (cheap, reusable across requests).
const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: env.GROQ_MODEL,
  temperature: 0.4, // low-ish: consistent, grounded feedback rather than creative
})

const structuredModel = model.withStructuredOutput(feedbackSchema, { name: 'speech_feedback' })

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are Vocalize, a warm and encouraging speech coach.
You help people practice speaking (interviews, presentations, public speaking).
Base every point ONLY on the transcript and metrics you are given — never invent details.
Be specific and kind. Keep each item to a single short sentence.
The speaker is practising this kind of content: {contextLine}`,
  ],
  [
    'human',
    `Here is my practice attempt.

What I was supposed to say (reference):
"""{reference}"""

What I actually said (transcript):
"""{transcript}"""

My measured metrics this attempt:
{metricsLine}

Please coach me.`,
  ],
])

const chain = prompt.pipe(structuredModel)

// Turn a paragraph context object into a one-line description for the prompt.
function describeContext(context) {
  if (context?.kind === 'library') {
    const bits = [context.category, context.difficulty].filter(Boolean).join(', ')
    return `a ${bits || 'practice'} exercise${context.title ? ` ("${context.title}")` : ''}`
  }
  return 'their own custom script'
}

// Render metrics as a compact, model-friendly bullet list.
function describeMetrics(metrics) {
  const lines = [
    `- Words per minute: ${metrics.wpm}`,
    `- Filler words used: ${metrics.fillerCount}`,
    `- Overall score: ${metrics.overallScore}/100`,
  ]
  if (metrics.longPauses !== null && metrics.longPauses !== undefined) {
    lines.push(`- Long pauses (>1.5s) mid-speech: ${metrics.longPauses}`)
  }
  if (metrics.coveragePct !== null && metrics.coveragePct !== undefined) {
    lines.push(`- Coverage of the reference: ${metrics.coveragePct}%`)
  }
  if (metrics.keyphraseHitPct !== null && metrics.keyphraseHitPct !== undefined) {
    lines.push(`- Key phrases hit: ${metrics.keyphraseHitPct}%`)
  }
  return lines.join('\n')
}

// Generate structured coaching feedback for one attempt. Returns an object
// matching `feedbackSchema`. Throws on any LLM/network error — the caller
// decides how to degrade (we save the session without feedback rather than fail).
export async function generateCoachFeedback({ transcript, reference, metrics, context }) {
  return chain.invoke({
    contextLine: describeContext(context),
    reference,
    transcript,
    metricsLine: describeMetrics(metrics),
  })
}
