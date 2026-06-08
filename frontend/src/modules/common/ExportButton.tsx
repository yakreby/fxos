import { useState } from 'react'
import { FxButton, FxIcon, FxModal, FxDatePicker, FxSelect, useToast, type FxSelectOption } from '../../fx-ui'
import { downloadFile } from '../../core/api/client'

type ExportFormat = 'excel' | 'csv' | 'pdf'

const FORMAT_OPTIONS: FxSelectOption[] = [
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

interface ExportButtonProps {
  /** Dışa aktarma uç yolu (ör. '/octabins/export'). */
  endpoint: string
  /** Content-Disposition yoksa kullanılacak dosya adı kökü. */
  fileBase: string
  /** Uca eklenecek sabit query parametreleri (ör. { status: '1' }). */
  extraParams?: Record<string, string | undefined>
  /** Buton etiketi. */
  label?: string
  /** Buton varyantı. */
  variant?: 'primary' | 'subtle' | 'ghost'
  size?: 'sm' | 'md'
}

/**
 * Yeniden kullanılabilir "Dışa Aktar" butonu — tıklayınca tarih aralığı + format seçen
 * bir modal açar; cookie-auth ile dosyayı (CSV/Excel/PDF) indirir. Tüm liste sayfalarında kullanılır.
 */
export function ExportButton({
  endpoint,
  fileBase,
  extraParams,
  label = 'Dışa Aktar',
  variant = 'subtle',
  size = 'md',
}: ExportButtonProps) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [format, setFormat] = useState<ExportFormat>('excel')
  const [busy, setBusy] = useState(false)

  const handleDownload = async () => {
    if (from && to && from > to) {
      toast.error('Başlangıç tarihi bitişten sonra olamaz.')
      return
    }
    setBusy(true)
    const res = await downloadFile(
      endpoint,
      { ...extraParams, from: from || undefined, to: to || undefined, format },
      fileBase,
    )
    setBusy(false)
    if (res.ok) {
      toast.success('Dışa aktarma indirildi.')
      setOpen(false)
    } else {
      toast.error(res.message ?? 'Dışa aktarma başarısız.')
    }
  }

  return (
    <>
      <FxButton variant={variant} size={size} onClick={() => setOpen(true)}>
        <FxIcon name="file-text" size={16} /> {label}
      </FxButton>

      <FxModal
        open={open}
        onClose={() => setOpen(false)}
        title="Dışa Aktar"
        size="sm"
        footer={
          <>
            <FxButton variant="ghost" onClick={() => setOpen(false)} disabled={busy}>İptal</FxButton>
            <FxButton variant="primary" onClick={handleDownload} disabled={busy}>
              <FxIcon name="file-text" size={16} /> {busy ? 'Hazırlanıyor…' : 'İndir'}
            </FxButton>
          </>
        }
      >
        <p className="fx-text-muted" style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.5 }}>
          Tarih aralığı seçin (boş bırakılırsa tüm kayıtlar) ve biçimi belirleyin.
        </p>
        <div className="fx-grid fx-grid--form">
          <FxDatePicker label="Başlangıç" value={from} onChange={(e) => setFrom(e.target.value)} />
          <FxDatePicker label="Bitiş" value={to} onChange={(e) => setTo(e.target.value)} />
          <FxSelect
            label="Biçim"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="fx-grid__full"
          />
        </div>
      </FxModal>
    </>
  )
}
