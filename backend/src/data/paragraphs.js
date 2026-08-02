// Curated practice paragraphs for Practice Mode.
//
// These live on the backend (not the frontend) on purpose: each paragraph
// carries scoring metadata — the exact target pace and the key phrases we grade
// against. If that shipped to the browser, the score could be gamed. The client
// only ever receives the "public" fields via `toPublicParagraph`; the scoring
// fields (keyPhrases, target WPM, fillerWatch) never leave the server.
//
// `id` is a stable slug, stored on practice_sessions.paragraph_id.

const PARAGRAPHS = [
  {
    id: 'public-speaking-simple-thank-you',
    title: 'A Simple Thank-You',
    category: 'public_speaking',
    difficulty: 'easy',
    text:
      "Thank you all for being here today. It means a lot to me to see so many " +
      "familiar faces in this room. I want to keep this short and honest. None of " +
      "this would have been possible without your support, your patience, and your " +
      "belief in the work we do together. So from the bottom of my heart, thank you.",
    idealDurationSec: 30,
    targetWpmMin: 110,
    targetWpmMax: 140,
    keyPhrases: ['thank you', 'being here', 'your support', 'together'],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know'],
  },
  {
    id: 'interview-tell-me-about-yourself',
    title: 'Tell Me About Yourself',
    category: 'interview',
    difficulty: 'easy',
    text:
      "I'm someone who genuinely enjoys solving problems and learning new things. " +
      "Over the past few years I've focused on building skills that let me turn " +
      "ideas into real, working results. I care about clear communication and doing " +
      "work I can be proud of. I'm excited about this role because it lets me grow " +
      "while contributing to a team that values quality.",
    idealDurationSec: 35,
    targetWpmMin: 120,
    targetWpmMax: 150,
    keyPhrases: ['solving problems', 'learning new things', 'clear communication', 'this role'],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'so'],
  },
  {
    id: 'interview-greatest-strength',
    title: 'Your Greatest Strength',
    category: 'interview',
    difficulty: 'medium',
    text:
      "My greatest strength is staying calm and organized when things get " +
      "complicated. When a project has many moving parts, I break it down into " +
      "smaller steps, decide what matters most, and keep the team aligned on the " +
      "goal. In my last project, this approach helped us ship on time even after " +
      "the requirements changed midway. I believe clarity under pressure is a skill, " +
      "and it's one I keep sharpening.",
    idealDurationSec: 40,
    targetWpmMin: 125,
    targetWpmMax: 155,
    keyPhrases: [
      'greatest strength',
      'calm and organized',
      'break it down',
      'clarity under pressure',
    ],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'kind of'],
  },
  {
    id: 'presentation-thirty-second-pitch',
    title: 'The 30-Second Pitch',
    category: 'presentation',
    difficulty: 'medium',
    text:
      "Imagine losing an hour every day to work that a computer could do for you. " +
      "That's the problem we set out to solve. Our product automates the boring, " +
      "repetitive parts of your workflow, so your team can focus on the work that " +
      "actually needs a human. Early users are already saving five hours a week. " +
      "We're not just selling software — we're giving people their time back.",
    idealDurationSec: 35,
    targetWpmMin: 130,
    targetWpmMax: 160,
    keyPhrases: [
      'the problem we set out to solve',
      'automates',
      'focus on the work',
      'their time back',
    ],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of'],
  },
  {
    id: 'public-speaking-call-to-action',
    title: 'A Call to Action',
    category: 'public_speaking',
    difficulty: 'hard',
    text:
      "We are standing at a moment that will define the years ahead of us. The " +
      "problems we face are real, but so is our power to solve them. Change has " +
      "never come from waiting for someone else to act first. It comes from " +
      "ordinary people who decide that today is the day. So I'm asking each of you: " +
      "don't leave this room the same as you walked in. Take one step, however " +
      "small, and take it now. Together, that is how the future gets built.",
    idealDurationSec: 45,
    targetWpmMin: 120,
    targetWpmMax: 150,
    keyPhrases: [
      'define the years ahead',
      'our power to solve them',
      'ordinary people',
      'take one step',
      'the future gets built',
    ],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'i mean'],
  },
  {
    id: 'presentation-explaining-the-data',
    title: 'Explaining the Data',
    category: 'presentation',
    difficulty: 'hard',
    text:
      "Let's look at what the numbers are telling us. Over the last quarter, user " +
      "engagement rose by twenty-three percent, while our support costs dropped by " +
      "nearly a third. At first glance those two trends seem unrelated, but they're " +
      "deeply connected. As the product became easier to use, people needed less " +
      "help, and they came back more often. The takeaway is simple: investing in a " +
      "clearer experience didn't just improve satisfaction, it paid for itself.",
    idealDurationSec: 45,
    targetWpmMin: 125,
    targetWpmMax: 155,
    keyPhrases: [
      'what the numbers are telling us',
      'engagement rose',
      'support costs dropped',
      'deeply connected',
      'paid for itself',
    ],
    fillerWatch: ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'right'],
  },
]

// Full list, including scoring metadata — for backend scoring only.
export function getParagraphs() {
  return PARAGRAPHS
}

// One paragraph by slug (or null) — for backend scoring.
export function getParagraphById(id) {
  return PARAGRAPHS.find((p) => p.id === id) ?? null
}

// Strip scoring fields — this is the ONLY shape the client is allowed to see.
export function toPublicParagraph(p) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    difficulty: p.difficulty,
    text: p.text,
    idealDurationSec: p.idealDurationSec,
    targetWpmMin: p.targetWpmMin,
    targetWpmMax: p.targetWpmMax,
  }
}
