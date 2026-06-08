import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FxField } from './FxField'

export interface FxDatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  error?: ReactNode
  hint?: ReactNode
}

/**
 * FxDatePicker — tarih seçici. Native `<input type="date">` üzerine kurulu
 * (sıfır dış bağımlılık; takvim açılışı ve yerelleştirme tarayıcıdan). Değer `YYYY-MM-DD`.
 */
export function FxDatePicker({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  ...rest
}: FxDatePickerProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const inputClass = [
    'fx-input',
    'fx-input--date',
    error ? 'fx-input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <FxField label={label} htmlFor={inputId} required={required} error={error} hint={hint}>
      <input id={inputId} type="date" className={inputClass} required={required} {...rest} />
    </FxField>
  )
}
