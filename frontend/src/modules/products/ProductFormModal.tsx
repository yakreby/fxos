import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxCheckbox, FxFormError, type FxSelectOption } from '../../fx-ui'
import type { Definition } from '../definitions/definitions-api'
import type { AccountLookup } from '../pre-accounting/preaccounting-api'
import {
  createProduct,
  updateProduct,
  PACKAGE_TYPE_OPTIONS,
  type ProductDetail,
  type ProductPayload,
  type PackageType,
} from './products-api'

/** Form dropdown'ları için gerekli lookup listeleri (parent bir kez yükler). */
export interface ProductFormLookups {
  customers: AccountLookup[]
  productGroups: Definition[]
  returnGroups: Definition[]
  wasteGroups: Definition[]
  processTypes: Definition[]
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: ProductDetail | null
  lookups: ProductFormLookups
}

const MAX = { code: 50, name: 200, barcode: 50 } as const

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

/** Definition[] → FxSelect seçenekleri (kod varsa ada ekler). */
const defOptions = (items: Definition[]): FxSelectOption[] =>
  items.map((d) => ({ value: d.id, label: d.code ? `${d.name} (${d.code})` : d.name }))

const numOrNull = (s: string): number | null => {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Ürün oluştur/düzenle diyaloğu. */
export function ProductFormModal({ open, onClose, onSaved, initial, lookups }: ProductFormModalProps) {
  const isEdit = initial !== null
  const [productCode, setProductCode] = useState(initial?.productCode ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [barcode, setBarcode] = useState(initial?.barcode ?? '')
  const [customerId, setCustomerId] = useState(initial?.customerId ?? '')
  const [packageType, setPackageType] = useState<PackageType>(initial?.packageType ?? 0)
  const [netWeight, setNetWeight] = useState(initial?.netWeight != null ? String(initial.netWeight) : '')
  const [grossWeight, setGrossWeight] = useState(initial?.grossWeight != null ? String(initial.grossWeight) : '')
  const [unitsPerPackage, setUnitsPerPackage] = useState(initial?.unitsPerPackage != null ? String(initial.unitsPerPackage) : '')
  const [unitsPerCase, setUnitsPerCase] = useState(initial?.unitsPerCase != null ? String(initial.unitsPerCase) : '')
  const [productGroupId, setProductGroupId] = useState(initial?.productGroupId ?? '')
  const [returnGroupId, setReturnGroupId] = useState(initial?.returnGroupId ?? '')
  const [wasteGroupId, setWasteGroupId] = useState(initial?.wasteGroupId ?? '')
  const [processTypeId, setProcessTypeId] = useState(initial?.processTypeId ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)

  const [submitting, setSubmitting] = useState(false)
  const [codeError, setCodeError] = useState<string | undefined>(undefined)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    let invalid = false
    if (productCode.trim() === '') { setCodeError('Ürün kodu zorunludur.'); invalid = true }
    if (name.trim() === '') { setNameError('Ad zorunludur.'); invalid = true }
    if (invalid) {
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }

    setSubmitting(true)
    const payload: ProductPayload = {
      customerId: customerId || null,
      productCode: productCode.trim(),
      barcode: barcode.trim() === '' ? null : barcode.trim(),
      name: name.trim(),
      netWeight: numOrNull(netWeight),
      grossWeight: numOrNull(grossWeight),
      packageType,
      unitsPerPackage: numOrNull(unitsPerPackage),
      unitsPerCase: numOrNull(unitsPerCase),
      productGroupId: productGroupId || null,
      returnGroupId: returnGroupId || null,
      wasteGroupId: wasteGroupId || null,
      processTypeId: processTypeId || null,
      isActive,
    }
    try {
      const result = isEdit ? await updateProduct(initial!.id, payload) : await createProduct(payload)
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

  const customerOptions: FxSelectOption[] = lookups.customers.map((c) => ({ value: c.id, label: c.name }))

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
      size="lg"
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
          label="Ürün Kodu"
          required
          placeholder="Örn. PRD-001"
          maxLength={MAX.code}
          value={productCode}
          error={codeError}
          onChange={(e) => { setProductCode(e.target.value); if (codeError) setCodeError(undefined) }}
        />
        <FxInput
          label="Barkod"
          placeholder="Örn. 8690000000001"
          maxLength={MAX.barcode}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <FxInput
          label="Ad"
          required
          placeholder="Ürün adı"
          maxLength={MAX.name}
          value={name}
          error={nameError}
          onChange={(e) => { setName(e.target.value); if (nameError) setNameError(undefined) }}
          className="fx-grid__full"
        />
        <FxSelect
          label="Müşteri (Cari)"
          placeholder="— Seçiniz —"
          options={customerOptions}
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        <FxSelect
          label="Ambalaj Türü"
          options={PACKAGE_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          value={String(packageType)}
          onChange={(e) => setPackageType(Number(e.target.value) as PackageType)}
        />
        <FxInput
          label="Net Gramaj (g)"
          type="number"
          step="0.001"
          placeholder="Örn. 250"
          value={netWeight}
          onChange={(e) => setNetWeight(e.target.value)}
        />
        <FxInput
          label="Brüt Gramaj (g)"
          type="number"
          step="0.001"
          placeholder="Örn. 300"
          value={grossWeight}
          onChange={(e) => setGrossWeight(e.target.value)}
        />
        <FxInput
          label="Paket İçi Adet"
          type="number"
          placeholder="Örn. 12"
          value={unitsPerPackage}
          onChange={(e) => setUnitsPerPackage(e.target.value)}
        />
        <FxInput
          label="Koli İçi Adet"
          type="number"
          placeholder="Örn. 144"
          value={unitsPerCase}
          onChange={(e) => setUnitsPerCase(e.target.value)}
        />
        <FxSelect
          label="Ürün Grubu"
          placeholder="— Seçiniz —"
          options={defOptions(lookups.productGroups)}
          value={productGroupId}
          onChange={(e) => setProductGroupId(e.target.value)}
        />
        <FxSelect
          label="İade Grubu"
          placeholder="— Seçiniz —"
          options={defOptions(lookups.returnGroups)}
          value={returnGroupId}
          onChange={(e) => setReturnGroupId(e.target.value)}
        />
        <FxSelect
          label="Atık Grubu"
          placeholder="— Seçiniz —"
          options={defOptions(lookups.wasteGroups)}
          value={wasteGroupId}
          onChange={(e) => setWasteGroupId(e.target.value)}
        />
        <FxSelect
          label="İşlem Türü"
          placeholder="— Seçiniz —"
          options={defOptions(lookups.processTypes)}
          value={processTypeId}
          onChange={(e) => setProcessTypeId(e.target.value)}
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
