export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer'

  const variants = {
    primary:  'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md hover:shadow-brand-600/20',
    outline:  'border border-gray-300 text-gray-700 bg-white hover:border-brand-600 hover:text-brand-600',
    ghost:    'text-gray-600 hover:text-brand-600 hover:bg-brand-50',
    white:    'bg-white text-brand-600 hover:bg-brand-50 shadow-sm',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
