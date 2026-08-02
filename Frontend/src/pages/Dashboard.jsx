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
} from 'lucide-react'
import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'
import { practiceApi } from '../lib/api'

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
  if (score >= 80) return 'text-leaf bg-leaf/10'
  if (score >= 65) return 'text-gold bg-gold/10'
  return 'text-coral bg-coral/10'
}

/* Circular level ring with an XP-progress arc. */
function LevelRing({ level, progress }) {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 92 92" className="-rotate-90">
        <circle cx="46" cy="46" r={r} fill="none" strokeWidth="7" className="stroke-ink/10" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-brand-600 transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold text-ink leading-none">{level}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          level
        </span>
      </div>
    </div>
  )
}

function StatTile({ value, label }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-5 text-center">
      <p className="font-display text-2xl lg:text-3xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-soft mt-1">{label}</p>
    </div>
  )
}

function ModeCard({ icon: Icon, title, body, live, unlockLabel }) {
  const inner = (
    <div
      className={`relative h-full rounded-2xl border bg-white px-5 py-5 flex flex-col gap-1.5 transition-all ${
        live
          ? 'border-brand-600/40 hover:-translate-y-0.5 hover:shadow-[0_2px_20px_rgba(14,124,134,0.12)]'
          : 'border-ink/10 opacity-70'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-1 ${
          live ? 'bg-brand-50 text-brand-700' : 'bg-ink/5 text-ink-faint'
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="font-display text-lg font-semibold text-ink">{title}</span>
      <span className="text-sm text-ink-soft leading-snug flex-1">{body}</span>
      {live ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 mt-2">
          Start <ArrowRight size={15} />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint border border-dashed border-ink/20 rounded-full px-3 py-1 mt-2 self-start">
          <Lock size={11} /> {unlockLabel}
        </span>
      )}
    </div>
  )
  return live ? (
    <Link to="/app/practice" className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  )
}

export default function Dashboard() {
  const { user, accessToken, logout } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [paragraphTitles, setParagraphTitles] = useState({})
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false
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
    return () => {
      cancelled = true
    }
  }, [accessToken])

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
      <div className="min-h-screen bg-paper grain flex flex-col items-center justify-center">
        <WaveMark className="w-16 h-11 mb-5" animate />
        <p className="handnote text-2xl text-brand-700">loading your journey…</p>
      </div>
    )
  }

  if (status === 'error' || !stats) {
    return (
      <div className="min-h-screen bg-paper grain flex flex-col items-center justify-center px-6 text-center">
        <p className="text-ink-soft mb-6">We couldn't load your dashboard. Please try again.</p>
        <Link
          to="/app/practice"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink text-paper font-semibold"
        >
          Go practice <ArrowRight size={17} />
        </Link>
      </div>
    )
  }

  const { level } = stats
  const xpProgress = level.isMax ? 1 : level.xpForNextLevel ? level.xpIntoLevel / level.xpForNextLevel : 0
  const maxWeekPoints = Math.max(1, ...stats.week.map((d) => d.points))
  const todayKey = stats.week[stats.week.length - 1]?.date

  return (
    <div className="relative min-h-screen bg-paper grain overflow-hidden px-5 sm:px-8 lg:px-12 py-8">
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        {/* top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <WaveMark className="w-9 h-6" />
            <span className="font-display font-semibold text-ink">Vocalize</span>
          </div>
          <button
            onClick={logout}
            className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            Log out
          </button>
        </div>

        {/* ---------------------------------- HERO ---------------------------------- */}
        <section className="rounded-3xl border border-ink/10 bg-white px-6 lg:px-8 py-6 mb-4 animate-fade-up">
          <div className="flex items-center gap-6 flex-wrap">
            <LevelRing level={level.level} progress={xpProgress} />
            <div className="flex-1 min-w-[220px]">
              <p className="handnote text-xl text-brand-700 leading-none mb-1">welcome back, {firstName}</p>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink leading-tight">
                {level.title}
              </h1>
              <div className="mt-3 max-w-md">
                <div className="h-2.5 rounded-full bg-ink/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.round(xpProgress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink-soft mt-1.5 tabular-nums">
                  {level.isMax
                    ? `${level.xpTotal} XP · max level reached`
                    : `${level.xpIntoLevel} / ${level.xpForNextLevel} XP to Level ${level.level + 1} · ${level.nextTitle}`}
                </p>
              </div>
            </div>
            <Link
              to="/app/practice"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-ink text-paper font-semibold text-lg hover:gap-3.5 transition-all"
            >
              Continue <ArrowRight size={19} />
            </Link>
          </div>
        </section>

        {/* two-region grid: main (2/3) + sidebar (1/3), stacks on small screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* =============================== MAIN =============================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* week as sound */}
            <section className="rounded-3xl border border-ink/10 bg-white px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Your week, as sound</h2>
                  <p className="text-xs text-ink-faint">Each day grows with the points you earn.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-3.5 py-1.5">
                  <Flame size={14} /> {stats.currentStreak}-day streak
                </span>
              </div>
              <div className="flex items-end justify-between gap-2 h-24">
                {stats.week.map((day) => {
                  const active = day.sessions > 0
                  const height = active ? 16 + Math.round((day.points / maxWeekPoints) * 56) : 5
                  const isToday = day.date === todayKey
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center justify-end gap-2 flex-1 h-full"
                      title={`${day.points} pts`}
                    >
                      <div
                        className={`w-full max-w-[34px] rounded-lg transition-all ${
                          active ? 'bg-brand-600' : 'bg-ink/10'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                      <span className={`text-xs font-semibold ${isToday ? 'text-ink' : 'text-ink-faint'}`}>
                        {DAY_LETTERS[new Date(day.date).getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile value={stats.totals.bestScore} label="Best score" />
              <StatTile value={stats.totals.avgWpm} label="Avg words / min" />
              <StatTile value={stats.points} label="Total XP" />
              <StatTile value={stats.totals.totalSessions} label="Sessions" />
            </div>

            {/* mode cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ModeCard
                icon={Mic}
                title="Practice a script"
                body="Read it, speak it, get scored — with your AI coach."
                live
              />
              <ModeCard
                icon={MessageCircle}
                title="Interview drill"
                body="Answer real questions on the clock."
                unlockLabel="Level 4"
              />
              <ModeCard
                icon={Presentation}
                title="Presentation room"
                body="Deliver your slides and hold the room."
                unlockLabel="Level 5"
              />
            </div>

            {/* recent sessions */}
            <section className="rounded-3xl border border-ink/10 bg-white px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Recent sessions</h2>
              <p className="text-xs text-ink-faint mb-3">Your last few attempts.</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-ink-soft py-4">
                  No sessions yet —{' '}
                  <Link to="/app/practice" className="text-brand-700 font-semibold">
                    start your first
                  </Link>
                  .
                </p>
              ) : (
                <div>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 py-2.5 border-t border-ink/8 first:border-t-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {s.source === 'library'
                            ? paragraphTitles[s.paragraph_id] ?? 'Practice session'
                            : 'Your own script'}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {relativeDay(s.created_at)} · {s.timed ? 'timed' : 'relaxed'} · {s.mode}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold rounded-full px-2.5 py-1 tabular-nums ${scoreTone(s.overall_score)}`}
                      >
                        {s.overall_score}
                      </span>
                      <span className="text-xs text-ink-soft tabular-nums w-9 text-right">
                        +{s.points_earned}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ============================== SIDEBAR ============================== */}
          <div className="space-y-4">
            {/* today's quests */}
            <section className="rounded-3xl border border-ink/10 bg-white px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Today's quests</h2>
              <p className="text-xs text-ink-faint mb-4">Small wins to keep the streak alive.</p>
              <div className="space-y-2.5">
                {quests.map((q) => (
                  <div key={q.label} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        q.done ? 'bg-leaf text-white' : 'border-2 border-dashed border-ink-faint'
                      }`}
                    >
                      {q.done && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 text-sm ${q.done ? 'text-ink-faint line-through' : 'text-ink'}`}>
                      {q.label}
                    </span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                        q.done ? 'text-leaf bg-leaf/10' : 'text-brand-700 bg-brand-50'
                      }`}
                    >
                      +{q.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* milestones */}
            <section className="rounded-3xl border border-ink/10 bg-white px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Milestones</h2>
              <p className="text-xs text-ink-faint mb-3">Your speaking journey, badge by badge.</p>
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.title} className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                        m.done
                          ? 'bg-brand-50 text-brand-700 border-brand-200'
                          : 'bg-ink/5 text-ink-faint border-ink/10'
                      }`}
                    >
                      {m.done ? <Sparkles size={16} /> : <Lock size={14} />}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${m.done ? 'text-ink' : 'text-ink-soft'}`}>
                        {m.title}
                      </p>
                      <p className="text-xs text-ink-faint">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* weekly league (teaser) */}
            <section className="rounded-3xl border border-ink/10 bg-white px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Weekly league</h2>
              <p className="text-xs text-ink-faint mb-4">Compete with other speakers.</p>
              <div className="flex flex-col items-center justify-center text-center py-2">
                <span className="text-3xl mb-2">🏆</span>
                <p className="text-sm text-ink-soft max-w-[220px]">
                  Leagues are coming soon — climb the ranks as you practice.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
