import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxSelect, FxTextarea, FxDatePicker, FxFormError } from '../../fx-ui'
import {
  createTransaction,
  TRANSACTION_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  type CreateTransactionPayload,
  type TransactionType,
  type PaymentMethod,
} from './preaccounting-api'

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  accountId: string
  /** Bugünün tarihi (YYYY-MM-DD) — parent verir (render dışı). */
  today: string
}

interface FormError {
  title?: string
  errors?: string[]
  message?: string
}

export function TransactionFormModal({ open, onClose, onSaved, accountId, today }: TransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>(0)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState<PaymentMethod>(0)
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [amountError, setAmountError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<FormError | null>(null)

  const typeOptions = TRANSACTION_TYPE_OPTIONS.map((t) => ({ value: String(t.value), label: t.label }))
  const methodOptions = PAYMENT_METHOD_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))

  const handleSubmit = async () => {
    setFormError(null)
    const amt = Number(amount.replace(',', '.'))
    if (!amount.trim() || Number.isNaN(amt) || amt <= 0) {
      setAmountError("Tutar 0'dan büyük olmalı.")
      setFormError({ title: 'Zorunlu alanlar eksik', message: 'Geçerli bir tutar girin.' })
      return
    }
    if (!date) {
      setFormError({ message: 'Tarih zorunludur.' })
      return
    }

    setSubmitting(true)
    const payload: CreateTransactionPayload = {
      type,
      amount: amt,
      date,
      method,
      description: description.trim() === '' ? null : description.trim(),
      reference: reference.trim() === '' ? null : reference.trim(),
    }
    try {
      const res = await createTransaction(accountId, payload)
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
      title="Yeni Hareket"
      size="md"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Ekle'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxSelect label="Tür" options={typeOptions} value={String(type)} onChange={(e) => setType(Number(e.target.value) as TransactionType)} />
        <FxInput
          label="Tutar (₺)"
          type="number"
          step="0.01"
          required
          placeholder="0,00"
          value={amount}
          error={amountError}
          onChange={(e) => {
            setAmount(e.target.value)
            if (amountError) setAmountError(undefined)
          }}
        />
        <FxDatePicker label="Tarih" required value={date} onChange={(e) => setDate(e.target.value)} />
        <FxSelect label="Yöntem" options={methodOptions} value={String(method)} onChange={(e) => setMethod(Number(e.target.value) as PaymentMethod)} />
        <FxInput label="Referans" placeholder="Belge/dekont no (ops.)" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
        <FxTextarea
          label="Açıklama"
          rows={2}
          placeholder="Açıklama (opsiyonel)"
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
