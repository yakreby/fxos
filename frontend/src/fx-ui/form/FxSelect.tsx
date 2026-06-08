import { useId, type SelectHTMLAttributes, type ReactNode } from 'react'
import { FxField } from './FxField'

export interface FxSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FxSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: ReactNode
  error?: ReactNode
  hint?: ReactNode
  options: FxSelectOption[]
  /** Boş/seçilmemiş durumda gösterilecek placeholder seçeneği. */
  placeholder?: string
}

/**
 * FxSelect — etiketli/hata destekli açılır liste. Native `<select>` üzerine kurulu
 * (erişilebilir), özel ok ikonu CSS ile çizilir.
 */
export function FxSelect({
  label,
  error,
  hint,
  required,
  options,
  placeholder,
  id,
  className = '',
  value,
  ...rest
}: FxSelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const selectClass = [
    'fx-input',
    'fx-input--select',
    error ? 'fx-input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <FxField label={label} htmlFor={selectId} required={required} error={error} hint={hint}>
      <div className="fx-select-wrap">
        <select id={selectId} className={selectClass} required={required} value={value} {...rest}>
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="fx-select-wrap__arrow" aria-hidden="true" />
      </div>
    </FxField>
  )
}
