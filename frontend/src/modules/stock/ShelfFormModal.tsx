import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxTextarea, FxCheckbox, FxFormError } from '../../fx-ui'
import { createShelf, updateShelf, type Shelf, type ShelfPayload } from './stock-api'

interface ShelfFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial: Shelf | null
}

const MAX = { code: 50, name: 200, notes: 500 } as const

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

const numOrNull = (s: string): number | null => {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Raf oluştur/düzenle diyaloğu. */
export function ShelfFormModal({ open, onClose, onSaved, initial }: ShelfFormModalProps) {
  const isEdit = initial !== null
  const [code, setCode] = useState(initial?.code ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [codeError, setCodeError] = useState<string | undefined>(undefined)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    let invalid = false
    if (code.trim() === '') { setCodeError('Kod zorunludur.'); invalid = true }
    if (name.trim() === '') { setNameError('Ad zorunludur.'); invalid = true }
    if (invalid) {
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: ShelfPayload = {
      code: code.trim(),
      name: name.trim(),
      capacity: numOrNull(capacity),
      isActive,
      notes: notes.trim() === '' ? null : notes.trim(),
    }
    try {
      const result = isEdit ? await updateShelf(initial!.id, payload) : await createShelf(payload)
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
      title={isEdit ? 'Raf Düzenle' : 'Yeni Raf'}
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
          label="Kod"
          required
          placeholder="Örn. KT1-A-01"
          maxLength={MAX.code}
          value={code}
          error={codeError}
          onChange={(e) => { setCode(e.target.value); if (codeError) setCodeError(undefined) }}
        />
        <FxInput
          label="Ad"
          required
          placeholder="Örn. Depo 1 Raf A1"
          maxLength={MAX.name}
          value={name}
          error={nameError}
          onChange={(e) => { setName(e.target.value); if (nameError) setNameError(undefined) }}
        />
        <FxInput
          label="Kapasite"
          type="number"
          step="0.001"
          placeholder="Adet/KG (opsiyonel)"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <FxCheckbox
          label="Aktif (yeni hareketlerde seçilebilir)"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <FxTextarea
          label="Not"
          rows={2}
          placeholder="Raf ile ilgili kısa not (opsiyonel)"
          maxLength={MAX.notes}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
