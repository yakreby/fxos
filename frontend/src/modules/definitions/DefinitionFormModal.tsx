import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxCheckbox, FxFormError } from '../../fx-ui'
import {
  createDefinition,
  updateDefinition,
  type Definition,
  type DefinitionType,
} from './definitions-api'

interface DefinitionFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: Definition | null
  /** Yeni kayıt için tür (düzenlemede initial'dan gelir). */
  type: DefinitionType
  /** Tür etiketi (başlıkta gösterilir). */
  typeLabel: string
}

/** Alan üst karakter limitleri (backend DTO'larıyla hizalı). */
const MAX = { name: 200, code: 50 } as const

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

/** Tanım (lookup) oluştur/düzenle diyaloğu. */
export function DefinitionFormModal({ open, onClose, onSaved, initial, type, typeLabel }: DefinitionFormModalProps) {
  const isEdit = initial !== null
  const [name, setName] = useState(initial?.name ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    if (name.trim() === '') {
      setNameError('Ad zorunludur.')
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const trimmedCode = code.trim()
    const common = {
      name: name.trim(),
      code: trimmedCode === '' ? null : trimmedCode,
      isActive,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
    }
    try {
      const result = isEdit
        ? await updateDefinition(initial!.id, common)
        : await createDefinition({ type, ...common })
      if (result.succeeded) {
        onSaved()
        onClose()
      } else if (result.errors?.length) {
        setFormError({ title: 'Eksik veya hatalı alanlar', errors: result.errors })
      } else {
        setFormError({ message: result.message ?? 'İşlem başarısız.' })
      }
    } catch {
      setFormError({ message: 'Sunucuya ulaşılamadı.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? `${typeLabel} Düzenle` : `Yeni ${typeLabel}`}
      size="md"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Kaydet'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxInput
          label="Ad"
          required
          placeholder={`${typeLabel} adı`}
          maxLength={MAX.name}
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(undefined)
          }}
          className="fx-grid__full"
        />
        <FxInput
          label="Kod"
          placeholder="Opsiyonel kısa kod (ör. 150103)"
          maxLength={MAX.code}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <FxInput
          label="Sıra"
          type="number"
          placeholder="0"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          hint="Listelemede küçük olan önce gelir."
        />
        <FxCheckbox
          label="Aktif (yeni kayıtlarda seçilebilir)"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
