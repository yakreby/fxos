import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxField, FxFormError } from '../../fx-ui'
import {
  uploadDocument,
  updateDocument,
  DOCUMENT_TYPE_OPTIONS,
  type Doc,
  type DocumentType,
  type UpdateDocumentPayload,
} from './documents-api'

interface DocumentFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  personnelId: string
  /** Düzenlenecek belge; null ise yeni yükleme. */
  initial: Doc | null
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt'
const MAX_BYTES = 20 * 1024 * 1024

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '')

/**
 * Belge yükleme/düzenleme diyaloğu. Yeni kayıtta dosya zorunludur; düzenlemede
 * yalnızca meta veri değişir (dosya korunur). State prop'tan başlatılır (key ile remount).
 */
export function DocumentFormModal({ open, onClose, onSaved, personnelId, initial }: DocumentFormModalProps) {
  const isEdit = initial !== null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<DocumentType>(initial?.type ?? 99)
  const [issueDate, setIssueDate] = useState(toDateInput(initial?.issueDate ?? null))
  const [expiryDate, setExpiryDate] = useState(toDateInput(initial?.expiryDate ?? null))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | undefined>(undefined)
  const [fileError, setFileError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const typeOptions = DOCUMENT_TYPE_OPTIONS.map((t) => ({ value: String(t.value), label: t.label }))

  const validate = (): boolean => {
    let ok = true
    setFormError(null)
    if (title.trim() === '') {
      setTitleError('Başlık zorunludur.')
      ok = false
    }
    if (!isEdit) {
      if (!file) {
        setFileError('Dosya seçiniz.')
        ok = false
      } else if (file.size > MAX_BYTES) {
        setFileError('Dosya 20 MB sınırını aşıyor.')
        ok = false
      }
    }
    if (!ok) setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları kontrol edin.' })
    return ok
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEdit) {
        const payload: UpdateDocumentPayload = {
          title: title.trim(),
          type,
          issueDate: issueDate === '' ? null : issueDate,
          expiryDate: expiryDate === '' ? null : expiryDate,
          notes: notes.trim() === '' ? null : notes.trim(),
        }
        const res = await updateDocument(initial!.id, payload)
        if (res.succeeded) {
          onSaved()
          onClose()
        } else if (res.errors?.length) {
          setFormError({ title: 'Eksik veya hatalı alanlar', errors: res.errors })
        } else {
          setFormError({ message: res.message ?? 'İşlem başarısız.' })
        }
      } else {
        const form = new FormData()
        form.append('Title', title.trim())
        form.append('Type', String(type))
        if (issueDate !== '') form.append('IssueDate', issueDate)
        if (expiryDate !== '') form.append('ExpiryDate', expiryDate)
        if (notes.trim() !== '') form.append('Notes', notes.trim())
        form.append('File', file!)

        const res = await uploadDocument(personnelId, form)
        if (res.succeeded) {
          onSaved()
          onClose()
        } else if (res.errors?.length) {
          setFormError({ title: 'Eksik veya hatalı alanlar', errors: res.errors })
        } else {
          setFormError({ message: res.message ?? 'Yükleme başarısız.' })
        }
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
      title={isEdit ? 'Belgeyi Düzenle' : 'Belge Yükle'}
      size="md"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : isEdit ? 'Kaydet' : 'Yükle'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxInput
          label="Başlık"
          required
          placeholder="Örn. 2025 İş Sözleşmesi"
          maxLength={200}
          value={title}
          error={titleError}
          onChange={(e) => {
            setTitle(e.target.value)
            if (titleError) setTitleError(undefined)
          }}
          className="fx-grid__full"
        />
        <FxSelect
          label="Tür"
          options={typeOptions}
          value={String(type)}
          onChange={(e) => setType(Number(e.target.value) as DocumentType)}
        />
        {!isEdit && (
          <FxField
            label="Dosya"
            required
            error={fileError}
            hint="PDF, görsel veya Office belgesi · en fazla 20 MB"
          >
            <input
              type="file"
              className="fx-input fx-input--file"
              accept={ACCEPT}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                if (fileError) setFileError(undefined)
              }}
            />
          </FxField>
        )}
        <FxDatePicker label="Düzenlenme Tarihi" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        <FxDatePicker label="Son Geçerlilik" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        <FxTextarea
          label="Not"
          rows={2}
          placeholder="Belge ile ilgili kısa not (opsiyonel)"
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      {isEdit && (
        <div className="fx-field__hint" style={{ marginTop: 4 }}>
          Mevcut dosya: <strong>{initial!.fileName}</strong> (değiştirmek için belgeyi silip yeniden yükleyin)
        </div>
      )}

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
