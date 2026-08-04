import { useCallback, useEffect, useRef, useState } from 'react'
import pcmWorkletUrl from '../lib/pcm-worklet.js?url'
import { useAuth } from '../context/AuthContext'
import { practiceApi } from '../lib/api'


const WS_URL = 'wss://streaming.assemblyai.com/v3/ws'
const AudioContextImpl =
  typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null

export function useStreamingTranscription() {
  const { accessToken } = useAuth()

  const [connecting, setConnecting] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('') // finalised turns joined
  const [interim, setInterim] = useState('') // current in-progress turn
  const [error, setError] = useState('')

  const wsRef = useRef(null)
  const ctxRef = useRef(null)
  const nodeRef = useRef(null)
  const sourceRef = useRef(null)
  const finalTextRef = useRef('')
  const finalWordsRef = useRef([]) // [{ word, start, end }] in SECONDS

  const supported = Boolean(AudioContextImpl && typeof WebSocket !== 'undefined')

  const teardownAudio = useCallback(() => {
    try {
      if (nodeRef.current?.port) nodeRef.current.port.onmessage = null
      nodeRef.current?.disconnect()
      sourceRef.current?.disconnect()
      if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close()
    } catch {
      /* ignore teardown races */
    }
    nodeRef.current = null
    sourceRef.current = null
    ctxRef.current = null
  }, [])

  const start = useCallback(
    async (stream) => {
      if (!supported) {
        setError('This browser does not support live audio capture.')
        return
      }
      setError('')
      setConnecting(true)
      setTranscript('')
      setInterim('')
      finalTextRef.current = ''
      finalWordsRef.current = []

      // 1) Short-lived token from our backend (real key never reaches the browser).
      let token
      try {
        const res = await practiceApi.streamingToken(accessToken)
        token = res.token
      } catch {
        setConnecting(false)
        setError('Could not start live transcription. Please try again.')
        throw new Error('token failed')
      }

      // 2) Open the AssemblyAI socket and wait for it to connect.
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}?sample_rate=16000&format_turns=true&token=${token}`)
        wsRef.current = ws

        ws.onopen = async () => {
          try {
            // 3) Pipe mic -> worklet (16 kHz PCM) -> socket.
            const ctx = new AudioContextImpl()
            ctxRef.current = ctx
            await ctx.audioWorklet.addModule(pcmWorkletUrl)
            // Contexts often start "suspended" outside a direct click — resume it
            // or the worklet never runs and no audio is sent.
            await ctx.resume()
            const source = ctx.createMediaStreamSource(stream)
            const node = new AudioWorkletNode(ctx, 'pcm-processor')
            node.port.onmessage = (e) => {
              if (ws.readyState === WebSocket.OPEN) ws.send(e.data)
            }
            // A zero-gain sink keeps the graph "pulling" audio without playback.
            const sink = ctx.createGain()
            sink.gain.value = 0
            source.connect(node)
            node.connect(sink)
            sink.connect(ctx.destination)
            sourceRef.current = source
            nodeRef.current = node

            setConnecting(false)
            setListening(true)
            resolve()
          } catch (err) {
            reject(err)
          }
        }

        ws.onmessage = (event) => {
          let msg
          try {
            msg = JSON.parse(event.data)
          } catch {
            return
          }
          if (msg.type !== 'Turn') return

          // A Turn carries the running transcript for the current utterance.
          setInterim(msg.transcript ?? '')
          if (msg.end_of_turn) {
            finalTextRef.current = `${finalTextRef.current} ${msg.transcript ?? ''}`.trim()
            if (Array.isArray(msg.words)) {
              for (const w of msg.words) {
                // AssemblyAI timestamps are in ms -> convert to seconds.
                finalWordsRef.current.push({ word: w.text, start: w.start / 1000, end: w.end / 1000 })
              }
            }
            setTranscript(finalTextRef.current)
            setInterim('')
          }
        }

        ws.onerror = () => {
          setError('Live transcription connection error.')
          reject(new Error('ws error'))
        }
        ws.onclose = () => {
          setListening(false)
        }
      }).catch((err) => {
        setConnecting(false)
        teardownAudio()
        try {
          wsRef.current?.close()
        } catch {
          /* ignore */
        }
        wsRef.current = null
        throw err
      })
    },
    [accessToken, supported, teardownAudio]
  )

  // Stop streaming and resolve with the finalised transcript + words. We fold in
  // any not-yet-finalised interim text so the last few words aren't lost.
  const stop = useCallback(async () => {
    teardownAudio()
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'Terminate' }))
      } catch {
        /* ignore */
      }
      // Give the socket a brief moment to flush a final Turn, then close.
      await new Promise((r) => setTimeout(r, 400))
      try {
        ws.close()
      } catch {
        /* ignore */
      }
    }
    wsRef.current = null
    setListening(false)

    const tail = interim.trim()
    const full = tail ? `${finalTextRef.current} ${tail}`.trim() : finalTextRef.current
    return { transcript: full, words: finalWordsRef.current }
  }, [interim, teardownAudio])

  // Safety net: never leave a socket or audio graph alive after unmount.
  useEffect(
    () => () => {
      teardownAudio()
      try {
        wsRef.current?.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    },
    [teardownAudio]
  )

  return { supported, connecting, listening, transcript, interim, error, start, stop }
}
