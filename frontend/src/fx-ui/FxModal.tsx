import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FxIcon } from './FxIcon'

type FxModalSize = 'sm' | 'md' | 'lg'

interface FxModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** Alt aksiyon alanı (örn. İptal/Kaydet butonları). */
  footer?: ReactNode
  size?: FxModalSize
  /** Arka plana tıklayınca kapansın mı (varsayılan: true). */
  closeOnBackdrop?: boolean
}

/**
 * FxModal — portal tabanlı diyalog. Esc ve (opsiyonel) arka plan tıkı ile kapanır,
 * açıkken arka plan kaydırması kilitlenir. Sıfır dış bağımlılık.
 */
export function FxModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: FxModalProps) {
  // Esc ile kapatma + body scroll kilidi (yalnız açıkken).
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fx-modal-overlay"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`fx-modal fx-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {title && (
          <div className="fx-modal__header">
            <div className="fx-modal__title">{title}</div>
            <button type="button" className="fx-icon-btn" onClick={onClose} aria-label="Kapat">
              <FxIcon name="x" size={18} />
            </button>
          </div>
        )}
        <div className="fx-modal__body">{children}</div>
        {footer && <div className="fx-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
