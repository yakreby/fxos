import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxDatePicker, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { ProductLookup } from '../products/products-api'
import { transferStock, type Shelf, type TransferPayload } from './stock-api'

interface TransferFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  products: ProductLookup[]
  shelves: Shelf[]
  today: string
}

interface FormError { title?: string; errors?: string[]; message?: string }

const numOrNull = (s: string): number | null => {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Raflar arası transfer diyaloğu (kaynak çıkış + hedef giriş üretir). */
export function TransferFormModal({ open, onClose, onSaved, products, shelves, today }: TransferFormModalProps) {
  const [productId, setProductId] = useState('')
  const [fromShelfId, setFromShelfId] = useState('')
  const [toShelfId, setToShelfId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [weight, setWeight] = useState('')
  const [movementDate, setMovementDate] = useState(today)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ product?: string; from?: string; to?: string; qty?: string }>({})
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    const next: typeof errors = {}
    if (productId === '') next.product = 'Ürün seçiniz.'
    if (fromShelfId === '') next.from = 'Kaynak raf seçiniz.'
    if (toShelfId === '') next.to = 'Hedef raf seçiniz.'
    else if (toShelfId === fromShelfId) next.to = 'Hedef raf kaynaktan farklı olmalı.'
    const qty = numOrNull(quantity)
    if (qty == null || qty <= 0) next.qty = 'Miktar 0\'dan büyük olmalıdır.'
    if (Object.keys(next).length) {
      setErrors(next)
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: TransferPayload = {
      productId,
      fromShelfId,
      toShelfId,
      quantity: qty as number,
      weight: numOrNull(weight),
      movementDate,
      note: note.trim() === '' ? null : note.trim(),
    }
    try {
      const result = await transferStock(payload)
      if (result.succeeded) { onSaved(); onClose() }
      else if (result.errors?.length) setFormError({ title: 'Eksik veya hatalı alanlar', errors: result.errors })
      else setFormError({ message: result.message ?? 'İşlem başarısız.' })
    } catch {
      setFormError({ message: 'Sunucuya ulaşılamadı.' })
    } finally {
      setSubmitting(false)
    }
  }

  const productOptions: FxSelectOption[] = products.map((p) => ({ value: p.id, label: `${p.productCode} · ${p.name}` }))
  const shelfOptions: FxSelectOption[] = shelves.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title="Raflar Arası Transfer"
      size="md"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Aktarılıyor…' : 'Transfer Et'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxSelect
          label="Ürün" required placeholder="— Seçiniz —"
          options={productOptions} value={productId} error={errors.product}
          onChange={(e) => { setProductId(e.target.value); setErrors((x) => ({ ...x, product: undefined })) }}
          className="fx-grid__full"
        />
        <FxSelect
          label="Kaynak Raf" required placeholder="— Seçiniz —"
          options={shelfOptions} value={fromShelfId} error={errors.from}
          onChange={(e) => { setFromShelfId(e.target.value); setErrors((x) => ({ ...x, from: undefined })) }}
        />
        <FxSelect
          label="Hedef Raf" required placeholder="— Seçiniz —"
          options={shelfOptions} value={toShelfId} error={errors.to}
          onChange={(e) => { setToShelfId(e.target.value); setErrors((x) => ({ ...x, to: undefined })) }}
        />
        <FxInput
          label="Miktar" required type="number" step="0.001" placeholder="Örn. 20"
          value={quantity} error={errors.qty}
          onChange={(e) => { setQuantity(e.target.value); setErrors((x) => ({ ...x, qty: undefined })) }}
        />
        <FxInput label="Ağırlık (kg)" type="number" step="0.001" placeholder="Örn. 50" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <FxDatePicker label="Tarih" required value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
        <FxInput label="Not" placeholder="Kısa not (ops.)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="fx-grid__full" />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
