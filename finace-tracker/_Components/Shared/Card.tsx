import type { ReactNode, CSSProperties } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export default function Card({ children, className = '', style, onClick }: CardProps) {
  const interactive = !!onClick
  return (
    <div
      className={`bg-card rounded-xl border border-slate-200 p-6 transition-shadow duration-200 ${
        interactive
          ? 'cursor-pointer hover:shadow-md active:shadow-sm'
          : 'shadow-sm'
      } ${className}`}
      style={style}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
