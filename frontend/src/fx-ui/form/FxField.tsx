import type { ReactNode } from 'react'

export interface FxFieldProps {
  /** Alan etiketi (görünür label). */
  label?: ReactNode
  /** İlişkili kontrolün id'si (label `htmlFor`). */
  htmlFor?: string
  /** Zorunlu alan işareti (*) gösterir. */
  required?: boolean
  /** Hata mesajı; verilirse hint yerine kırmızı gösterilir. */
  error?: ReactNode
  /** Yardımcı açıklama (hata yokken gösterilir). */
  hint?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * FxField — form kontrollerinin ortak sarmalayıcısı: label, zorunlu işareti,
 * hata/hint satırı. FxInput/FxSelect/FxTextarea/FxDatePicker bunu kullanır.
 */
export function FxField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}: FxFieldProps) {
  return (
    <div className={`fx-field ${className}`.trim()}>
      {label && (
        <label className="fx-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="fx-label__req" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <div className="fx-field__error" role="alert">
          {error}
        </div>
      ) : hint ? (
        <div className="fx-field__hint">{hint}</div>
      ) : null}
    </div>
  )
}
