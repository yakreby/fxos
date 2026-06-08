import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxDatePicker, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { ProductLookup } from '../products/products-api'
import {
  createStockMovement,
  STOCK_DIRECTION_OPTIONS,
  STOCK_TYPE_OPTIONS,
  type Shelf,
  type StockDirection,
  type StockMovementType,
  type StockMovementPayload,
} from './stock-api'

interface StockMovementFormModalProps {
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

/** Manuel stok hareketi (giriş/çıkış) diyaloğu. */
export function StockMovementFormModal({ open, onClose, onSaved, products, shelves, today }: StockMovementFormModalProps) {
  const [productId, setProductId] = useState('')
  const [shelfId, setShelfId] = useState('')
  const [direction, setDirection] = useState<StockDirection>(0)
  const [type, setType] = useState<StockMovementType>(3) // Düzeltme
  const [quantity, setQuantity] = useState('')
  const [weight, setWeight] = useState('')
  const [movementDate, setMovementDate] = useState(today)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [productError, setProductError] = useState<string | undefined>(undefined)
  const [qtyError, setQtyError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    let invalid = false
    if (productId === '') { setProductError('Ürün seçiniz.'); invalid = true }
    const qty = numOrNull(quantity)
    if (qty == null || qty <= 0) { setQtyError('Miktar 0\'dan büyük olmalıdır.'); invalid = true }
    if (invalid) { setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' }); return }

    setSubmitting(true)
    const payload: StockMovementPayload = {
      productId,
      shelfId: shelfId || null,
      direction,
      type,
      quantity: qty as number,
      weight: numOrNull(weight),
      movementDate,
      reference: reference.trim() === '' ? null : reference.trim(),
      note: note.trim() === '' ? null : note.trim(),
    }
    try {
      const result = await createStockMovement(payload)
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
      title="Yeni Stok Hareketi"
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
        <FxSelect
          label="Ürün" required placeholder="— Seçiniz —"
          options={productOptions} value={productId}
          error={productError}
          onChange={(e) => { setProductId(e.target.value); if (productError) setProductError(undefined) }}
          className="fx-grid__full"
        />
        <FxSelect label="Raf" placeholder="— Seçiniz —" options={shelfOptions} value={shelfId} onChange={(e) => setShelfId(e.target.value)} />
        <FxDatePicker label="Tarih" required value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
        <FxSelect
          label="Yön"
          options={STOCK_DIRECTION_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          value={String(direction)} onChange={(e) => setDirection(Number(e.target.value) as StockDirection)}
        />
        <FxSelect
          label="Tür"
          options={STOCK_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          value={String(type)} onChange={(e) => setType(Number(e.target.value) as StockMovementType)}
        />
        <FxInput
          label="Miktar" required type="number" step="0.001" placeholder="Örn. 100"
          value={quantity} error={qtyError}
          onChange={(e) => { setQuantity(e.target.value); if (qtyError) setQtyError(undefined) }}
        />
        <FxInput label="Ağırlık (kg)" type="number" step="0.001" placeholder="Örn. 250" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <FxInput label="Referans" placeholder="Belge/fiş no (ops.)" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
        <FxInput label="Not" placeholder="Kısa not (ops.)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="fx-grid__full" />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
