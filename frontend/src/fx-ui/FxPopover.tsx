import { useRef, useState, type ReactNode } from 'react'
import { useClickOutside } from '../core/hooks/useClickOutside'

interface FxPopoverProps {
  /** Tetikleyici. `open` ve `toggle` alır. */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  /** Panel içeriği. Fonksiyon verilirse `close` callback'i alır. */
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  width?: number
  className?: string
}

/**
 * FxPopover — tetikleyici + dışarı tıklayınca/Esc ile kapanan açılır panel.
 * Bildirim menüsü, kullanıcı menüsü vb. için ortak altyapı.
 */
export function FxPopover({ trigger, children, align = 'right', width, className = '' }: FxPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useClickOutside(ref, close, open)

  return (
    <div className="fx-popover-root" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={`fx-popover fx-popover--${align} ${className}`.trim()}
          style={width ? { width } : undefined}
          role="menu"
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
