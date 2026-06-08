import type { ButtonHTMLAttributes, ReactNode } from 'react'

type FxButtonVariant = 'primary' | 'subtle' | 'ghost' | 'danger'
type FxButtonSize = 'sm' | 'md'

interface FxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FxButtonVariant
  size?: FxButtonSize
  iconOnly?: boolean
  children?: ReactNode
}

/**
 * FxButton — temel buton. Varyant ve boyut fx-* class'larıyla yönetilir.
 */
export function FxButton({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
  children,
  ...rest
}: FxButtonProps) {
  const classes = [
    'fx-btn',
    `fx-btn--${variant}`,
    `fx-btn--${size}`,
    iconOnly ? 'fx-btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
