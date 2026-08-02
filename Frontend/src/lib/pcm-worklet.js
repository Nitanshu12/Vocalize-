// AudioWorklet processor: converts the mic's Float32 audio (at the AudioContext's
// native rate, usually 44.1k/48k) into 16-bit PCM at 16 kHz mono — the format
// AssemblyAI's streaming websocket expects.
//
// It runs on the audio thread. Each `process` call gets ~128 samples; we decimate
// to 16 kHz (carrying the fractional read position across calls) and post the
// resulting Int16 bytes back to the main thread, which sends them over the socket.

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._pos = 0
    this._ratio = sampleRate / 16000 // `sampleRate` is a global in the worklet scope
  }

  process(inputs) {
    const channel = inputs[0]?.[0]
    if (!channel || channel.length === 0) return true

    const out = []
    let pos = this._pos
    while (pos < channel.length) {
      const s = Math.max(-1, Math.min(1, channel[Math.floor(pos)]))
      out.push(s < 0 ? s * 0x8000 : s * 0x7fff) // Float [-1,1] -> Int16
      pos += this._ratio
    }
    this._pos = pos - channel.length // carry the leftover fraction into the next block

    if (out.length) {
      const buf = new Int16Array(out)
      this.port.postMessage(buf.buffer, [buf.buffer]) // transfer, no copy
    }
    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)
