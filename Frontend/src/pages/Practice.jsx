import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Lock,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Video,
} from 'lucide-react'
import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'
import { practiceApi } from '../lib/api'
import { useStreamingTranscription } from '../hooks/useStreamingTranscription'

/* Practice Mode — one page, four steps:
 *   setup   → pick a script (library/custom), mode (audio/video), timer
 *   prep    → optional countdown to read the script through
 *   record  → mic/camera on, live transcript + live pace meter
 *   results → server-graded scores, points/streak, AI coach (or premium lock)
 *
 * Web Speech gives a live transcript for the in-session pace meter; on finish we
 * upload the recorded audio so the server can transcribe it with Whisper (the
 * authoritative transcript used for scoring). The audio is transcribed and
 * discarded server-side — never stored. The local blob stays in the browser for
 * the "watch yourself back" replay only.
 */

const DIFFICULTY_BADGE = {
  easy: 'bg-leaf/10 text-leaf border-leaf/30',
  medium: 'bg-gold/10 text-gold border-gold/30',
  hard: 'bg-coral/10 text-coral border-coral/30',
}
const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 }
const CATEGORY_LABEL = {
  interview: 'Interview',
  presentation: 'Presentation',
  public_speaking: 'Public speaking',
}
const PREP_MINUTES = [1, 2, 3]
const DEFAULT_WPM = { min: 120, max: 160 }

function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function MetricTile({ value, label }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4 text-center">
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-soft mt-1">{label}</p>
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
        active
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-ink/15 bg-white text-ink-soft hover:border-ink/40'
      }`}
    >
      {children}
    </button>
  )
}

export default function Practice() {
  const { accessToken } = useAuth()
  const speech = useStreamingTranscription()

  const [step, setStep] = useState('setup') // setup | prep | record | results
  const [paragraphs, setParagraphs] = useState([])
  const [loadError, setLoadError] = useState('')

  // setup choices
  const [source, setSource] = useState('library')
  const [paragraphId, setParagraphId] = useState(null)
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState('audio')
  const [timed, setTimed] = useState(false)
  const [prepMinutes, setPrepMinutes] = useState(1)

  // timers (both driven by timestamps, not interval drift)
  const [prepLeft, setPrepLeft] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const prepEndRef = useRef(0)
  const startedAtRef = useRef(0)
  const prepUsedRef = useRef(0)

  // media
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const videoRef = useRef(null)
  const urlRef = useRef(null)
  const blobRef = useRef(null) // the recorded Blob, for upload + replay
  const stopResolveRef = useRef(null) // resolves once MediaRecorder.onstop fires
  const startingRef = useRef(false)
  const [recordingUrl, setRecordingUrl] = useState(null)
  const [mediaError, setMediaError] = useState('')

  // results
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  /* ------------------------------ data load ------------------------------ */
  useEffect(() => {
    practiceApi
      .paragraphs(accessToken)
      .then(({ paragraphs }) => {
        const sorted = [...paragraphs].sort(
          (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
        )
        setParagraphs(sorted)
        setParagraphId((id) => id ?? sorted[0]?.id ?? null)
      })
      .catch((err) => setLoadError(err.message))
  }, [accessToken])

  const selectedParagraph = paragraphs.find((p) => p.id === paragraphId)
  const activeText = source === 'library' ? selectedParagraph?.text ?? '' : customText
  const targetMin = (source === 'library' && selectedParagraph?.targetWpmMin) || DEFAULT_WPM.min
  const targetMax = (source === 'library' && selectedParagraph?.targetWpmMax) || DEFAULT_WPM.max

  /* ------------------------------- recording ------------------------------ */
  async function startRecording() {
    if (startingRef.current) return
    startingRef.current = true
    setMediaError('')
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
      setRecordingUrl(null)
    }
    blobRef.current = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setRecordingUrl(url)
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        // Hand the finished blob to whoever is awaiting the stop.
        if (stopResolveRef.current) {
          stopResolveRef.current(blob)
          stopResolveRef.current = null
        }
      }
      recorderRef.current = recorder
      recorder.start()
      // Start live streaming transcription on the SAME mic stream.
      await speech.start(stream)
      startedAtRef.current = performance.now()
      setElapsed(0)
      setStep('record')
    } catch {
      // Clean up mic/recorder if capture or the streaming connection failed.
      if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setMediaError(
        'We couldn’t start the session — allow mic/camera access, check your connection, and try again.'
      )
      setStep('setup')
    } finally {
      startingRef.current = false
    }
  }

  // Stop the recorder and resolve with the finished Blob. onstop (set in
  // startRecording) builds the blob, stops the tracks, and calls the resolver.
  function stopAndGetBlob() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return Promise.resolve(blobRef.current)
    }
    return new Promise((resolve) => {
      stopResolveRef.current = resolve
      recorder.stop()
    })
  }

  async function finishRecording() {
    const durationSeconds = Math.min(
      3600,
      Math.max(1, Math.round((performance.now() - startedAtRef.current) / 1000))
    )
    // The authoritative transcript + word timestamps come from the streaming STT.
    const { transcript, words } = await speech.stop()
    await stopAndGetBlob() // finish the local replay recording (blob stays on-device)

    if (!transcript) {
      setSubmitError("We couldn't hear any words — check your mic and try again.")
      setStep('setup')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setStep('results')
    try {
      const payload = {
        source,
        mode,
        timed,
        durationSeconds,
        transcript,
        words,
        ...(source === 'library' ? { paragraphId } : { customText: customText.trim() }),
        ...(timed ? { prepSeconds: prepUsedRef.current } : {}),
      }
      const res = await practiceApi.submitSession(accessToken, payload)
      setResult(res)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong while scoring — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function begin() {
    setSubmitError('')
    if (timed) {
      prepEndRef.current = performance.now() + prepMinutes * 60 * 1000
      setPrepLeft(prepMinutes * 60)
      setStep('prep')
    } else {
      prepUsedRef.current = 0
      startRecording()
    }
  }

  function practiceAgain() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    blobRef.current = null
    setRecordingUrl(null)
    setResult(null)
    setSubmitError('')
    setElapsed(0)
    setStep('setup')
  }

  /* ------------------------------- timers -------------------------------- */
  // Prep countdown — derived from an end timestamp so background tabs don't drift.
  useEffect(() => {
    if (step !== 'prep') return
    const t = setInterval(() => {
      setPrepLeft(Math.ceil((prepEndRef.current - performance.now()) / 1000))
    }, 250)
    return () => clearInterval(t)
  }, [step])

  useEffect(() => {
    if (step === 'prep' && prepLeft <= 0) {
      prepUsedRef.current = prepMinutes * 60
      startRecording()
    }
  }, [step, prepLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'record') return
    const t = setInterval(() => {
      setElapsed(Math.round((performance.now() - startedAtRef.current) / 1000))
    }, 500)
    return () => clearInterval(t)
  }, [step])

  // Attach the camera stream to the self-view once the record screen mounts.
  useEffect(() => {
    if (step === 'record' && mode === 'video' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [step, mode])

  // Never leave mic/camera on or object URLs alive after leaving the page.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    []
  )

  /* ------------------------------ live meter ------------------------------ */
  const liveWords = `${speech.transcript} ${speech.interim}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const liveWpm = elapsed > 0 ? Math.round((liveWords / elapsed) * 60) : 0
  const paceState = liveWpm < targetMin ? 'slow' : liveWpm > targetMax ? 'fast' : 'good'
  const paceStyle = {
    good: 'bg-leaf/10 text-leaf border-leaf/30',
    slow: 'bg-gold/10 text-gold border-gold/30',
    fast: 'bg-coral/10 text-coral border-coral/30',
  }[paceState]
  const paceLabel = { good: 'Great pace', slow: 'A bit slow', fast: 'Slow down' }[paceState]

  const canStart =
    (source === 'library' ? Boolean(paragraphId) : customText.trim().length > 0) && !loadError

  /* -------------------------------- render -------------------------------- */
  return (
    <div className="relative min-h-screen bg-paper grain overflow-hidden px-6 py-10">
      <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <WaveMark className="w-10 h-7" animate={step === 'record'} />
        </div>

        {/* --------------------------------- SETUP --------------------------------- */}
        {step === 'setup' && (
          <div className="animate-fade-up">
            <p className="handnote text-2xl text-brand-700 mb-2">let's get you talking</p>
            <h1 className="font-display text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-6">
              Practice a script
            </h1>

            {!speech.supported && (
              <p className="text-sm text-gold bg-gold/10 border border-gold/20 rounded-lg px-4 py-3 mb-5">
                Your browser doesn't support the live audio capture needed for scoring. Please use a
                recent Chrome, Edge, Safari, or Firefox.
              </p>
            )}
            {(loadError || mediaError || submitError) && (
              <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-5">
                {loadError || mediaError || submitError}
              </p>
            )}

            {/* script source */}
            <div className="flex gap-2 mb-4">
              <Chip active={source === 'library'} onClick={() => setSource('library')}>
                Our library
              </Chip>
              <Chip active={source === 'custom'} onClick={() => setSource('custom')}>
                Your own script
              </Chip>
            </div>

            {source === 'library' ? (
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {paragraphs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setParagraphId(p.id)}
                    className={`text-left rounded-2xl border px-5 py-4 transition-all ${
                      paragraphId === p.id
                        ? 'border-brand-600 bg-brand-50 shadow-[0_2px_20px_rgba(14,124,134,0.18)]'
                        : 'border-ink/15 bg-white hover:border-ink/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-display text-lg font-semibold text-ink">{p.title}</span>
                      <span
                        className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 ${DIFFICULTY_BADGE[p.difficulty]}`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-ink-faint mb-1.5">{CATEGORY_LABEL[p.category]}</p>
                    <p className="text-sm text-ink-soft leading-snug">
                      {p.text.split(' ').slice(0, 14).join(' ')}…
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                maxLength={5000}
                placeholder="Paste or write the paragraph you want to practice out loud…"
                className="w-full rounded-2xl border border-ink/15 bg-white px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-600 mb-8 resize-y"
              />
            )}

            {/* recording mode */}
            <p className="text-sm font-semibold text-ink mb-2">Recording mode</p>
            <div className="flex gap-2 mb-6">
              <Chip active={mode === 'audio'} onClick={() => setMode('audio')}>
                <Mic size={15} /> Audio only
              </Chip>
              <Chip active={mode === 'video'} onClick={() => setMode('video')}>
                <Video size={15} /> Audio + video
              </Chip>
            </div>

            {/* timer */}
            <p className="text-sm font-semibold text-ink mb-2">Pressure level</p>
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <Chip active={!timed} onClick={() => setTimed(false)}>
                Relaxed — no timer
              </Chip>
              <Chip active={timed} onClick={() => setTimed(true)}>
                Timed — prep first
              </Chip>
              {timed && (
                <span className="flex items-center gap-2 ml-1">
                  {PREP_MINUTES.map((m) => (
                    <Chip key={m} active={prepMinutes === m} onClick={() => setPrepMinutes(m)}>
                      {m} min prep
                    </Chip>
                  ))}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={begin}
              disabled={!canStart}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-ink text-paper font-semibold text-lg hover:gap-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Start practicing <ArrowRight size={19} />
            </button>
            <p className="text-xs text-ink-faint mt-3">
              Your audio is transcribed for scoring, then discarded — recordings are never stored.
            </p>
            <div className="mt-6">
              <Link
                to="/app/dashboard"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
              >
                Skip for now →
              </Link>
            </div>
          </div>
        )}

        {/* ---------------------------------- PREP ---------------------------------- */}
        {step === 'prep' && (
          <div className="animate-fade-up text-center">
            <p className="handnote text-2xl text-brand-700 mb-2">take a breath, read it through</p>
            <p className="font-display text-7xl font-semibold text-ink tracking-tight mb-8">
              {formatClock(prepLeft)}
            </p>
            <div className="text-left rounded-2xl border border-ink/10 bg-white px-6 py-5 max-h-56 overflow-y-auto mb-8">
              <p className="text-ink leading-relaxed">{activeText}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                prepUsedRef.current = Math.max(0, prepMinutes * 60 - Math.max(0, prepLeft))
                startRecording()
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-ink text-paper font-semibold text-lg hover:gap-3.5 transition-all"
            >
              I'm ready — start now <ArrowRight size={19} />
            </button>
          </div>
        )}

        {/* --------------------------------- RECORD --------------------------------- */}
        {step === 'record' && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                {formatClock(elapsed)}
              </span>
              {elapsed >= 5 && liveWords > 0 && (
                <span
                  className={`text-xs font-semibold border rounded-full px-3 py-1 ${paceStyle}`}
                >
                  {paceLabel} · {liveWpm} wpm
                </span>
              )}
            </div>

            {mode === 'video' && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-72 object-cover rounded-3xl mb-5 -scale-x-100 bg-ink/90"
              />
            )}

            <div className="rounded-2xl border border-ink/10 bg-white px-6 py-5 max-h-44 overflow-y-auto mb-4">
              <p className="text-ink leading-relaxed">{activeText}</p>
            </div>

            <div className="rounded-2xl border border-brand-200 bg-brand-50/50 px-6 py-5 min-h-24 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">
                Live transcript
              </p>
              <p className="text-ink leading-relaxed">
                {speech.transcript}{' '}
                <span className="text-ink-faint italic">{speech.interim}</span>
                {!speech.transcript && !speech.interim && (
                  <span className="text-ink-faint">Listening…</span>
                )}
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={finishRecording}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-coral text-white font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                <Square size={18} fill="currentColor" /> Finish &amp; get scored
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------- RESULTS --------------------------------- */}
        {step === 'results' && (
          <div className="animate-fade-up">
            {submitting && (
              <div className="text-center py-24">
                <WaveMark className="w-16 h-11 mx-auto mb-6" animate />
                <p className="handnote text-2xl text-brand-700">scoring your session…</p>
              </div>
            )}

            {!submitting && submitError && (
              <div className="text-center py-16">
                <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-8 inline-block">
                  {submitError}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={practiceAgain}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-ink text-paper font-semibold hover:gap-3.5 transition-all"
                  >
                    <RotateCcw size={17} /> Try again
                  </button>
                </div>
              </div>
            )}

            {!submitting && result && (
              <div>
                <div className="text-center mb-8">
                  <p className="handnote text-2xl text-brand-700 mb-1">your score</p>
                  <p className="font-display text-7xl font-semibold text-ink tracking-tight">
                    {result.session.overall_score}
                    <span className="text-2xl text-ink-faint">/100</span>
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <span className="text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5">
                      +{result.session.points_earned} points
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5">
                      <Flame size={14} /> {result.gamification.current_streak}-day streak
                    </span>
                    <span className="text-sm font-semibold text-ink-soft bg-white border border-ink/10 rounded-full px-4 py-1.5">
                      {result.gamification.total_points} total
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <MetricTile value={result.session.wpm} label="Words / min" />
                  <MetricTile value={result.session.filler_count} label="Filler words" />
                  {result.session.coverage_pct !== null && (
                    <MetricTile value={`${result.session.coverage_pct}%`} label="Coverage" />
                  )}
                  {result.session.keyphrase_hit_pct !== null && (
                    <MetricTile
                      value={`${result.session.keyphrase_hit_pct}%`}
                      label="Key phrases"
                    />
                  )}
                  {result.session.long_pauses !== null &&
                    result.session.long_pauses !== undefined && (
                      <MetricTile value={result.session.long_pauses} label="Long pauses" />
                    )}
                </div>

                {/* AI coach — feedback, premium lock, or quiet failure note */}
                {result.session.ai_feedback ? (
                  <div className="rounded-3xl border border-brand-200 bg-white px-7 py-6 mb-8">
                    <p className="inline-flex items-center gap-2 handnote text-2xl text-brand-700 mb-3">
                      <Sparkles size={18} /> your AI coach says
                    </p>
                    <p className="font-display text-xl font-semibold text-ink mb-4">
                      {result.session.ai_feedback.headline}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {result.session.ai_feedback.strengths.map((item) => (
                        <p key={item} className="text-sm text-ink-soft flex gap-2">
                          <span className="text-leaf font-bold shrink-0">✓</span> {item}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {result.session.ai_feedback.improvements.map((item) => (
                        <p key={item} className="text-sm text-ink-soft flex gap-2">
                          <span className="text-gold font-bold shrink-0">→</span> {item}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
                      <p className="text-sm text-brand-800">
                        <span className="font-semibold">Next time:</span>{' '}
                        {result.session.ai_feedback.nextTip}
                      </p>
                    </div>
                    {result.ai.remainingFree > 0 ? (
                      <p className="text-xs text-ink-faint mt-3">
                        {result.ai.remainingFree} free AI coach{' '}
                        {result.ai.remainingFree === 1 ? 'session' : 'sessions'} left
                      </p>
                    ) : (
                      <p className="text-xs text-ink-faint mt-3">
                        That was your last free AI coach session
                      </p>
                    )}
                  </div>
                ) : result.ai.locked ? (
                  <div className="rounded-3xl border border-ink/10 bg-white px-7 py-6 mb-8 text-center">
                    <Lock size={22} className="mx-auto text-ink-faint mb-3" />
                    <p className="font-display text-xl font-semibold text-ink mb-1.5">
                      AI Coach is a premium feature
                    </p>
                    <p className="text-sm text-ink-soft max-w-sm mx-auto">
                      You've used your 3 free AI-coached sessions. Your scores and streaks stay
                      free forever — premium coaching is coming soon.
                    </p>
                  </div>
                ) : result.ai.error ? (
                  <p className="text-xs text-ink-faint text-center mb-8">
                    Your coach couldn't respond this time — your score was saved anyway.
                  </p>
                ) : null}

                {recordingUrl && (
                  <div className="mb-8">
                    <p className="text-sm font-semibold text-ink mb-2">
                      Watch yourself back{' '}
                      <span className="font-normal text-ink-faint">(stays on this device)</span>
                    </p>
                    {mode === 'video' ? (
                      <video controls src={recordingUrl} className="w-full rounded-2xl" />
                    ) : (
                      <audio controls src={recordingUrl} className="w-full" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={practiceAgain}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink text-paper font-semibold hover:gap-3 transition-all"
                  >
                    <RotateCcw size={16} /> Practice again
                  </button>
                  <Link
                    to="/app/dashboard"
                    className="inline-flex items-center px-7 py-3.5 rounded-full border border-ink/20 text-ink font-semibold hover:border-ink/50 transition-colors"
                  >
                    Go to dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
