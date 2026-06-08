import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxFormError } from '../../fx-ui'
import {
  createPersonnel,
  updatePersonnel,
  PERSONNEL_STATUS_OPTIONS,
  type PersonnelDetail,
  type PersonnelPayload,
  type PersonnelStatus,
  type Lookup,
} from './personnel-api'

interface PersonnelFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek personel detayı; null ise yeni kayıt. */
  initial: PersonnelDetail | null
  departments: Lookup[]
  positions: Lookup[]
}

/** Alan üst karakter limitleri (backend DTO'larıyla hizalı; aşırı yapıştırmayı engeller). */
const MAX = { name: 100, nationalId: 11, email: 256, phone: 32, notes: 2000 } as const

/** ISO tarih ("2025-03-01T00:00:00") → date input değeri ("2025-03-01"). */
const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '')

const blankToNull = (v: string): string | null => {
  const t = v.trim()
  return t === '' ? null : t
}

interface FieldErrors {
  firstName?: string
  lastName?: string
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

/**
 * Personel oluşturma/düzenleme diyaloğu. Departman ve kadro açılır listeden seçilir
 * (opsiyonel). State prop'tan başlatılır; parent her açılışta `key` ile yeniden mount eder.
 */
export function PersonnelFormModal({
  open,
  onClose,
  onSaved,
  initial,
  departments,
  positions,
}: PersonnelFormModalProps) {
  const isEdit = initial !== null

  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? '')
  const [positionId, setPositionId] = useState(initial?.positionId ?? '')
  const [hireDate, setHireDate] = useState(toDateInput(initial?.hireDate ?? null))
  const [status, setStatus] = useState<PersonnelStatus>(initial?.status ?? 0)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<FormError | null>(null)

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }))
  const posOptions = positions.map((p) => ({ value: p.id, label: p.name }))
  const statusOptions = PERSONNEL_STATUS_OPTIONS.map((s) => ({ value: String(s.value), label: s.label }))

  // TC Kimlik No: yalnızca rakam.
  const onNationalIdChange = (v: string) => setNationalId(v.replace(/\D/g, ''))

  const validate = (): boolean => {
    const errs: FieldErrors = {}
    if (firstName.trim() === '') errs.firstName = 'Ad zorunludur.'
    if (lastName.trim() === '') errs.lastName = 'Soyad zorunludur.'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    const payload: PersonnelPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationalId: blankToNull(nationalId),
      email: blankToNull(email),
      phone: blankToNull(phone),
      departmentId: departmentId === '' ? null : departmentId,
      positionId: positionId === '' ? null : positionId,
      hireDate: hireDate === '' ? null : hireDate,
      status,
      notes: blankToNull(notes),
    }
    try {
      const result = isEdit
        ? await updatePersonnel(initial!.id, payload)
        : await createPersonnel(payload)

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
      title={isEdit ? 'Personeli Düzenle' : 'Yeni Personel'}
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
          label="Ad"
          required
          placeholder="Örn. Ahmet"
          maxLength={MAX.name}
          value={firstName}
          error={fieldErrors.firstName}
          onChange={(e) => {
            setFirstName(e.target.value)
            if (fieldErrors.firstName) setFieldErrors((p) => ({ ...p, firstName: undefined }))
          }}
        />
        <FxInput
          label="Soyad"
          required
          placeholder="Örn. Yılmaz"
          maxLength={MAX.name}
          value={lastName}
          error={fieldErrors.lastName}
          onChange={(e) => {
            setLastName(e.target.value)
            if (fieldErrors.lastName) setFieldErrors((p) => ({ ...p, lastName: undefined }))
          }}
        />
        <FxInput
          label="T.C. Kimlik No"
          placeholder="11 haneli kimlik no"
          inputMode="numeric"
          maxLength={MAX.nationalId}
          value={nationalId}
          onChange={(e) => onNationalIdChange(e.target.value)}
        />
        <FxInput
          label="Telefon"
          placeholder="Örn. 0555 111 22 33"
          maxLength={MAX.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <FxInput
          label="E-posta"
          type="email"
          placeholder="ornek@firma.com"
          maxLength={MAX.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="fx-grid__full"
        />
        <FxSelect
          label="Departman"
          placeholder="— Seçiniz —"
          options={deptOptions}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        />
        <FxSelect
          label="Kadro"
          placeholder="— Seçiniz —"
          options={posOptions}
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
        />
        <FxDatePicker label="İşe Giriş" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        <FxSelect
          label="Durum"
          options={statusOptions}
          value={String(status)}
          onChange={(e) => setStatus(Number(e.target.value) as PersonnelStatus)}
        />
        <FxTextarea
          label="Not"
          rows={3}
          placeholder="Personelle ilgili kısa not (opsiyonel)"
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
