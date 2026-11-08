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
      title="Good to see you again."
      subtitle="Log in to pick up where you left off."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <p className="notice notice-error" role="alert">{formError}</p>
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
          className="btn btn-primary w-full"
        >
          {submitting ? 'Logging in…' : 'Log in'}
          {!submitting && <ArrowRight size={17} className="btn-arrow" />}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-8">
        New to Vocalize?{' '}
        <Link to="/register" className="font-semibold text-accent hover:text-accent-soft underline-offset-4 hover:underline transition-colors">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
