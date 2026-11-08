export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    outline: 'btn-ghost',
    ghost: 'btn-ghost border-transparent',
    white: 'btn-secondary',
  }
  const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' }
  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
