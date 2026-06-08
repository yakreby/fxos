import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { Definition } from '../definitions/definitions-api'
import type { ProductLookup } from '../products/products-api'
import type { Shelf } from '../stock/stock-api'
import {
  createOctabin,
  updateOctabin,
  type OctabinDetail,
  type OctabinPayload,
} from './octabins-api'

interface OctabinFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: OctabinDetail | null
  wasteTypes: Definition[]
  products: ProductLookup[]
  shelves: Shelf[]
  /** Yeni kayıt için varsayılan tarih (yyyy-MM-dd). */
  today: string
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

const parseNum = (v: string): number | null => {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Octabin oluştur/düzenle diyaloğu. İçerik esnek: atık tipi / ürün / serbest metin. */
export function OctabinFormModal({ open, onClose, onSaved, initial, wasteTypes, products, shelves, today }: OctabinFormModalProps) {
  const isEdit = initial !== null
  const [octabinNumber, setOctabinNumber] = useState(initial?.octabinNumber ?? '')
  const [openedDate, setOpenedDate] = useState(initial ? initial.openedDate.slice(0, 10) : today)
  const [wasteTypeId, setWasteTypeId] = useState(initial?.wasteTypeId ?? '')
  const [productId, setProductId] = useState(initial?.productId ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [shelfId, setShelfId] = useState(initial?.shelfId ?? '')
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : '')
  const [netWeight, setNetWeight] = useState(initial?.netWeight != null ? String(initial.netWeight) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [dateError, setDateError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    if (openedDate.trim() === '') {
      setDateError('Açılış tarihi zorunludur.')
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: OctabinPayload = {
      octabinNumber: octabinNumber.trim() === '' ? null : octabinNumber.trim(),
      openedDate,
      wasteTypeId: wasteTypeId || null,
      productId: productId || null,
      content: content.trim() === '' ? null : content.trim(),
      shelfId: shelfId || null,
      capacity: parseNum(capacity),
      netWeight: parseNum(netWeight),
      notes: notes.trim() === '' ? null : notes.trim(),
    }
    try {
      const result = isEdit ? await updateOctabin(initial!.id, payload) : await createOctabin(payload)
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

  const wasteTypeOptions: FxSelectOption[] = wasteTypes.map((w) => ({ value: w.id, label: w.name }))
  const productOptions: FxSelectOption[] = products.map((p) => ({ value: p.id, label: `${p.productCode} · ${p.name}` }))
  const shelfOptions: FxSelectOption[] = shelves.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Octabin Düzenle' : 'Yeni Octabin'}
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
          label="Octabin No"
          placeholder="Boş bırakılırsa otomatik üretilir"
          maxLength={50}
          value={octabinNumber}
          onChange={(e) => setOctabinNumber(e.target.value)}
        />
        <FxDatePicker
          label="Açılış Tarihi"
          required
          value={openedDate}
          error={dateError}
          onChange={(e) => { setOpenedDate(e.target.value); if (dateError) setDateError(undefined) }}
        />
        <FxSelect
          label="Atık Tipi"
          placeholder="— Seçiniz —"
          options={wasteTypeOptions}
          value={wasteTypeId}
          onChange={(e) => setWasteTypeId(e.target.value)}
        />
        <FxSelect
          label="Ürün"
          placeholder="— Seçiniz —"
          options={productOptions}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
        <FxInput
          label="İçerik (serbest)"
          placeholder="Octabin içeriği açıklaması (opsiyonel)"
          maxLength={500}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="fx-grid__full"
        />
        <FxSelect
          label="Raf / Lokasyon"
          placeholder="— Seçiniz —"
          options={shelfOptions}
          value={shelfId}
          onChange={(e) => setShelfId(e.target.value)}
        />
        <FxInput
          label="Kapasite (KG)"
          type="number"
          min={0}
          placeholder="Doluluk için (opsiyonel)"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <FxInput
          label="Net Ağırlık (KG)"
          type="number"
          min={0}
          placeholder="İçindeki ağırlık (opsiyonel)"
          value={netWeight}
          onChange={(e) => setNetWeight(e.target.value)}
        />
        <FxTextarea
          label="Not"
          rows={3}
          placeholder="Octabin ile ilgili kısa not (opsiyonel)"
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
