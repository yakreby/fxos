import { FxIcon, type FxIconName } from '../FxIcon'
import type { ToastItem, ToastType } from './ToastContext'

const ICON_BY_TYPE: Record<ToastType, FxIconName> = {
  success: 'shield',
  error: 'x',
  warning: 'bell',
  info: 'activity',
}

interface FxToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

/**
 * Toast'ların render edildiği sabit konumlu kapsayıcı (sağ üst).
 */
export function FxToastContainer({ toasts, onDismiss }: FxToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fx-toast-container" role="region" aria-label="Bildirimler">
      {toasts.map((toast) => (
        <div key={toast.id} className={`fx-toast fx-toast--${toast.type}`} role="alert">
          <div className="fx-toast__icon">
            <FxIcon name={ICON_BY_TYPE[toast.type]} size={18} />
          </div>
          <div className="fx-toast__body">
            {toast.title && <div className="fx-toast__title">{toast.title}</div>}
            <div className="fx-toast__message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="fx-toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Kapat"
          >
            <FxIcon name="x" size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
