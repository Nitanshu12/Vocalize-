export default function AuthInput({ label, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      <input
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-ink placeholder:text-ink-faint outline-none transition-colors ${
          error
            ? 'border-coral focus:border-coral'
            : 'border-ink/15 focus:border-brand-600'
        }`}
        {...props}
      />
      {error && <span className="block text-sm text-coral mt-1.5">{error}</span>}
    </label>
  )
}
