import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { ProductLookup } from '../products/products-api'
import type { Shelf } from '../stock/stock-api'
import { addGoodsReceiptLine, type GoodsReceiptLinePayload } from './goods-receipts-api'

interface GoodsReceiptLineFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  receiptId: string
  products: ProductLookup[]
  shelves: Shelf[]
}

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

/** Mal kabul satırı ekleme diyaloğu. */
export function GoodsReceiptLineFormModal({ open, onClose, onSaved, receiptId, products, shelves }: GoodsReceiptLineFormModalProps) {
  const [productId, setProductId] = useState('')
  const [shelfId, setShelfId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [weight, setWeight] = useState('')
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
    if (invalid) {
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: GoodsReceiptLinePayload = {
      productId,
      shelfId: shelfId || null,
      quantity: qty as number,
      weight: numOrNull(weight),
      note: note.trim() === '' ? null : note.trim(),
    }
    try {
      const result = await addGoodsReceiptLine(receiptId, payload)
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

  const productOptions: FxSelectOption[] = products.map((p) => ({ value: p.id, label: `${p.productCode} · ${p.name}` }))
  const shelfOptions: FxSelectOption[] = shelves.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title="Satır Ekle"
      size="md"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Ekleniyor…' : 'Ekle'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxSelect
          label="Ürün"
          required
          placeholder="— Seçiniz —"
          options={productOptions}
          value={productId}
          error={productError}
          onChange={(e) => { setProductId(e.target.value); if (productError) setProductError(undefined) }}
          className="fx-grid__full"
        />
        <FxSelect
          label="Raf (adresleme)"
          placeholder="— Seçiniz —"
          options={shelfOptions}
          value={shelfId}
          onChange={(e) => setShelfId(e.target.value)}
          className="fx-grid__full"
        />
        <FxInput
          label="Miktar"
          required
          type="number"
          step="0.001"
          placeholder="Örn. 10"
          value={quantity}
          error={qtyError}
          onChange={(e) => { setQuantity(e.target.value); if (qtyError) setQtyError(undefined) }}
        />
        <FxInput
          label="Tartım (kg)"
          type="number"
          step="0.001"
          placeholder="Örn. 125,5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <FxInput
          label="Not"
          placeholder="Satır notu (opsiyonel)"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
