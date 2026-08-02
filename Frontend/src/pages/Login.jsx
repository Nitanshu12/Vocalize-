import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await login(form)
      navigate('/app/dashboard')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Good to see you again."
      subtitle="Log in to pick up where you left off."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3">{formError}</p>
        )}

        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-ink text-paper font-semibold hover:bg-ink/85 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Logging in…' : 'Log in'}
          {!submitting && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-8">
        New to Vocalize?{' '}
        <Link to="/register" className="font-semibold text-ink hover:text-brand-700 transition-colors">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
