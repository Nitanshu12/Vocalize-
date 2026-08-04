// AudioWorklet processor: converts the mic's Float32 audio (at the AudioContext's
// native rate, usually 44.1k/48k) into 16-bit PCM at 16 kHz mono — the format
// AssemblyAI's streaming websocket expects.
//
// It runs on the audio thread. Each `process` call only gets ~128 samples (~3 ms),
// but AssemblyAI requires each audio message to be 50–1000 ms. So we downsample
// into a running buffer and only flush a chunk once it reaches ~100 ms.

const TARGET_RATE = 16000
const CHUNK_SAMPLES = 1600 // 100 ms at 16 kHz (well within AssemblyAI's 50–1000 ms window)

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._pos = 0
    this._ratio = sampleRate / TARGET_RATE // `sampleRate` is a global in the worklet scope
    this._buf = [] // accumulated Int16 samples awaiting a flush
  }

  process(inputs) {
    const channel = inputs[0]?.[0]
    if (!channel || channel.length === 0) return true

    // Decimate to 16 kHz, carrying the fractional read position across blocks.
    let pos = this._pos
    while (pos < channel.length) {
      const s = Math.max(-1, Math.min(1, channel[Math.floor(pos)]))
      this._buf.push(s < 0 ? s * 0x8000 : s * 0x7fff) // Float [-1,1] -> Int16
      pos += this._ratio
    }
    this._pos = pos - channel.length

    // Flush full ~100 ms chunks; keep any remainder for next time.
    while (this._buf.length >= CHUNK_SAMPLES) {
      const out = new Int16Array(this._buf.splice(0, CHUNK_SAMPLES))
      this.port.postMessage(out.buffer, [out.buffer]) // transfer, no copy
    }
    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)
