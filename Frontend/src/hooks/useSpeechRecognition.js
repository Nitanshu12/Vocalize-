import { useCallback, useEffect, useRef, useState } from 'react'

// Browser speech-to-text via the Web Speech API — free, no API key, no quota.
// Well supported in Chrome/Edge (as webkitSpeechRecognition); not in Firefox,
// so callers should check `supported` and warn instead of breaking.
const SpeechRecognitionImpl =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

// `transcript` holds finalised text; `interim` is the live not-yet-final tail
// (shown faint in the UI). Default lang en-IN recognises English with Indian
// accents well — pass another BCP-47 tag to override.
export function useSpeechRecognition({ lang = 'en-IN' } = {}) {
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)

  const recRef = useRef(null)
  const finalRef = useRef('') // accumulated final text (state is async; ref is not)
  const listeningRef = useRef(false) // whether WE want to be listening right now

  const supported = Boolean(SpeechRecognitionImpl)

  const start = useCallback(() => {
    if (!SpeechRecognitionImpl || listeningRef.current) return
    finalRef.current = ''
    setTranscript('')
    setInterim('')

    const rec = new SpeechRecognitionImpl()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalRef.current += res[0].transcript + ' '
        else interimText += res[0].transcript
      }
      setTranscript(finalRef.current.trim())
      setInterim(interimText.trim())
    }

    // Browsers cut recognition after a stretch of silence. If we're still meant
    // to be listening, quietly restart so long sessions keep transcribing.
    rec.onend = () => {
      if (listeningRef.current) {
        try {
          rec.start()
        } catch {
          /* already restarting */
        }
      } else {
        setListening(false)
      }
    }
    rec.onerror = () => {
      /* 'no-speech' etc. fire onend right after — the restart above handles it */
    }

    recRef.current = rec
    listeningRef.current = true
    rec.start()
    setListening(true)
  }, [lang])

  const stop = useCallback(() => {
    listeningRef.current = false
    recRef.current?.stop()
    setListening(false)
  }, [])

  // Safety net: never leave the mic listening after unmount.
  useEffect(
    () => () => {
      listeningRef.current = false
      recRef.current?.stop()
    },
    []
  )

  return { supported, listening, transcript, interim, start, stop }
}
