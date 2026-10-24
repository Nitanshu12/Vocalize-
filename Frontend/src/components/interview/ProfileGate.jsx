import { useRef, useState } from 'react'
import { Check, FileText, Loader2, Pencil, Sparkles, Upload } from 'lucide-react'
import { profileApi } from '../../lib/api'

/* ProfileGate — the "has the interviewer read about you?" step.
 *
 * PRODUCT REASONING BEHIND THE SHAPE OF THIS COMPONENT
 *
 * 1. It lives on the BRIEF screen, not in onboarding. At sign-up a user has no
 *    reason to hand over a resume; here they have just picked a round and are
 *    looking at their interviewer's name, so the ask lands at the moment of
 *    highest motivation.
 * 2. Skipping never dead-ends. The alternative to uploading is four plain
 *    questions, not "no personalisation" — which is what keeps users without a
 *    resume (school students, first-timers) first-class rather than degraded.
 * 3. It shows what we extracted. People hand over a CV and immediately wonder
 *    what the machine took from it; answering that unprompted buys more trust
 *    than any privacy copy would.
 */

const GUIDED_FIELDS = [
  {
    key: 'studying_or_working',
    label: 'What are you studying or doing right now?',
    placeholder: 'e.g. Final-year B.Tech CSE at VIT — or, Class 9 at DPS',
  },
  {
    key: 'experience',
    label: 'What have you built, done or taken part in?',
    placeholder: 'Internships, projects, clubs, competitions, anything you made',
  },
  {
    key: 'skills',
    label: 'What are you good at?',
    placeholder: 'In your own words — tools, subjects, or things people rely on you for',
  },
  {
    key: 'goal',
    label: 'What are you aiming for next?',
    placeholder: 'e.g. A product internship — or, getting confident at speaking on stage',
  },
]

const EMPTY_GUIDED = { studying_or_working: '', experience: '', skills: '', goal: '' }

export default function ProfileGate({ token, track, profile, onSaved }) {
  // 'summary' when we already have a profile, otherwise the chooser.
  const [mode, setMode] = useState(profile ? 'summary' : 'choose')
  const [answers, setAnswers] = useState(EMPTY_GUIDED)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const canUploadResume = track !== 'school'

  async function submitGuided() {
    setBusy('guided')
    setError('')
    try {
      const { profile: saved } = await profileApi.guided(token, answers)
      onSaved(saved)
      setMode('summary')
    } catch (err) {
      setError(err.message || 'Could not build your profile — please try again.')
    } finally {
      setBusy('')
    }
  }

  async function submitResume(file) {
    if (!file) return
    setBusy('resume')
    setError('')
    try {
      const { profile: saved } = await profileApi.uploadResume(token, file)
      onSaved(saved)
      setMode('summary')
    } catch (err) {
      setError(err.message || 'Could not read that resume — try the quick questions instead.')
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = '' // allow re-picking the same file
    }
  }

  /* ------------------------------- summary ------------------------------- */
  if (mode === 'summary' && profile) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white px-6 py-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Check size={16} /> Your interviewer has read your background
          </p>
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink transition-colors shrink-0"
          >
            <Pencil size={13} /> Update
          </button>
        </div>

        <p className="text-ink leading-snug mb-3">{profile.headline}</p>

        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.skills.slice(0, 8).map((s) => (
              <span
                key={s}
                className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-0.5"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Completeness is a nudge, never a blocker — a thin profile still runs. */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-paper-dark overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width]"
              style={{ width: `${profile.completeness ?? 0}%` }}
            />
          </div>
          <span className="text-xs text-ink-faint tabular-nums shrink-0">
            {profile.completeness ?? 0}% complete
          </span>
        </div>
        {(profile.completeness ?? 0) < 70 && (
          <p className="text-xs text-ink-faint mt-2">
            Add a bit more and your questions get noticeably sharper.
          </p>
        )}
      </div>
    )
  }

  /* -------------------------------- guided ------------------------------- */
  if (mode === 'guided') {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white px-6 py-5 mb-6">
        <p className="handnote text-xl text-brand-700 mb-1">tell us about you</p>
        <p className="text-sm text-ink-soft mb-4">
          Answer what you can — even one or two is enough to make a difference.
        </p>

        <div className="space-y-4">
          {GUIDED_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-ink mb-1.5">{f.label}</label>
              <textarea
                rows={2}
                value={answers[f.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-600 resize-none transition-colors"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-coral mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={submitGuided}
            disabled={busy === 'guided' || !Object.values(answers).some((v) => v.trim())}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            {busy === 'guided' ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Building your profile…
              </>
            ) : (
              <>
                <Sparkles size={17} /> Save background
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  /* -------------------------------- chooser ------------------------------ */
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-6 py-5 mb-6">
      <p className="handnote text-xl text-brand-700 mb-1">make it about you</p>
      <p className="text-sm text-ink-soft mb-4">
        Real interviewers read your background first. Give yours and the questions will be about
        your actual work — not generic ones.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {canUploadResume && (
          <>
            {/* The input is hidden and driven by the styled button: browsers give
                file inputs an unstyleable native look otherwise. */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => submitResume(e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={Boolean(busy)}
              className="text-left rounded-xl border border-ink/15 bg-paper px-4 py-3.5 hover:border-brand-600 disabled:opacity-50 transition-colors"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-ink">
                {busy === 'resume' ? (
                  <Loader2 size={17} className="animate-spin text-brand-600" />
                ) : (
                  <Upload size={17} className="text-brand-600" />
                )}
                {busy === 'resume' ? 'Reading your resume…' : 'Upload resume'}
              </span>
              <span className="block text-xs text-ink-faint mt-1">PDF, DOCX or TXT · fastest</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setMode('guided')}
          disabled={Boolean(busy)}
          className="text-left rounded-xl border border-ink/15 bg-paper px-4 py-3.5 hover:border-brand-600 disabled:opacity-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-ink">
            <FileText size={17} className="text-brand-600" />
            Answer 4 quick questions
          </span>
          <span className="block text-xs text-ink-faint mt-1">
            About 30 seconds · no resume needed
          </span>
        </button>
      </div>

      {error && <p className="text-sm text-coral mt-3">{error}</p>}

      <p className="text-xs text-ink-faint mt-4">
        We keep only your education, experience and skills — never your phone number, email or
        address. You can delete this any time.
      </p>
    </div>
  )
}
