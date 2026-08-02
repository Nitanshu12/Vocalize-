// Pure gamification logic — levels & XP. No DB, no I/O; just math over a points
// total, so it's easy to reason about and test.
//
// XP == the user's total_points. Each level has a cumulative XP threshold. Early
// levels are cheap (fast wins keep new users motivated); later ones cost more.
// Titles mirror the "Speaker's Journey" concept.

const LEVELS = [
  { level: 1, minXp: 0, title: 'First Word' },
  { level: 2, minXp: 30, title: 'Finding Your Voice' },
  { level: 3, minXp: 80, title: 'Voice Finder' },
  { level: 4, minXp: 160, title: 'Room Holder' },
  { level: 5, minXp: 280, title: 'Stage Ready' },
  { level: 6, minXp: 450, title: 'Spotlight' },
]

// Given a total XP, return the current level and how far along it the user is.
//   { level, title, xpTotal, xpIntoLevel, xpForNextLevel, isMax }
// xpForNextLevel is null once the top level is reached.
export function levelFromPoints(xpTotal) {
  const xp = Math.max(0, xpTotal ?? 0)

  // Highest level whose threshold we've crossed.
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) idx = i
  }
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null

  return {
    level: current.level,
    title: current.title,
    xpTotal: xp,
    xpIntoLevel: xp - current.minXp,
    xpForNextLevel: next ? next.minXp - current.minXp : null,
    nextTitle: next ? next.title : null,
    isMax: !next,
  }
}
