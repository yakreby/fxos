import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxFormError } from '../../fx-ui'
import {
  createAccount,
  updateAccount,
  ACCOUNT_TYPE_OPTIONS,
  type AccountDetail,
  type AccountPayload,
  type AccountType,
} from './preaccounting-api'

interface AccountFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial: AccountDetail | null
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

const blankToNull = (v: string): string | null => (v.trim() === '' ? null : v.trim())

export function AccountFormModal({ open, onClose, onSaved, initial }: AccountFormModalProps) {
  const isEdit = initial !== null

  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccountType>(initial?.type ?? 0)
  const [taxNumber, setTaxNumber] = useState(initial?.taxNumber ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [openingBalance, setOpeningBalance] = useState(String(initial?.openingBalance ?? 0))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const typeOptions = ACCOUNT_TYPE_OPTIONS.map((t) => ({ value: String(t.value), label: t.label }))

  const handleSubmit = async () => {
    setFormError(null)
    if (name.trim() === '') {
      setNameError('Ünvan/ad zorunludur.')
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'İşaretli alanları doldurun.' })
      return
    }
    const opening = Number(openingBalance.replace(',', '.'))
    if (Number.isNaN(opening)) {
      setFormError({ message: 'Açılış bakiyesi sayı olmalıdır.' })
      return
    }

    setSubmitting(true)
    const payload: AccountPayload = {
      name: name.trim(),
      type,
      taxNumber: blankToNull(taxNumber),
      phone: blankToNull(phone),
      email: blankToNull(email),
      address: blankToNull(address),
      openingBalance: opening,
      notes: blankToNull(notes),
    }
    try {
      const res = isEdit ? await updateAccount(initial!.id, payload) : await createAccount(payload)
      if (res.succeeded) {
        onSaved()
        onClose()
      } else if (res.errors?.length) {
        setFormError({ title: 'Eksik veya hatalı alanlar', errors: res.errors })
      } else {
        setFormError({ message: res.message ?? 'İşlem başarısız.' })
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
      title={isEdit ? 'Cariyi Düzenle' : 'Yeni Cari'}
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
          label="Ünvan / Ad"
          required
          placeholder="Örn. Acme Ltd."
          maxLength={200}
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(undefined)
          }}
          className="fx-grid__full"
        />
        <FxSelect
          label="Tür"
          options={typeOptions}
          value={String(type)}
          onChange={(e) => setType(Number(e.target.value) as AccountType)}
        />
        <FxInput label="Vergi No" placeholder="Vergi/TC no" maxLength={20} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        <FxInput label="Telefon" placeholder="Örn. 0212 000 00 00" maxLength={32} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <FxInput label="E-posta" type="email" placeholder="ornek@firma.com" maxLength={256} value={email} onChange={(e) => setEmail(e.target.value)} />
        <FxInput
          label="Açılış Bakiyesi (₺)"
          type="number"
          step="0.01"
          placeholder="0,00"
          hint="Pozitif = cari borçlu"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
        <FxTextarea
          label="Adres"
          rows={2}
          placeholder="Adres (opsiyonel)"
          maxLength={500}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="fx-grid__full"
        />
        <FxTextarea
          label="Not"
          rows={2}
          placeholder="Kısa not (opsiyonel)"
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <FxFormError title={formError?.title} errors={formError?.errors} message={formError?.message} />
    </FxModal>
  )
}
