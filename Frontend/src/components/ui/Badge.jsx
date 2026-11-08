export default function Badge({ children, color = 'violet' }) {
  const colors = {
    violet: 'bg-paper-deep text-accent',
    green: 'bg-leaf/10 text-leaf',
    amber: 'bg-gold/10 text-gold',
    gold: 'bg-gold/10 text-gold',
    gray: 'bg-surface text-ink-soft',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}
