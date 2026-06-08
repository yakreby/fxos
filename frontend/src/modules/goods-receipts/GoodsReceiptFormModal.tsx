import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { AccountLookup } from '../pre-accounting/preaccounting-api'
import {
  createGoodsReceipt,
  updateGoodsReceipt,
  type GoodsReceiptDetail,
  type GoodsReceiptPayload,
} from './goods-receipts-api'

interface GoodsReceiptFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: GoodsReceiptDetail | null
  suppliers: AccountLookup[]
  /** Yeni kayıt için varsayılan tarih (yyyy-MM-dd). */
  today: string
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

/** Mal kabul başlığı oluştur/düzenle diyaloğu. */
export function GoodsReceiptFormModal({ open, onClose, onSaved, initial, suppliers, today }: GoodsReceiptFormModalProps) {
  const isEdit = initial !== null
  const [receiptNumber, setReceiptNumber] = useState(initial?.receiptNumber ?? '')
  const [receiptDate, setReceiptDate] = useState(initial ? initial.receiptDate.slice(0, 10) : today)
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [dateError, setDateError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    if (receiptDate.trim() === '') {
      setDateError('Kabul tarihi zorunludur.')
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: GoodsReceiptPayload = {
      receiptNumber: receiptNumber.trim() === '' ? null : receiptNumber.trim(),
      receiptDate,
      supplierId: supplierId || null,
      notes: notes.trim() === '' ? null : notes.trim(),
    }
    try {
      const result = isEdit ? await updateGoodsReceipt(initial!.id, payload) : await createGoodsReceipt(payload)
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

  const supplierOptions: FxSelectOption[] = suppliers.map((s) => ({ value: s.id, label: s.name }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Mal Kabul Düzenle' : 'Yeni Mal Kabul'}
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
          label="Fiş No"
          placeholder="Boş bırakılırsa otomatik üretilir"
          maxLength={50}
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
        />
        <FxDatePicker
          label="Kabul Tarihi"
          required
          value={receiptDate}
          error={dateError}
          onChange={(e) => { setReceiptDate(e.target.value); if (dateError) setDateError(undefined) }}
        />
        <FxSelect
          label="Tedarikçi (Cari)"
          placeholder="— Seçiniz —"
          options={supplierOptions}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        />
        <FxTextarea
          label="Not"
          rows={3}
          placeholder="Mal kabul ile ilgili kısa not (opsiyonel)"
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
