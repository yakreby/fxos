import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FxField } from './FxField'

export interface FxInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  error?: ReactNode
  hint?: ReactNode
  /** Sol tarafta küçük bir ikon/öğe (opsiyonel). */
  leftAdornment?: ReactNode
}

/**
 * FxInput — etiketli/hata destekli metin girişi. Tüm native input attribute'ları geçer.
 */
export function FxInput({
  label,
  error,
  hint,
  required,
  leftAdornment,
  id,
  className = '',
  ...rest
}: FxInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const inputClass = ['fx-input', error ? 'fx-input--error' : '', className].filter(Boolean).join(' ')

  const control = leftAdornment ? (
    <div className="fx-input-wrap">
      <span className="fx-input-wrap__adornment">{leftAdornment}</span>
      <input id={inputId} className={`${inputClass} fx-input--has-adornment`} required={required} {...rest} />
    </div>
  ) : (
    <input id={inputId} className={inputClass} required={required} {...rest} />
  )

  return (
    <FxField label={label} htmlFor={inputId} required={required} error={error} hint={hint}>
      {control}
    </FxField>
  )
}
