import { useState } from 'react'
import type { ApiResult } from '../../core/api/client'
import { FxModal, FxButton, FxInput, FxTextarea, FxFormError } from '../../fx-ui'
import type { Lookup, LookupPayload } from './personnel-api'

interface LookupFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: Lookup | null
  /** Tekil ad (ör. "Departman", "Kadro") — başlık ve mesajlarda kullanılır. */
  noun: string
  create: (payload: LookupPayload) => Promise<ApiResult<string>>
  update: (id: string, payload: LookupPayload) => Promise<ApiResult>
}

/** Alan üst karakter limitleri (backend DTO'larıyla hizalı). */
const MAX = { name: 150, description: 500 } as const

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

/** Departman/kadro gibi basit lookup'lar için ortak oluştur/düzenle diyaloğu. */
export function LookupFormModal({ open, onClose, onSaved, initial, noun, create, update }: LookupFormModalProps) {
  const isEdit = initial !== null
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
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
    const payload: LookupPayload = {
      name: name.trim(),
      description: description.trim() === '' ? null : description.trim(),
    }
    try {
      const result = isEdit ? await update(initial!.id, payload) : await create(payload)
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
      title={isEdit ? `${noun} Düzenle` : `Yeni ${noun}`}
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
          placeholder={`${noun} adı`}
          maxLength={MAX.name}
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(undefined)
          }}
          className="fx-grid__full"
        />
        <FxTextarea
          label="Açıklama"
          rows={3}
          placeholder="Kısa açıklama (opsiyonel)"
          maxLength={MAX.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
