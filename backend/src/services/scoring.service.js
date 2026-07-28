// Pure scoring logic for Practice Mode — no database, no req/res, no I/O.
// Everything here is a deterministic function of its inputs, which makes the
// grading reproducible and easy to reason about (and to unit-test later).
//
// The core idea: we compare what the user *said* (the Web Speech transcript)
// against a *reference* text. For library paragraphs the reference is our
// curated text (with target pace + key phrases); for custom paragraphs it's the
// user's own typed text (no key phrases, so that sub-score is skipped).

const DEFAULT_FILLERS = [
  'um', 'uh', 'er', 'like', 'basically', 'actually',
  'you know', 'i mean', 'sort of', 'kind of', 'so',
]
const DEFAULT_WPM_MIN = 120
const DEFAULT_WPM_MAX = 160
// A gap longer than this between two spoken words counts as a "long pause" —
// the hesitations that break a listener's attention.
const LONG_PAUSE_SECONDS = 1.5

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

// Lowercase, drop punctuation, split into words. Apostrophes are kept so
// "don't" stays one token. Unicode-aware so it survives accented characters.
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

// Longest Common Subsequence length over two word arrays. This is how we measure
// "coverage": how much of the reference the user actually spoke, in order,
// tolerant of skipped or extra words. O(m*n) — fine for paragraph-sized inputs.
function lcsLength(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return 0
  let prev = new Array(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    const curr = new Array(n + 1).fill(0)
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1])
    }
    prev = curr
  }
  return prev[n]
}

// Count filler words/phrases. We normalise the transcript to single-spaced,
// pad with spaces, then look for " filler " — this makes whole-word matching
// work and handles multi-word fillers like "you know".
function countFillers(text, fillerList) {
  const norm = ` ${tokenize(text).join(' ')} `
  let count = 0
  for (const filler of fillerList) {
    const needle = ` ${tokenize(filler).join(' ')} `
    let idx = norm.indexOf(needle)
    while (idx !== -1) {
      count++
      idx = norm.indexOf(needle, idx + 1)
    }
  }
  return count
}

// What fraction of the curated key phrases did the user actually say?
// Returns null when there are no key phrases (i.e. custom paragraphs).
function computeKeyphraseHit(keyPhrases, transcript) {
  if (!keyPhrases || keyPhrases.length === 0) return null
  const norm = ` ${tokenize(transcript).join(' ')} `
  let hits = 0
  for (const phrase of keyPhrases) {
    const needle = ` ${tokenize(phrase).join(' ')} `
    if (norm.includes(needle)) hits++
  }
  return Math.round((hits / keyPhrases.length) * 100)
}

// 100 while inside the ideal pace band; drops 2 points per WPM outside it.
function computePaceScore(wpm, min, max) {
  if (wpm >= min && wpm <= max) return 100
  const diff = wpm < min ? min - wpm : wpm - max
  return clamp(Math.round(100 - diff * 2), 0, 100)
}

// Fewer fillers per word = higher fluency. ~5% fillers ≈ 80, ~10% ≈ 60.
function computeFluencyScore(fillerCount, totalWords) {
  if (totalWords === 0) return 0
  const rate = fillerCount / totalWords
  return clamp(Math.round(100 - rate * 400), 0, 100)
}

// Count hesitations: gaps longer than LONG_PAUSE_SECONDS between consecutive
// word timestamps (from Whisper). Empty/absent timestamps -> 0.
function computeLongPauses(words) {
  if (!Array.isArray(words) || words.length < 2) return 0
  let count = 0
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap > LONG_PAUSE_SECONDS) count++
  }
  return count
}

// The one function the rest of the app calls. `reference` carries the text to
// grade against plus optional targets: { text, keyPhrases?, targetWpmMin?,
// targetWpmMax?, fillerWatch? }. `words` are Whisper's word timestamps (optional
// — used for pause detection; scoring still works without them). Missing targets
// fall back to sane defaults.
export function scoreSession({ transcript, durationSeconds, reference, words, semanticCoveragePct }) {
  const tokens = tokenize(transcript)
  const totalWords = tokens.length
  const wpm = durationSeconds > 0 ? Math.round(totalWords / (durationSeconds / 60)) : 0

  const fillerCount = countFillers(transcript, reference.fillerWatch ?? DEFAULT_FILLERS)

  // Literal coverage: exact reference words, in order (LCS).
  const refTokens = tokenize(reference.text)
  const literalCoverage =
    refTokens.length > 0
      ? clamp(Math.round((lcsLength(refTokens, tokens) / refTokens.length) * 100), 0, 100)
      : null
  // Blend with semantic coverage (meaning, from embeddings) when the caller
  // provides it: take the better of the two, so reading verbatim OR paraphrasing
  // both earn credit. Falls back to literal-only if embeddings weren't available.
  const coveragePct =
    literalCoverage === null
      ? null
      : semanticCoveragePct != null
        ? Math.max(literalCoverage, semanticCoveragePct)
        : literalCoverage

  const keyphraseHitPct = computeKeyphraseHit(reference.keyPhrases, transcript)

  const paceScore = computePaceScore(
    wpm,
    reference.targetWpmMin ?? DEFAULT_WPM_MIN,
    reference.targetWpmMax ?? DEFAULT_WPM_MAX
  )
  const fluencyScore = computeFluencyScore(fillerCount, totalWords)
  const coverageScore = coveragePct ?? 0

  // Weighted blend into a single 0..100 score. Key-phrase accuracy only counts
  // when we have a curated reference; custom paragraphs shift that weight onto
  // coverage so the totals still add to 1.
  let overallScore
  if (keyphraseHitPct !== null) {
    overallScore = Math.round(
      0.35 * coverageScore + 0.2 * keyphraseHitPct + 0.25 * paceScore + 0.2 * fluencyScore
    )
  } else {
    overallScore = Math.round(0.45 * coverageScore + 0.3 * paceScore + 0.25 * fluencyScore)
  }

  return {
    wpm,
    fillerCount,
    coveragePct,
    keyphraseHitPct,
    paceScore,
    fluencyScore,
    longPauses: computeLongPauses(words),
    overallScore: clamp(overallScore, 0, 100),
  }
}

// Points feed the gamification counters. Small, always-positive numbers so every
// session feels rewarding; a timed session earns a little extra for the pressure.
export function computePoints(overallScore, timed) {
  return Math.round(overallScore / 10) + (timed ? 2 : 0)
}
