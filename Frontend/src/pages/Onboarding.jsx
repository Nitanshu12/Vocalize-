import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Volume2 } from 'lucide-react'
import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'

/* ------------------------------------------------------------------ *
 * The three profiling questions. Each `key` matches a DB column, and
 * each option's `value` matches the enum the backend validator accepts.
 * ------------------------------------------------------------------ */
const QUESTIONS = [
  {
    key: 'practice_goal',
    prompt: 'What do you most want to get better at?',
    options: [
      { value: 'interview', label: 'Interviews', hint: 'Answer with calm and clarity' },
      { value: 'presentation', label: 'Presentations', hint: 'Hold a room, land your points' },
      { value: 'public_speaking', label: 'Public speaking', hint: 'Speak to a crowd, confidently' },
    ],
  },
  {
    key: 'confidence_level',
    prompt: 'How does speaking out loud feel right now?',
    options: [
      { value: 'low', label: 'Nervous', hint: 'It makes me anxious' },
      { value: 'medium', label: 'Okay-ish', hint: 'Fine on good days' },
      { value: 'high', label: 'Confident', hint: 'I just want to sharpen it' },
    ],
  },
  {
    key: 'weekly_time_commitment',
    prompt: 'How much time can you give each week?',
    options: [
      { value: 'casual', label: 'A little', hint: 'A few minutes here and there' },
      { value: 'regular', label: 'Regular', hint: 'A short session most days' },
      { value: 'intense', label: 'All in', hint: 'I want to move fast' },
    ],
  },
]

const GOAL_TRACK = {
  interview: 'Interview Basics',
  presentation: 'Presentation Foundations',
  public_speaking: 'Stage Confidence',
}

const CONFIDENCE_TONE = {
  low: "we'll start gentle and build your footing first",
  medium: "we'll build steadily, session by session",
  high: "we'll push straight into the sharper stuff",
}

// Rule-based recommendation — reliable and instant. Later this message can be
// rewritten by an LLM for a more personal tone (that's a separate piece).
function getRecommendation(answers, firstName) {
  const track = GOAL_TRACK[answers.practice_goal] ?? 'Interview Basics'
  const tone = CONFIDENCE_TONE[answers.confidence_level] ?? CONFIDENCE_TONE.medium
  return {
    track,
    message: `${firstName}, based on what you told me, ${tone}. Let's begin with ${track}.`,
  }
}

/* A slim gamified progress bar that fills as the user moves through steps. */
function ProgressBar({ value }) {
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-1.5 bg-ink/5">
      <div
        className="h-full bg-brand-600 origin-left transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${value / 100})` }}
      />
    </div>
  )
}

/* A tappable answer chip. */
function OptionChip({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="option w-full px-6 py-5"
    >
      <span className="block font-display text-xl font-semibold text-ink">{option.label}</span>
      <span className="block text-sm text-ink-soft mt-1">{option.hint}</span>
    </button>
  )
}

export default function Onboarding() {
  const { user, completeOnboarding, fetchGreeting } = useAuth()
  const navigate = useNavigate()

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  // step 0 = welcome, 1..3 = questions, 4 = recommendation
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [speaking, setSpeaking] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const audioRef = useRef(null)
  const startedRef = useRef(false) // guards against React StrictMode double-fetch

  // On mount: fetch the personalised greeting and try to autoplay it.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let objectUrl
    fetchGreeting()
      .then((url) => {
        objectUrl = url
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onplay = () => setSpeaking(true)
        audio.onended = () => setSpeaking(false)
        audio.onpause = () => setSpeaking(false)
        // Autoplay usually works here because arriving from the signup click
        // gives the page user-activation. If a browser still blocks it, we show
        // a small replay control instead of failing silently.
        audio.play().catch(() => setAudioBlocked(true))
      })
      .catch(() => setAudioBlocked(true))

    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fetchGreeting])

  function replay() {
    if (!audioRef.current) return
    setAudioBlocked(false)
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => setAudioBlocked(true))
  }

  function chooseAnswer(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }))
    // Auto-advance — no "next" button needed, keeps the flow smooth and game-like.
    setTimeout(() => setStep((s) => s + 1), 260)
  }

  async function finish() {
    setSubmitting(true)
    setSubmitError('')
    try {
      await completeOnboarding(answers)
      navigate('/app')
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong, please try again.')
      setSubmitting(false)
    }
  }

  // Progress: welcome counts as the first filled segment, then each question.
  const progress = (step / (QUESTIONS.length + 1)) * 100

  return (
    <div className="relative min-h-screen bg-paper overflow-hidden flex items-center justify-center px-6">
      <ProgressBar value={progress} />

      {/* soft ambient glow, same motif as the hero */}

      <div className="relative w-full max-w-lg">
        {/* -------------------------------- WELCOME -------------------------------- */}
        {step === 0 && (
          <div key="welcome" className="text-center animate-fade-up">
            <div className="relative mx-auto mb-10 w-40 h-40 flex items-center justify-center">
              <span
                className={`absolute inset-0 rounded-full bg-brand-100 transition-transform duration-500 ${
                  speaking ? 'scale-100 animate-pulse' : 'scale-90'
                }`}
              />
              <span className="absolute inset-4 rounded-full bg-surface" />
              <WaveMark className="relative w-20 h-14 text-accent" animate={speaking} />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-5">
              Hello, {firstName}.
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-md mx-auto">
              Welcome to the Vocalize community. Before we begin your journey, let's get to know you
              with three quick questions.
            </p>

            {audioBlocked && (
              <button
                type="button"
                onClick={replay}
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 mb-8"
              >
                <Volume2 size={16} /> Tap to hear your welcome
              </button>
            )}

            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-primary btn-lg"
              >
                Let's begin <ArrowRight size={19} />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------- QUESTIONS -------------------------------- */}
        {step >= 1 && step <= QUESTIONS.length && (() => {
          const q = QUESTIONS[step - 1]
          return (
            <div key={q.key} className="animate-fade-up">
              <p className="text-sm text-ink-faint mb-3">
                Question {step} of {QUESTIONS.length}
              </p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-8">
                {q.prompt}
              </h2>
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <OptionChip
                    key={opt.value}
                    option={opt}
                    selected={answers[q.key] === opt.value}
                    onSelect={() => chooseAnswer(q.key, opt.value)}
                  />
                ))}
              </div>
            </div>
          )
        })()}

        {/* ----------------------------- RECOMMENDATION ----------------------------- */}
        {step > QUESTIONS.length && (() => {
          const rec = getRecommendation(answers, firstName)
          return (
            <div key="recommendation" className="text-center animate-fade-up">
              <WaveMark className="w-16 h-11 mx-auto mb-8 text-accent" animate />
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-6">
                {rec.track}
              </h2>
              <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-md mx-auto">
                {rec.message}
              </p>

              {submitError && (
                <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-6">
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={finish}
                disabled={submitting}
                className="btn btn-primary btn-lg"
              >
                {submitting ? 'Setting up…' : 'Enter Vocalize'}
                {!submitting && <ArrowRight size={19} />}
              </button>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
