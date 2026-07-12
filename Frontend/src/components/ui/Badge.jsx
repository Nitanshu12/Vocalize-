export default function Badge({ children, color = 'violet' }) {
  const colors = {
    violet: 'bg-brand-100 text-brand-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    gold:   'bg-amber-50 text-amber-500',
    gray:   'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}
