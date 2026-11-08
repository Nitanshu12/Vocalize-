import { useId } from 'react'

export default function AuthInput({ label, error, className = '', ...props }) {
  const errorId = useId()
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-ink-soft mb-2">{label}</span>
      <input
        className="field"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <span id={errorId} className="block text-sm text-coral mt-1.5">{error}</span>}
    </label>
  )
}
