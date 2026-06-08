import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FxIcon } from '../FxIcon'

export interface FxCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  /** Hata mesajı (kutunun altında). */
  error?: ReactNode
}

/**
 * FxCheckbox — özel görünümlü onay kutusu. Native input gizlenir (erişilebilir kalır),
 * görsel kutu CSS ile çizilir; işaretliyken marka rengi + tik ikonu gösterilir.
 */
export function FxCheckbox({ label, error, id, className = '', disabled, ...rest }: FxCheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={`fx-checkbox-field ${className}`.trim()}>
      <label className={`fx-checkbox ${disabled ? 'fx-checkbox--disabled' : ''}`.trim()} htmlFor={inputId}>
        <input id={inputId} type="checkbox" className="fx-checkbox__input" disabled={disabled} {...rest} />
        <span className="fx-checkbox__box">
          <FxIcon name="check" size={14} className="fx-checkbox__check" />
        </span>
        {label && <span className="fx-checkbox__label">{label}</span>}
      </label>
      {error && (
        <div className="fx-field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
