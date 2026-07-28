import { pipeline } from '@xenova/transformers'

// ── Embeddings: semantic coverage (local, free, no API key) ──────────────────
//
// Literal coverage (LCS in scoring.service) only rewards saying the reference's
// exact words in order. Embeddings measure MEANING: we turn sentences into
// vectors and compare them, so paraphrasing ("I love fixing problems" vs the
// reference's "I enjoy solving problems") still counts as covered.
//
// The model (all-MiniLM-L6-v2) runs in-process via Transformers.js — no external
// service, no key. It downloads (~25MB) on first use and is cached after that,
// so the very first call is slow; later calls are fast.

const MODEL = 'Xenova/all-MiniLM-L6-v2'
const COVERED_THRESHOLD = 0.45 // cosine sim above which a reference point counts as "said"

// Lazy singleton: load the model once, reuse the same pipeline for every request.
let extractorPromise = null
function getExtractor() {
  if (!extractorPromise) extractorPromise = pipeline('feature-extraction', MODEL)
  return extractorPromise
}

// Embed an array of strings -> array of (mean-pooled, L2-normalised) vectors.
async function embed(texts) {
  const extractor = await getExtractor()
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  return output.tolist()
}

// Vectors are already normalised, so cosine similarity is just the dot product.
function cosine(a, b) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

// Split the reference into the "points" we grade coverage against.
function splitSentences(text) {
  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// The transcript may have no punctuation (Web Speech fallback), so we can't rely
// on sentence splitting. Instead chunk it into overlapping word windows, so each
// reference point has fair chances to match somewhere in what was said.
function chunkWords(text, size = 18, overlap = 6) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  if (words.length <= size) return [words.join(' ')]
  const chunks = []
  const step = size - overlap
  for (let i = 0; i < words.length; i += step) {
    chunks.push(words.slice(i, i + size).join(' '))
    if (i + size >= words.length) break
  }
  return chunks
}

// What fraction of the reference's points did the speaker cover *in meaning*?
// Returns 0..100, or null if there's no reference text to compare against.
// For each reference sentence we take its best similarity to any transcript
// chunk; if that clears the threshold, the point is considered covered.
export async function semanticCoverage(referenceText, transcript) {
  const refSentences = splitSentences(referenceText)
  if (refSentences.length === 0) return null
  const chunks = chunkWords(transcript)
  if (chunks.length === 0) return 0

  const [refVecs, chunkVecs] = [await embed(refSentences), await embed(chunks)]

  let covered = 0
  for (const rv of refVecs) {
    let best = 0
    for (const cv of chunkVecs) best = Math.max(best, cosine(rv, cv))
    if (best >= COVERED_THRESHOLD) covered++
  }
  return Math.round((covered / refSentences.length) * 100)
}
