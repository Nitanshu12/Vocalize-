import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Captions,
  CaptionsOff,
  Flame,
  Hand,
  Keyboard,
  Mic,
  PhoneOff,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  Zap,
} from 'lucide-react'
import { WaveMark } from '../components/ui/Waveform'
import LevelUpCelebration from '../components/ui/LevelUpCelebration'
import { useAuth } from '../context/AuthContext'
import { interviewApi, profileApi, ttsApi } from '../lib/api'
import ProfileGate from '../components/interview/ProfileGate'
import { useStreamingTranscription } from '../hooks/useStreamingTranscription'
import { playTick, playGo } from '../lib/audioCues'

// Voice-activity detection (auto turn-taking) tuning.
const VAD_SILENCE_MS = 4500 // auto-submit after this much trailing silence
const VAD_CALIBRATION_MS = 600 // sample the room's noise floor first
const VAD_MIN_THRESHOLD = 0.02 // never treat quieter than this as "speech"
const VAD_MAX_THRESHOLD = 0.15 // never demand louder than this either

/* Interview Mode — text-first cut (voice loop lands next step).
 *   setup  → pick an interview round (HR / Product / …)
 *   brief  → persona, competencies, language + mode
 *   room   → interviewer asks; you answer; it adapts
 *   report → competency scorecard + AI coach wrap-up
 *
 * The whole conversation runs through the Node gateway to the Python LangGraph
 * agent (start/answer). Answers are typed for now; the streaming mic + TTS voice
 * replace the textarea/text bubble in the next step.
 */

const LANG_LABEL = { en: 'English', hi: 'हिन्दी Hindi' }

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="chip">
      {children}
    </button>
  )
}

export default function Interview() {
  const { accessToken, user } = useAuth()
  const speech = useStreamingTranscription()

  const [step, setStep] = useState('setup') // setup | brief | room | report
  const [types, setTypes] = useState([])
  const [loadError, setLoadError] = useState('')

  // Who the user is (school | college | professional) and what we know about
  // them. Track decides which rounds are offered; profile is what the
  // interviewer "reads" beforehand. Both come from the server — the browser
  // never invents either.
  const [track, setTrack] = useState('college')
  const [profile, setProfile] = useState(null)

  // setup / brief choices
  const [typeId, setTypeId] = useState(null)
  const [language, setLanguage] = useState('en')
  const [mode, setMode] = useState('audio')

  // live session
  const [threadId, setThreadId] = useState(null)
  const [question, setQuestion] = useState('')
  const [turnNo, setTurnNo] = useState(0)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false) // start/answer in flight
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [gami, setGami] = useState(null) // points/level from the saved result
  const [levelUp, setLevelUp] = useState(null) // set when the interview crosses a level
  const [speaking, setSpeaking] = useState(false) // interviewer TTS playing
  const [showType, setShowType] = useState(false) // typed-answer fallback
  const [mediaReady, setMediaReady] = useState(false) // mic/cam acquired on the ready screen
  const [mediaError, setMediaError] = useState('')
  const [countdown, setCountdown] = useState(null) // 3 · 2 · 1 before the interview
  const [micLevel, setMicLevel] = useState(0) // 0..1 live input level for the meter
  const [captionsOn, setCaptionsOn] = useState(true) // CC toggle (like Meet)
  const [captionText, setCaptionText] = useState('') // interviewer line, revealed live
  const [autoMode, setAutoMode] = useState(true) // hands-free turn-taking (VAD)
  const [silenceCountdown, setSilenceCountdown] = useState(null) // 3·2·1 before auto-submit
  const answerRef = useRef(null)
  const audioRef = useRef(null) // <Audio> element for the interviewer voice
  const ttsUrlRef = useRef(null) // object URL to revoke
  const mediaStreamRef = useRef(null) // persistent mic(+cam) stream for the whole session
  const readyVideoRef = useRef(null) // self-view on the ready screen
  const selfVideoRef = useRef(null) // self-view in the room
  const meterCtxRef = useRef(null) // AudioContext powering the mic meter
  const meterRafRef = useRef(null)
  const vadCtxRef = useRef(null) // AudioContext powering silence detection
  const vadRafRef = useRef(null)
  const finishingRef = useRef(false) // guards against double auto/manual submit
  const silenceRef = useRef(null) // mirror of silenceCountdown (avoids stale closures)
  const showTypeRef = useRef(false) // latest showType for the TTS onended callback
  const autoRef = useRef(true) // latest autoMode for callbacks
  const stepRef = useRef('setup') // latest step for callbacks

  const recording = speech.listening || speech.connecting

  /* ------------------------------ data load ------------------------------ */
  useEffect(() => {
    let cancelled = false
    Promise.all([
      interviewApi.types(accessToken),
      // The profile is optional: a failure here must not block the whole page,
      // so it resolves to null instead of rejecting the Promise.all.
      profileApi.get(accessToken).catch(() => null),
    ])
      .then(([typesRes, profileRes]) => {
        if (cancelled) return
        setTypes(typesRes.types)
        setTypeId((id) => id ?? typesRes.types[0]?.id ?? null)
        if (profileRes) {
          setTrack(profileRes.track)
          setProfile(profileRes.profile)
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  // Changing track changes which rounds exist, so the list is refetched rather
  // than filtered client-side — the server stays the single source of truth.
  async function changeTrack(next) {
    if (next === track) return
    setTrack(next)
    setLoadError('')
    try {
      await profileApi.setTrack(accessToken, next)
      const { types: list } = await interviewApi.types(accessToken)
      setTypes(list)
      setTypeId(list[0]?.id ?? null)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  const selectedType = types.find((t) => t.id === typeId) || null

  /* -------------------------------- flow --------------------------------- */
  function goBrief() {
    setError('')
    setLanguage(selectedType?.languageOptions?.[0] ?? 'en')
    setStep('brief')
  }

  async function beginInterview() {
    setBusy(true)
    setError('')
    try {
      const { threadId: tid, question: q } = await interviewApi.start(accessToken, {
        typeId,
        language,
      })
      setThreadId(tid)
      setQuestion(q)
      setTurnNo(1)
      setStep('room')
    } catch (err) {
      setError(err.message || 'Could not start the interview, please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Move from the brief to the ready screen (mic/cam check + countdown).
  function goReady() {
    setError('')
    setMediaError('')
    setMediaReady(false)
    setCountdown(null)
    setStep('ready')
  }

  // Grab the mic (+camera in video mode) ONCE and keep it for the session:
  // the self-view and every spoken answer reuse this one stream.
  async function acquireMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      })
      mediaStreamRef.current = stream
      setMediaReady(true)
      if (mode === 'video' && readyVideoRef.current) readyVideoRef.current.srcObject = stream
      startMeter(stream)
    } catch {
      setMediaError('We need mic (and camera) access to run the interview, allow it and retry.')
    }
  }

  // Live input-level meter for the ready screen (cosmetic reassurance).
  function startMeter(stream) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      meterCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setMicLevel(Math.min(1, avg / 90))
        meterRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      /* meter is cosmetic — ignore */
    }
  }

  function stopMeter() {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current)
    meterRafRef.current = null
    if (meterCtxRef.current && meterCtxRef.current.state !== 'closed') {
      meterCtxRef.current.close().catch(() => {})
    }
    meterCtxRef.current = null
    setMicLevel(0)
  }

  function stopMedia() {
    stopMeter()
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
  }

  // 3 · 2 · 1, then actually start the interview. Each number gets an audible
  // "tick" and the launch gets a brighter "go" beep, so it feels like a real
  // countdown timer instead of numbers silently flashing.
  function beginCountdown() {
    stopMeter() // free the meter's context before the interview uses the mic
    let c = 3
    setCountdown(c)
    playTick() // this first tick runs inside the click gesture and unlocks audio
    const id = setInterval(() => {
      c -= 1
      if (c <= 0) {
        clearInterval(id)
        setCountdown(null)
        playGo()
        beginInterview()
        return
      }
      setCountdown(c)
      playTick()
    }, 1000)
  }

  // Stop any interviewer audio that's currently playing.
  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (ttsUrlRef.current) {
      URL.revokeObjectURL(ttsUrlRef.current)
      ttsUrlRef.current = null
    }
    setSpeaking(false)
  }

  // Speak a question aloud (ElevenLabs). Autoplay can be blocked outside a user
  // gesture — if so we quietly fall back to the on-screen "Replay" button.
  async function playQuestion(text) {
    if (!text) return
    stopAudio()
    try {
      const url = await ttsApi.speak(accessToken, text)
      ttsUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setSpeaking(false)
        // Real turn-taking: the moment the interviewer stops talking, start
        // listening — no button tap. (Skip if the user switched to typing, left
        // the room, or a submit is already in flight.)
        if (
          autoRef.current &&
          stepRef.current === 'room' &&
          !showTypeRef.current &&
          !finishingRef.current
        ) {
          startAnswer()
        }
      }
      setSpeaking(true)
      await audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  // Shared "send this answer to the agent" path (typed or spoken).
  async function submitTurn(text) {
    const clean = (text || '').trim()
    if (!clean || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await interviewApi.answer(accessToken, { threadId, answer: clean })
      setAnswer('')
      if (res.done) {
        stopAudio()
        setReport(res.report)
        setGami(res.gamification ?? null)
        if (res.gamification?.leveledUp && res.gamification.level) {
          setLevelUp({
            level: res.gamification.level,
            previousLevel: res.gamification.previousLevelNumber,
          })
        }
        setStep('report')
      } else {
        setQuestion(res.question)
        setTurnNo((n) => n + 1)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong, please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Voice answer: silence the interviewer (so we don't record it), then stream
  // from the session's persistent mic stream (acquired on the ready screen).
  async function startAnswer() {
    setError('')
    stopAudio()
    finishingRef.current = false
    try {
      let stream = mediaStreamRef.current
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
      }
      await speech.start(stream)
      if (autoRef.current) startVad(stream) // hands-free: auto-submit on silence
    } catch {
      setError('We need mic access to hear you, allow it and try again, or type instead.')
    }
  }

  /* ----------------------- voice-activity detection ---------------------- */
  // Small helper so both the ref (for closures) and the state (for the UI) stay
  // in sync when we change the trailing-silence countdown.
  function setSilence(v) {
    silenceRef.current = v
    setSilenceCountdown(v)
  }

  // Listen to the mic's loudness in real time. Once the user has spoken and then
  // goes quiet for VAD_SILENCE_MS, we auto-submit the answer — just like a human
  // interviewer noticing you've finished. We first sample the room's noise floor
  // (VAD_CALIBRATION_MS) so a noisy background doesn't count as "speech".
  function startVad(stream) {
    stopVad()
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      vadCtxRef.current = ctx
      ctx.resume().catch(() => {}) // may start suspended outside a click
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.fftSize)

      const startedAt = performance.now()
      let threshold = VAD_MIN_THRESHOLD
      let calibrated = false
      let noiseSum = 0
      let noiseCount = 0
      let hasSpoken = false
      let lastVoiceAt = performance.now()

      const loop = () => {
        analyser.getByteTimeDomainData(data)
        // RMS (root-mean-square) loudness around the 128 mid-point.
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        const now = performance.now()
        const elapsed = now - startedAt

        if (elapsed < VAD_CALIBRATION_MS) {
          noiseSum += rms
          noiseCount += 1
          lastVoiceAt = now
          vadRafRef.current = requestAnimationFrame(loop)
          return
        }
        if (!calibrated) {
          const floor = noiseCount > 0 ? noiseSum / noiseCount : VAD_MIN_THRESHOLD
          threshold = Math.min(VAD_MAX_THRESHOLD, Math.max(VAD_MIN_THRESHOLD, floor * 3))
          calibrated = true
        }

        if (rms > threshold) {
          hasSpoken = true
          lastVoiceAt = now
          if (silenceRef.current !== null) setSilence(null)
        } else if (hasSpoken) {
          const remaining = VAD_SILENCE_MS - (now - lastVoiceAt)
          if (remaining <= 0) {
            finishAnswer() // stops the VAD loop via stopVad()
            return
          }
          if (remaining <= 3000) {
            const secs = Math.ceil(remaining / 1000)
            if (silenceRef.current !== secs) setSilence(secs)
          }
        }
        vadRafRef.current = requestAnimationFrame(loop)
      }
      vadRafRef.current = requestAnimationFrame(loop)
    } catch {
      /* VAD is an enhancement — if it fails the manual Done button still works */
    }
  }

  function stopVad() {
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current)
    vadRafRef.current = null
    if (vadCtxRef.current && vadCtxRef.current.state !== 'closed') {
      vadCtxRef.current.close().catch(() => {})
    }
    vadCtxRef.current = null
    setSilence(null)
  }

  // Stop listening, take the transcript, send it. The mic stream stays alive for
  // the next answer + self-view.
  async function finishAnswer() {
    if (finishingRef.current) return // guard: VAD + manual Done could both fire
    finishingRef.current = true
    stopVad()
    const { transcript } = await speech.stop()
    const text = (transcript || '').trim()
    if (!text) {
      finishingRef.current = false
      setError("We couldn't catch that, try again, or type instead.")
      return
    }
    submitTurn(text)
  }

  function restart() {
    stopAudio()
    stopVad()
    stopMedia()
    setThreadId(null)
    setQuestion('')
    setTurnNo(0)
    setAnswer('')
    setReport(null)
    setGami(null)
    setLevelUp(null)
    setError('')
    setShowType(false)
    setMediaReady(false)
    setCountdown(null)
    setStep('setup')
  }

  // Speak each new question as it arrives.
  useEffect(() => {
    if (step === 'room' && question) playQuestion(question)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, step])

  // Reveal the interviewer's line character-by-character (live-caption feel),
  // rather than dumping the whole sentence at once.
  useEffect(() => {
    if (step !== 'room' || !question) {
      setCaptionText('')
      return
    }
    setCaptionText('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setCaptionText(question.slice(0, i))
      if (i >= question.length) clearInterval(id)
    }, 32)
    return () => clearInterval(id)
  }, [question, step])

  // Acquire mic/cam when the ready screen opens; tidy the meter when leaving it.
  useEffect(() => {
    if (step === 'ready') acquireMedia()
    return () => stopMeter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Attach the self-view once the room mounts (video mode).
  useEffect(() => {
    if (step === 'room' && mode === 'video' && selfVideoRef.current && mediaStreamRef.current) {
      selfVideoRef.current.srcObject = mediaStreamRef.current
    }
  }, [step, mode])

  // Never leave audio or the mic/camera running after leaving the page.
  useEffect(
    () => () => {
      stopAudio()
      stopVad()
      stopMedia()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  )

  // Keep refs used by callbacks (TTS onended, VAD loop) in sync with state.
  useEffect(() => {
    showTypeRef.current = showType
  }, [showType])
  useEffect(() => {
    stepRef.current = step
  }, [step])
  useEffect(() => {
    autoRef.current = autoMode
    if (!autoMode) stopVad()
    else if (recording && mediaStreamRef.current) startVad(mediaStreamRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode])

  /* ------------------------- room: full-screen dark call ------------------- */
  if (step === 'room') {
    const userInitial = (user?.name?.trim()?.[0] || 'Y').toUpperCase()
    const statusText = busy
      ? 'Thinking…'
      : recording
        ? 'Listening…'
        : speaking
          ? 'Speaking…'
          : 'Your turn'
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-paper text-ink">
        {/* top bar */}
        <div className="flex items-center justify-between px-5 py-3 text-sm shrink-0">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
            {selectedType?.label}
          </span>
          <span className="text-ink/50">
            Question {turnNo} of ~{selectedType?.maxQuestions}
          </span>
        </div>

        {/* main stage */}
        <div className="relative flex-1 min-h-0 mx-3 rounded-card overflow-hidden bg-paper-deep grid place-items-center">
          {/* interviewer presence */}
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 grid place-items-center">
              {speaking && (
                <span className="absolute inset-0 rounded-full border-2 border-brand-200/40 animate-ping" />
              )}
              <span
                className={`absolute inset-0 rounded-full bg-brand-600/20 ${recording || speaking ? 'animate-pulse' : ''}`}
              />
              <span className="absolute inset-5 rounded-full bg-brand-600 grid place-items-center font-display text-5xl font-semibold text-ink">
                {selectedType?.persona.name.charAt(0)}
              </span>
            </div>
            <p className="mt-5 text-lg font-semibold">{selectedType?.persona.name}</p>
            <p className="text-sm text-ink/50">{statusText}</p>
            {recording && silenceCountdown !== null && (
              <p className="mt-1 text-xs text-brand-200 tabular-nums">
                Wrapping up in {silenceCountdown}…
              </p>
            )}
          </div>

          {/* live captions (toggle with CC) — one rolling line, Meet-style */}
          {captionsOn && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(80%,640px)] flex justify-center">
              <div className="rounded-lg bg-paper/95 px-4 py-2 text-[15px] leading-snug text-ink/95 max-h-20 overflow-hidden">
                {recording ? (
                  <>
                    <span className="text-brand-200 font-semibold">You: </span>
                    {speech.transcript} <span className="text-ink/50 italic">{speech.interim}</span>
                    {!speech.transcript && !speech.interim && (
                      <span className="text-ink/50">Listening…</span>
                    )}
                  </>
                ) : (
                  captionText && (
                    <>
                      <span className="text-brand-200 font-semibold">
                        {selectedType?.persona.name}:{' '}
                      </span>
                      {captionText}
                    </>
                  )
                )}
              </div>
            </div>
          )}

          {/* self-view PiP, bottom-right (Meet-style) */}
          <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden bg-surface border border-rule grid place-items-center">
            {mode === 'video' ? (
              <video
                ref={selfVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <span className="w-12 h-12 rounded-full bg-brand-600 grid place-items-center font-semibold text-lg">
                {userInitial}
              </span>
            )}
            <span className="absolute bottom-1 left-2 text-xs text-ink/80">You</span>
          </div>
        </div>

        {/* typed-answer fallback (dark) */}
        {showType && (
          <div className="mx-auto w-[min(92%,720px)] mt-3">
            <textarea
              ref={answerRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitTurn(answer)
              }}
              rows={2}
              autoFocus
              placeholder="Type your answer… (⌘/Ctrl + Enter to send)"
              className="w-full rounded-xl border border-ink/15 bg-ink/5 px-4 py-3 text-ink placeholder:text-ink/40 focus:outline-none focus:border-brand-200 resize-none"
            />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-coral mt-2 px-4">{error}</p>
        )}

        {/* control bar */}
        <div className="flex items-center justify-center gap-3 py-5 shrink-0">
          <button
            type="button"
            onClick={() => playQuestion(question)}
            disabled={busy || recording}
            title="Replay question"
            className="w-12 h-12 rounded-full bg-ink/10 hover:bg-ink/20 grid place-items-center disabled:opacity-40 transition-colors"
          >
            <Volume2 size={19} />
          </button>

          <button
            type="button"
            onClick={() => setCaptionsOn((v) => !v)}
            title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
            className={`w-12 h-12 rounded-full grid place-items-center transition-colors ${
              captionsOn ? 'bg-ink/20 hover:bg-ink/30' : 'bg-ink/10 hover:bg-ink/20'
            }`}
          >
            {captionsOn ? <Captions size={19} /> : <CaptionsOff size={19} />}
          </button>

          <button
            type="button"
            onClick={() => setAutoMode((v) => !v)}
            title={
              autoMode
                ? 'Hands-free: auto-starts on your turn, submits when you pause'
                : 'Manual: tap to answer, tap to finish'
            }
            className={`w-12 h-12 rounded-full grid place-items-center transition-colors ${
              autoMode ? 'bg-brand-600 hover:bg-brand-700' : 'bg-ink/10 hover:bg-ink/20'
            }`}
          >
            {autoMode ? <Zap size={19} /> : <Hand size={19} />}
          </button>

          {showType ? (
            <button
              type="button"
              onClick={() => submitTurn(answer)}
              disabled={busy || !answer.trim()}
              className="btn btn-primary"
            >
              <Send size={18} /> {busy ? 'Thinking…' : 'Send'}
            </button>
          ) : !recording ? (
            <button
              type="button"
              onClick={startAnswer}
              disabled={busy}
              className="btn btn-primary btn-lg"
            >
              <Mic size={20} /> {busy ? 'Thinking…' : 'Answer'}
            </button>
          ) : (
            <button
              type="button"
              onClick={finishAnswer}
              className="btn btn-primary btn-lg"
            >
              <Square size={17} fill="currentColor" /> Done
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowType((v) => !v)}
            disabled={recording}
            title={showType ? 'Use voice' : 'Type instead'}
            className="w-12 h-12 rounded-full bg-ink/10 hover:bg-ink/20 grid place-items-center disabled:opacity-40 transition-colors"
          >
            {showType ? <Mic size={19} /> : <Keyboard size={19} />}
          </button>

          <button
            type="button"
            onClick={restart}
            title="End interview"
            className="w-12 h-12 rounded-full bg-coral hover:opacity-90 grid place-items-center transition-opacity"
          >
            <PhoneOff size={19} />
          </button>
        </div>
      </div>
    )
  }

  /* -------------------------------- render -------------------------------- */
  return (
    <div className="relative min-h-screen bg-paper overflow-hidden px-6 py-10">

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <WaveMark className="w-10 h-7 text-accent" animate={step === 'room' && busy} />
        </div>

        {/* --------------------------------- SETUP --------------------------------- */}
        {step === 'setup' && (
          <div className="animate-fade-up">
            <h1 className="font-display text-4xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-6">
              Pick a round
            </h1>

            {/* Track — the single question that decides which rounds exist for
                this person. A school student is never shown an HR screening. */}
            <p className="text-sm font-semibold text-ink mb-2">Where are you right now?</p>
            <div className="flex flex-wrap gap-2 mb-7">
              <Chip active={track === 'school'} onClick={() => changeTrack('school')}>
                In school
              </Chip>
              <Chip active={track === 'college'} onClick={() => changeTrack('college')}>
                In college
              </Chip>
              <Chip active={track === 'professional'} onClick={() => changeTrack('professional')}>
                Working
              </Chip>
            </div>

            {loadError && (
              <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-5">
                {loadError}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  aria-pressed={typeId === t.id}
                  className="option px-5 py-4"
                >
                  <p className="font-display text-lg font-semibold text-ink">{t.label}</p>
                  <p className="text-sm text-ink-soft leading-snug">{t.description}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goBrief}
              disabled={!selectedType}
              className="btn btn-primary btn-lg"
            >
              Continue <ArrowRight size={19} />
            </button>
          </div>
        )}

        {/* --------------------------------- BRIEF --------------------------------- */}
        {step === 'brief' && selectedType && (
          <div className="animate-fade-up">
            <h1 className="font-display text-4xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-6">
              {selectedType.label}
            </h1>

            <div className="rounded-card border border-ink/10 bg-surface px-6 py-5 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="w-12 h-12 rounded-full bg-brand-600 text-accent-ink grid place-items-center font-display text-xl font-semibold">
                  {selectedType.persona.name.charAt(0)}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {selectedType.persona.name}
                  </p>
                  <p className="text-sm text-ink-soft">{selectedType.persona.title}</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-ink-faint mb-2">
                You'll be assessed on
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedType.competencies.map((c) => (
                  <span
                    key={c}
                    className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex gap-5 text-sm text-ink-faint border-t border-ink/10 pt-3">
                <span>
                  <b className="text-ink font-semibold">~{selectedType.targetMinutes} min</b>
                </span>
                <span>
                  <b className="text-ink font-semibold">{selectedType.maxQuestions}</b> questions
                </span>
                <span>
                  <b className="text-ink font-semibold">Adaptive</b> follow-ups
                </span>
              </div>
            </div>

            {/* The background step. Placed here, not at sign-up: the user has
                just picked a round and can see who will interview them, which is
                the moment the ask actually makes sense. */}
            <ProfileGate
              token={accessToken}
              track={track}
              profile={profile}
              onSaved={setProfile}
            />

            <p className="text-sm font-semibold text-ink mb-2">Language you're comfortable in</p>
            <div className="flex gap-2 mb-6">
              {(selectedType.languageOptions ?? ['en']).map((code) => (
                <Chip key={code} active={language === code} onClick={() => setLanguage(code)}>
                  {LANG_LABEL[code] ?? code}
                </Chip>
              ))}
            </div>

            <p className="text-sm font-semibold text-ink mb-2">Recording mode</p>
            <div className="flex gap-2 mb-8">
              <Chip active={mode === 'audio'} onClick={() => setMode('audio')}>
                Audio
              </Chip>
              <Chip active={mode === 'video'} onClick={() => setMode('video')}>
                Audio + video
              </Chip>
            </div>

            {error && (
              <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-5">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goReady}
                className="btn btn-primary btn-lg"
              >
                Start interview <ArrowRight size={19} />
              </button>
              <button
                type="button"
                onClick={() => setStep('setup')}
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
              >
                ← Back
              </button>
            </div>
            <p className="text-xs text-ink-faint mt-3">
              We'll check your mic{mode === 'video' ? ' and camera' : ''}, then your interviewer joins.
            </p>
          </div>
        )}

        {/* --------------------------------- READY --------------------------------- */}
        {step === 'ready' && (
          <div className="animate-fade-up text-center">
            <h1 className="font-display text-4xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-6">
              Ready when you are
            </h1>

            {mode === 'video' ? (
              <video
                ref={readyVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-72 object-cover rounded-card -scale-x-100 bg-ink/90 mb-5"
              />
            ) : (
              <div className="w-24 h-24 mx-auto rounded-full bg-brand-600 grid place-items-center text-ink mb-5">
                <Mic size={30} />
              </div>
            )}

            {/* live mic meter */}
            <div className="max-w-xs mx-auto mb-2">
              <div className="h-2 rounded-full bg-paper-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-600 origin-left transition-transform duration-75"
                  style={{ transform: `scaleX(${Math.min(1, Math.max(0, micLevel))})` }}
                />
              </div>
            </div>
            <p className="text-sm text-ink-soft mb-6">
              {mediaError
                ? ''
                : mediaReady
                  ? 'Say “hello”. Your mic looks good.'
                  : 'Allow mic/camera access to continue…'}
            </p>

            {mediaError && (
              <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3 mb-6 inline-block">
                {mediaError}
              </p>
            )}

            {countdown !== null ? (
              <p className="font-display text-7xl font-semibold text-brand-700 tracking-tight tabular-nums my-4">
                {countdown}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-3">
                {mediaError ? (
                  <button
                    type="button"
                    onClick={acquireMedia}
                    className="btn btn-primary btn-lg"
                  >
                    <RotateCcw size={18} /> Retry access
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={beginCountdown}
                    disabled={!mediaReady}
                    className="btn btn-primary btn-lg"
                  >
                    I'm ready <ArrowRight size={19} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    stopMedia()
                    setStep('brief')
                  }}
                  className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        )}


        {/* -------------------------------- REPORT --------------------------------- */}
        {step === 'report' && report && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <p className="text-ink-soft mb-1">Your scorecard</p>
              <p className="font-display text-7xl font-bold text-ink tracking-[-0.04em]">
                {report.overallScore}
                <span className="text-2xl text-ink-faint">/100</span>
              </p>
              <p className="text-sm text-ink-soft mt-1">{report.overallOutOf5}/5 average</p>
              {gami && (
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <span className="text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5">
                    +{gami.pointsEarned} XP
                  </span>
                  <span className="text-sm font-semibold text-ink-soft bg-surface border border-ink/10 rounded-full px-4 py-1.5">
                    Level {gami.level.level}: {gami.level.title}
                  </span>
                  {typeof gami.current_streak === 'number' && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5">
                      <Flame size={14} /> {gami.current_streak}-day streak
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* competency bars */}
            <div className="rounded-card border border-ink/10 bg-surface px-6 py-5 mb-6">
              <p className="text-xs font-semibold text-ink-faint mb-3">
                Competencies
              </p>
              <div className="space-y-3">
                {report.competencies.map((c) => (
                  <div key={c.key}>
                    <div className="flex justify-between text-sm text-ink mb-1">
                      <span>{c.label}</span>
                      <span className="font-semibold tabular-nums">{c.score}/5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-paper-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${(c.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI coach */}
            {report.coach && (
              <div className="rounded-card border border-brand-200 bg-surface px-7 py-6 mb-8">
                <p className="inline-flex items-center gap-2 font-semibold text-accent mb-3">
                  <Sparkles size={18} /> Your coach says
                </p>
                <p className="font-display text-xl font-semibold text-ink mb-4">
                  {report.coach.headline}
                </p>
                <div className="space-y-1.5 mb-3">
                  {report.coach.strengths.map((item) => (
                    <p key={item} className="text-sm text-ink-soft flex gap-2">
                      <span className="text-leaf font-bold shrink-0">✓</span> {item}
                    </p>
                  ))}
                </div>
                <div className="space-y-1.5 mb-4">
                  {report.coach.improvements.map((item) => (
                    <p key={item} className="text-sm text-ink-soft flex gap-2">
                      <span className="text-gold font-bold shrink-0">→</span> {item}
                    </p>
                  ))}
                </div>
                <div className="border-l-2 border-accent pl-4 py-1">
                  <p className="text-sm text-ink">
                    <span className="font-semibold">Practise next:</span> {report.coach.next_tip}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="btn btn-primary"
              >
                <RotateCcw size={16} /> New interview
              </button>
              <Link
                to="/app/dashboard"
                className="btn btn-ghost"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {levelUp && (
        <LevelUpCelebration
          level={levelUp.level}
          previousLevel={levelUp.previousLevel}
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  )
}
