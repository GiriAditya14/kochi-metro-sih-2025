export default function GlassCard({ 
  variant = 'default', 
  hover = false, 
  padding = 'md', 
  className = '', 
  children,
  style = {}
}) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantStyles = {
    default: {
      background: 'var(--glass-bg)',
      borderColor: 'var(--glass-border)'
    },
    light: {
      background: 'rgba(var(--color-bg-primary), 0.6)',
      borderColor: 'rgb(var(--color-border))'
    },
    strong: {
      background: 'var(--glass-bg-strong)',
      borderColor: 'rgb(var(--color-border-hover))'
    },
    accent: {
      background: 'rgba(59, 130, 246, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    }
  }

  return (
    <div
      className={`relative rounded-xl border shadow-lg transition-all duration-300 ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-xl cursor-pointer' : ''
      } ${paddingClasses[padding]} ${className}`}
      style={{
        ...variantStyles[variant],
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 var(--glass-shadow)',
        zIndex: 10,
        ...style
      }}
    >
      {children}
    </div>
  )
}
