import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { Definition } from '../definitions/definitions-api'
import type { PersonnelLookup } from '../personnel/personnel-api'
import type { ProductLookup } from '../products/products-api'
import type { Shelf } from '../stock/stock-api'
import {
  createSeparation,
  updateSeparation,
  type SeparationDetail,
  type SeparationPayload,
} from './separations-api'

interface SeparationFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: SeparationDetail | null
  personnel: PersonnelLookup[]
  wasteTypes: Definition[]
  processTypes: Definition[]
  wasteGroups: Definition[]
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

/** Separasyon talebi oluştur/düzenle diyaloğu. İçerik/işlem/sonuç Definition lookup'ları. */
export function SeparationFormModal({
  open, onClose, onSaved, initial, personnel, wasteTypes, processTypes, wasteGroups, products, shelves, today,
}: SeparationFormModalProps) {
  const isEdit = initial !== null
  const [requestNumber, setRequestNumber] = useState(initial?.requestNumber ?? '')
  const [requestDate, setRequestDate] = useState(initial ? initial.requestDate.slice(0, 10) : today)
  const [assignedPersonnelId, setAssignedPersonnelId] = useState(initial?.assignedPersonnelId ?? '')
  const [wasteTypeId, setWasteTypeId] = useState(initial?.wasteTypeId ?? '')
  const [processTypeId, setProcessTypeId] = useState(initial?.processTypeId ?? '')
  const [resultGroupId, setResultGroupId] = useState(initial?.resultGroupId ?? '')
  const [productId, setProductId] = useState(initial?.productId ?? '')
  const [shelfId, setShelfId] = useState(initial?.shelfId ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [palletCount, setPalletCount] = useState(initial?.palletCount != null ? String(initial.palletCount) : '')
  const [weight, setWeight] = useState(initial?.weight != null ? String(initial.weight) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [dateError, setDateError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    if (requestDate.trim() === '') {
      setDateError('Talep tarihi zorunludur.')
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: SeparationPayload = {
      requestNumber: requestNumber.trim() === '' ? null : requestNumber.trim(),
      requestDate,
      assignedPersonnelId: assignedPersonnelId || null,
      wasteTypeId: wasteTypeId || null,
      processTypeId: processTypeId || null,
      resultGroupId: resultGroupId || null,
      productId: productId || null,
      shelfId: shelfId || null,
      content: content.trim() === '' ? null : content.trim(),
      palletCount: parseNum(palletCount),
      weight: parseNum(weight),
      notes: notes.trim() === '' ? null : notes.trim(),
    }
    try {
      const result = isEdit ? await updateSeparation(initial!.id, payload) : await createSeparation(payload)
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

  const personnelOptions: FxSelectOption[] = personnel.map((p) => ({ value: p.id, label: p.fullName }))
  const wasteTypeOptions: FxSelectOption[] = wasteTypes.map((w) => ({ value: w.id, label: w.name }))
  const processTypeOptions: FxSelectOption[] = processTypes.map((p) => ({ value: p.id, label: p.name }))
  const wasteGroupOptions: FxSelectOption[] = wasteGroups.map((w) => ({ value: w.id, label: w.name }))
  const productOptions: FxSelectOption[] = products.map((p) => ({ value: p.id, label: `${p.productCode} · ${p.name}` }))
  const shelfOptions: FxSelectOption[] = shelves.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Separasyon Düzenle' : 'Yeni Separasyon Talebi'}
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
          label="Talep No"
          placeholder="Boş bırakılırsa otomatik üretilir"
          maxLength={50}
          value={requestNumber}
          onChange={(e) => setRequestNumber(e.target.value)}
        />
        <FxDatePicker
          label="Talep Tarihi"
          required
          value={requestDate}
          error={dateError}
          onChange={(e) => { setRequestDate(e.target.value); if (dateError) setDateError(undefined) }}
        />
        <FxSelect
          label="Atanan Personel"
          placeholder="— Seçiniz —"
          options={personnelOptions}
          value={assignedPersonnelId}
          onChange={(e) => setAssignedPersonnelId(e.target.value)}
        />
        <FxSelect
          label="İşlem Türü"
          placeholder="— Seçiniz —"
          options={processTypeOptions}
          value={processTypeId}
          onChange={(e) => setProcessTypeId(e.target.value)}
        />
        <FxSelect
          label="Atık Tipi"
          placeholder="— Seçiniz —"
          options={wasteTypeOptions}
          value={wasteTypeId}
          onChange={(e) => setWasteTypeId(e.target.value)}
        />
        <FxSelect
          label="Sonuç Grubu (geri kazanım/imha)"
          placeholder="— Seçiniz —"
          options={wasteGroupOptions}
          value={resultGroupId}
          onChange={(e) => setResultGroupId(e.target.value)}
        />
        <FxSelect
          label="Ürün"
          placeholder="— Seçiniz —"
          options={productOptions}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
        <FxSelect
          label="Kaynak Raf / Lokasyon"
          placeholder="— Seçiniz —"
          options={shelfOptions}
          value={shelfId}
          onChange={(e) => setShelfId(e.target.value)}
        />
        <FxInput
          label="Palet Sayısı"
          type="number"
          min={0}
          placeholder="Ayrıştırılan palet (opsiyonel)"
          value={palletCount}
          onChange={(e) => setPalletCount(e.target.value)}
        />
        <FxInput
          label="Ağırlık (KG)"
          type="number"
          min={0}
          placeholder="Toplam ağırlık (opsiyonel)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <FxInput
          label="İçerik (serbest)"
          placeholder="İçerik / işlem açıklaması (opsiyonel)"
          maxLength={500}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="fx-grid__full"
        />
        <FxTextarea
          label="Not"
          rows={3}
          placeholder="Separasyon ile ilgili kısa not (opsiyonel)"
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
