import type { HTMLAttributes, ReactNode } from 'react'

interface FxCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
}

/**
 * FxCard — yüzey kartı. Opsiyonel başlık + sağ üst aksiyon alanı.
 */
export function FxCard({ title, action, className = '', children, ...rest }: FxCardProps) {
  return (
    <div className={`fx-card ${className}`.trim()} {...rest}>
      {(title || action) && (
        <div className="fx-card__header">
          {title && <div className="fx-card__title">{title}</div>}
          {action && <div className="fx-card__action">{action}</div>}
        </div>
      )}
      <div className="fx-card__body">{children}</div>
    </div>
  )
}
