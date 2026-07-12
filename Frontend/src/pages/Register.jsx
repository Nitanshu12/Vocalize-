import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
      })
      navigate('/app')
    } catch (err) {
      if (err instanceof ApiError && err.details?.fieldErrors) {
        setFieldErrors(err.details.fieldErrors)
      }
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Free. No credit card."
      title="Start speaking, out loud."
      subtitle="Create your account — your first session is two minutes away."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <p className="text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-3">{formError}</p>
        )}

        <AuthInput
          label="Name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={update('name')}
        />
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email?.[0]}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password?.[0]}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-ink text-paper font-semibold hover:bg-ink/85 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Creating account…' : 'Create account'}
          {!submitting && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-8">
        Already practicing with us?{' '}
        <Link to="/login" className="font-semibold text-ink hover:text-brand-700 transition-colors">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
