import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxFormError, type FxSelectOption } from '../../fx-ui'
import {
  createFacilityNode,
  updateFacilityNode,
  deleteFacilityNode,
  NODE_TYPE_OPTIONS,
  NODE_STATUS_OPTIONS,
  type FacilityNode,
  type FacilityNodePayload,
  type FacilityNodeType,
  type FacilityNodeStatus,
} from './facility-api'

interface FacilityNodeFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
  onDeleted: (message: string) => void
  /** Düzenlenecek kayıt; null ise yeni. */
  initial: FacilityNode | null
  /** Yeni kayıt için haritadan tıklanan koordinat (varsa input'lara basılır). */
  prefill: { lat: number; lng: number } | null
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

const typeOptions: FxSelectOption[] = NODE_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))
const statusOptions: FxSelectOption[] = NODE_STATUS_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))

const coord = (n: number | undefined): string => (n != null ? String(n) : '')

/** Tesis haritası noktası oluştur/düzenle/sil diyaloğu. */
export function FacilityNodeFormModal({ open, onClose, onSaved, onDeleted, initial, prefill }: FacilityNodeFormModalProps) {
  const isEdit = initial !== null
  const [name, setName] = useState(initial?.name ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [nodeType, setNodeType] = useState(String(initial?.nodeType ?? 1))
  const [status, setStatus] = useState(String(initial?.status ?? 0))
  const [latitude, setLatitude] = useState(coord(initial?.latitude ?? prefill?.lat))
  const [longitude, setLongitude] = useState(coord(initial?.longitude ?? prefill?.lng))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<FormError | null>(null)

  const handleSubmit = async () => {
    setFormError(null)
    const lat = Number(latitude)
    const lng = Number(longitude)
    const missing: string[] = []
    if (name.trim() === '') missing.push('Ad zorunludur.')
    if (city.trim() === '') missing.push('Şehir zorunludur.')
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) missing.push('Enlem -90 ile 90 arasında geçerli bir sayı olmalı.')
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) missing.push('Boylam -180 ile 180 arasında geçerli bir sayı olmalı.')
    if (missing.length) {
      setFormError({ title: 'Eksik veya hatalı alanlar', errors: missing })
      return
    }

    setSubmitting(true)
    const payload: FacilityNodePayload = {
      name: name.trim(),
      city: city.trim(),
      nodeType: Number(nodeType) as FacilityNodeType,
      status: Number(status) as FacilityNodeStatus,
      latitude: lat,
      longitude: lng,
      description: description.trim() === '' ? null : description.trim(),
      sortOrder: initial?.sortOrder ?? 99,
    }
    try {
      const result = isEdit ? await updateFacilityNode(initial!.id, payload) : await createFacilityNode(payload)
      if (result.succeeded) {
        onSaved(isEdit ? 'Nokta güncellendi.' : 'Nokta eklendi.')
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

  const handleDelete = async () => {
    if (!initial) return
    if (!window.confirm(`"${initial.name}" noktası silinsin mi?`)) return
    setSubmitting(true)
    try {
      const res = await deleteFacilityNode(initial.id)
      if (res.succeeded) {
        onDeleted('Nokta silindi.')
        onClose()
      } else {
        setFormError({ message: res.message ?? 'Silme başarısız.' })
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
      title={isEdit ? 'Nokta Düzenle' : 'Yeni Nokta'}
      size="md"
      footer={
        <>
          {isEdit && (
            <FxButton variant="danger" onClick={() => void handleDelete()} disabled={submitting} style={{ marginRight: 'auto' }}>
              Sil
            </FxButton>
          )}
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Kaydet'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxInput
          label="Ad"
          required
          placeholder="Ör. İzmir Toplama Merkezi"
          maxLength={150}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="fx-grid__full"
        />
        <FxInput
          label="Şehir"
          required
          placeholder="Ör. İzmir"
          maxLength={100}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <FxSelect
          label="Tür"
          options={typeOptions}
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
        />
        <FxInput
          label="Enlem (Latitude)"
          type="number"
          placeholder="Haritaya tıklayınca otomatik dolar"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
        <FxInput
          label="Boylam (Longitude)"
          type="number"
          placeholder="Haritaya tıklayınca otomatik dolar"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />
        <FxSelect
          label="Durum"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <FxTextarea
          label="Açıklama"
          rows={2}
          placeholder="Nokta ile ilgili kısa not (opsiyonel)"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
