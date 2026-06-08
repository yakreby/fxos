import { useId, type TextareaHTMLAttributes, type ReactNode } from 'react'
import { FxField } from './FxField'

export interface FxTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  error?: ReactNode
  hint?: ReactNode
}

/**
 * FxTextarea — etiketli/hata destekli çok satırlı metin girişi.
 */
export function FxTextarea({
  label,
  error,
  hint,
  required,
  id,
  rows = 4,
  className = '',
  ...rest
}: FxTextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const textareaClass = [
    'fx-input',
    'fx-textarea',
    error ? 'fx-input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <FxField label={label} htmlFor={fieldId} required={required} error={error} hint={hint}>
      <textarea id={fieldId} className={textareaClass} required={required} rows={rows} {...rest} />
    </FxField>
  )
}
