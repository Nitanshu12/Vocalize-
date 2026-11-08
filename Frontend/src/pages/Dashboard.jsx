import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Flame,
  Lock,
  MessageCircle,
  Mic,
  Presentation,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { motion } from 'motion/react'
import { WaveLoader } from '../components/ui/Loader'
import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'
import { practiceApi, interviewApi } from '../lib/api'

/* The "Speaker's Journey" dashboard — the product's home base. Everything here is
 * driven by real data from GET /practice/stats (level/XP, streak, week, totals)
 * and GET /practice/sessions (recent history). Quests are derived from today's
 * sessions on the client; the weekly league is a teaser until ranking exists.
 *
 * Layout: a full-width hero, then a two-region grid (main 2/3 + sidebar 1/3) that
 * collapses to a single column on small screens. */

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isSameLocalDay(iso, ref = new Date()) {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

function relativeDay(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (isSameLocalDay(iso, today)) return 'Today'
  if (isSameLocalDay(iso, yesterday)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long' })
}

function scoreTone(score) {
  if (score >= 80) return 'text-leaf'
  if (score >= 65) return 'text-gold'
  return 'text-coral'
}

const EASE = [0.16, 1, 0.3, 1]

/* Circular level ring with an XP-progress arc. */
function LevelRing({ level, progress }) {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 92 92" className="-rotate-90" aria-hidden="true">
        <circle cx="46" cy="46" r={r} fill="none" strokeWidth="7" className="stroke-paper-deep" />
        <motion.circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-accent"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink leading-none">{level}</span>
        <span className="text-xs text-ink-faint">level</span>
      </div>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="px-5 py-5 first:pl-0 border-l border-rule first:border-l-0">
      <p className="font-display text-3xl lg:text-4xl font-bold tracking-[-0.04em] text-ink tabular-nums">{value}</p>
      <p className="text-sm text-ink-faint mt-1">{label}</p>
    </div>
  )
}

function ModeCard({ icon: Icon, title, body, live, unlockLabel, tone, to = '/app/practice' }) {
  const inner = (
    <div
      className={`group relative h-full rounded-card px-6 py-6 flex flex-col gap-2 transition-transform duration-300 ease-out ${
        live ? `${tone} group-hover:-translate-y-1` : 'border border-dashed border-rule text-ink-faint'
      }`}
    >
      <Icon size={22} strokeWidth={1.8} className="mb-6" />
      <span className="font-display text-2xl font-bold tracking-[-0.03em]">{title}</span>
      <span className={`leading-snug flex-1 ${live ? 'opacity-80' : ''}`}>{body}</span>
      {live ? (
        <span className="inline-flex items-center gap-1.5 font-semibold mt-3">
          Start <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm mt-3">
          <Lock size={13} /> Opens at {unlockLabel}
        </span>
      )}
    </div>
  )
  return live ? (
    <Link to={to} className="group block h-full rounded-card">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  )
}

function SideSection({ title, note, children }) {
  return (
    <section className="py-6 border-b border-rule last:border-b-0 first:pt-0">
      <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">{title}</h2>
      <p className="text-sm text-ink-faint mb-4">{note}</p>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { user, accessToken, logout } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [interviews, setInterviews] = useState([])
  const [paragraphTitles, setParagraphTitles] = useState({})
  const [typeLabels, setTypeLabels] = useState({})
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false
    // Core data — the dashboard can't render without these.
    Promise.all([
      practiceApi.stats(accessToken),
      practiceApi.history(accessToken),
      practiceApi.paragraphs(accessToken),
    ])
      .then(([statsData, historyData, paraData]) => {
        if (cancelled) return
        setStats(statsData)
        setSessions(historyData.sessions ?? [])
        setParagraphTitles(
          Object.fromEntries((paraData.paragraphs ?? []).map((p) => [p.id, p.title]))
        )
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))

    // Interview data is additive — if it fails (e.g. table not migrated yet), the
    // dashboard still loads with practice data instead of erroring out.
    interviewApi
      .history(accessToken)
      .then((d) => !cancelled && setInterviews(d.sessions ?? []))
      .catch(() => {})
    interviewApi
      .types(accessToken)
      .then((d) => !cancelled && setTypeLabels(Object.fromEntries((d.types ?? []).map((t) => [t.id, t.label]))))
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [accessToken])

  // One activity feed across practice + interview, newest first.
  const recentItems = useMemo(() => {
    const practice = sessions.map((s) => ({
      key: `p-${s.id}`,
      kind: 'practice',
      title:
        s.source === 'library'
          ? paragraphTitles[s.paragraph_id] ?? 'Practice session'
          : 'Your own script',
      meta: `${s.timed ? 'timed' : 'relaxed'}, ${s.mode}`,
      score: s.overall_score,
      points: s.points_earned,
      at: s.created_at,
    }))
    const interview = interviews.map((s) => ({
      key: `i-${s.id}`,
      kind: 'interview',
      title: typeLabels[s.type_id] ?? 'Mock interview',
      meta: 'mock interview',
      score: s.overall_score,
      points: s.points_earned,
      at: s.created_at,
    }))
    return [...practice, ...interview]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6)
  }, [sessions, interviews, paragraphTitles, typeLabels])

  // Today's quests — derived from today's sessions, no backend tracking needed.
  const quests = useMemo(() => {
    const today = sessions.filter((s) => isSameLocalDay(s.created_at))
    return [
      { label: 'Complete a practice session', done: today.length >= 1, xp: 10 },
      { label: 'Score 75 or higher', done: today.some((s) => s.overall_score >= 75), xp: 15 },
      { label: 'Try a timed session', done: today.some((s) => s.timed), xp: 15 },
    ]
  }, [sessions])

  const milestones = useMemo(() => {
    if (!stats) return []
    return [
      { title: 'First Word', body: 'Finish your first session', done: stats.totals.totalSessions >= 1 },
      { title: 'Finding Your Voice', body: 'Reach a 3-day streak', done: stats.longestStreak >= 3 },
      { title: 'Room Holder', body: 'Score 80 or higher', done: stats.totals.bestScore >= 80 },
      { title: 'Spotlight', body: 'Reach a 30-day streak', done: stats.longestStreak >= 30 },
    ]
  }, [stats])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <WaveLoader label="Loading your journey…" />
      </div>
    )
  }

  if (status === 'error' || !stats) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 text-center">
        <p className="text-ink-soft mb-6">We couldn't load your dashboard. Please try again.</p>
        <Link to="/app/practice" className="btn btn-primary">
          Go practice <ArrowRight size={17} className="btn-arrow" />
        </Link>
      </div>
    )
  }

  const { level } = stats
  const xpProgress = level.isMax ? 1 : level.xpForNextLevel ? level.xpIntoLevel / level.xpForNextLevel : 0
  const maxWeekPoints = Math.max(1, ...stats.week.map((d) => d.points))
  const todayKey = stats.week[stats.week.length - 1]?.date

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <div className="border-b border-rule">
        <div className="shell h-[72px] flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-3 rounded-control">
            <WaveMark className="w-8 h-6 text-accent" />
            <span className="font-display text-xl font-bold tracking-[-0.03em] text-ink">Vocalize</span>
          </Link>
          <button onClick={logout} className="btn btn-sm btn-ghost">
            Log out
          </button>
        </div>
      </div>

      <div className="shell py-12">
        {/* ---------------------------------- HEADER ---------------------------------- */}
        <motion.header
          className="flex flex-wrap items-end gap-8 justify-between mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="flex items-center gap-6 min-w-0">
            <LevelRing level={level.level} progress={xpProgress} />
            <div className="min-w-0">
              <p className="text-ink-soft mb-1">Welcome back, {firstName}</p>
              <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.045em] leading-none text-ink">
                {level.title}
              </h1>
              <div className="mt-4 w-[min(28rem,70vw)]">
                <div className="h-2 rounded-sm bg-paper-deep overflow-hidden">
                  <motion.div
                    className="h-full bg-accent origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: xpProgress }}
                    transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
                  />
                </div>
                <p className="text-sm text-ink-faint mt-2 tabular-nums">
                  {level.isMax
                    ? `${level.xpTotal} XP, max level reached`
                    : `${level.xpIntoLevel} / ${level.xpForNextLevel} XP to Level ${level.level + 1}, ${level.nextTitle}`}
                </p>
              </div>
            </div>
          </div>
          <Link to="/app/practice" className="btn btn-primary btn-lg">
            Continue <ArrowRight size={19} className="btn-arrow" />
          </Link>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-10 items-start">
          {/* =============================== MAIN =============================== */}
          <div className="space-y-10 min-w-0">
            {/* week as sound */}
            <section className="panel px-6 lg:px-8 py-7">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Your week, as sound</h2>
                  <p className="text-sm text-ink-faint">Each day grows with the points you earn.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-semibold text-gold">
                  <Flame size={16} /> {stats.currentStreak}-day streak
                </span>
              </div>
              <div className="flex items-end justify-between gap-2 sm:gap-3 h-36">
                {stats.week.map((day, i) => {
                  const active = day.sessions > 0
                  const height = active ? 22 + Math.round((day.points / maxWeekPoints) * 78) : 6
                  const isToday = day.date === todayKey
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center justify-end gap-2 flex-1 h-full"
                      title={`${day.points} pts`}
                    >
                      <motion.div
                        className={`w-full rounded-md origin-bottom ${active ? (isToday ? 'bg-accent-soft' : 'bg-accent') : 'bg-paper-deep'}`}
                        style={{ height: `${height}%` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: EASE }}
                      />
                      <span className={`text-sm ${isToday ? 'text-ink font-semibold' : 'text-ink-faint'}`}>
                        {DAY_LETTERS[new Date(day.date).getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-rule">
              <Stat value={stats.totals.bestScore} label="Best score" />
              <Stat value={stats.totals.avgWpm} label="Avg words / min" />
              <Stat value={stats.points} label="Total XP" />
              <Stat value={stats.totals.totalSessions} label="Sessions" />
            </div>

            {/* rooms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <ModeCard
                icon={Mic}
                title="Practice a script"
                body="Read it, speak it, get scored, with your AI coach."
                tone="bg-accent text-accent-ink"
                live
              />
              <ModeCard
                icon={MessageCircle}
                title="Mock interview"
                body="A voice interviewer that listens, probes, and scores you."
                tone="bg-accent-soft text-accent-ink"
                live
                to="/app/interview"
              />
              <ModeCard
                icon={Presentation}
                title="Presentation room"
                body="Deliver your slides and hold the room."
                unlockLabel="Level 5"
              />
            </div>

            {/* recent sessions */}
            <section>
              <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Recent sessions</h2>
              <p className="text-sm text-ink-faint mb-4">Your last few attempts.</p>
              {recentItems.length === 0 ? (
                <p className="text-ink-soft py-4 border-t border-rule">
                  No sessions yet.{' '}
                  <Link to="/app/practice" className="text-accent font-semibold hover:underline underline-offset-4">
                    Start your first
                  </Link>
                  .
                </p>
              ) : (
                <ul className="border-t border-rule">
                  {recentItems.map((s) => (
                    <li key={s.key} className="grid grid-cols-[2rem_minmax(0,1fr)_3rem_3rem] items-center gap-4 py-4 border-b border-rule">
                      <span className="text-ink-faint">
                        {s.kind === 'interview' ? <MessageCircle size={18} /> : <Mic size={18} />}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{s.title}</p>
                        <p className="text-sm text-ink-faint">
                          {relativeDay(s.at)}, {s.meta}
                        </p>
                      </div>
                      <span className={`font-display text-xl font-bold text-right tabular-nums ${scoreTone(s.score)}`}>
                        {s.score}
                      </span>
                      <span className="text-sm text-ink-soft tabular-nums text-right">+{s.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* ============================== SIDEBAR ============================== */}
          <aside className="panel px-6 py-7 lg:sticky lg:top-8">
            <SideSection title="Today's quests" note="Small wins to keep the streak alive.">
              <ul className="space-y-3">
                {quests.map((q) => (
                  <li key={q.label} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        q.done ? 'bg-leaf text-accent-ink' : 'border border-dashed border-ink-faint'
                      }`}
                    >
                      {q.done && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 ${q.done ? 'text-ink-faint line-through' : 'text-ink'}`}>{q.label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${q.done ? 'text-leaf' : 'text-accent'}`}>
                      +{q.xp} XP
                    </span>
                  </li>
                ))}
              </ul>
            </SideSection>

            <SideSection title="Milestones" note="Your speaking journey, badge by badge.">
              <ul className="space-y-4">
                {milestones.map((m) => (
                  <li key={m.title} className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                        m.done ? 'bg-accent text-accent-ink' : 'bg-paper-deep text-ink-faint'
                      }`}
                    >
                      {m.done ? <Sparkles size={16} /> : <Lock size={14} />}
                    </span>
                    <div>
                      <p className={`font-semibold ${m.done ? 'text-ink' : 'text-ink-soft'}`}>{m.title}</p>
                      <p className="text-sm text-ink-faint">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SideSection>

            <SideSection title="Weekly league" note="Compete with other speakers.">
              <div className="flex items-start gap-3">
                <Trophy size={20} className="text-accent shrink-0 mt-0.5" />
                <p className="text-ink-soft">Leagues are coming soon. Climb the ranks as you practice.</p>
              </div>
            </SideSection>
          </aside>
        </div>
      </div>
    </div>
  )
}
