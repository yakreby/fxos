import type { ReactNode } from 'react'
import { FxIcon } from '../FxIcon'

export interface FxFormErrorProps {
  /** Kalın başlık. Varsayılan: "İşlem tamamlanamadı". */
  title?: ReactNode
  /** Madde madde gösterilecek hatalar. */
  errors?: readonly string[] | null
  /** Tek satırlık mesaj (errors boş/verilmemişse gösterilir). */
  message?: ReactNode
  className?: string
}

/**
 * FxFormError — form/diyalog hata özeti: kalın başlık + madde listesi.
 * Hiç hata yoksa hiçbir şey render etmez (koşullu sarmalamaya gerek kalmaz).
 */
export function FxFormError({
  title = 'İşlem tamamlanamadı',
  errors,
  message,
  className = '',
}: FxFormErrorProps) {
  const list = (errors ?? []).filter(Boolean)
  if (list.length === 0 && !message) return null

  return (
    <div className={`fx-form-error ${className}`.trim()} role="alert">
      <div className="fx-form-error__title">
        <FxIcon name="alert-circle" size={16} />
        <strong>{title}</strong>
      </div>
      {list.length > 0 ? (
        <ul className="fx-form-error__list">
          {list.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : (
        <div className="fx-form-error__msg">{message}</div>
      )}
    </div>
  )
}
