import { FxIcon } from '../../../fx-ui'

interface PreviewBannerProps {
  /** Özelleştirilebilir açıklama; verilmezse genel önizleme metni gösterilir. */
  text?: string
}

/**
 * PreviewBanner — view-specific placeholder sayfalarının başında, bu ekranın
 * düzeninin hazır olduğunu ama verinin henüz bağlanmadığını belirten ince şerit.
 */
export function PreviewBanner({ text }: PreviewBannerProps) {
  return (
    <div className="fx-preview-banner">
      <FxIcon name="alert-circle" size={16} />
      <span>
        {text ?? 'Önizleme — ekran düzeni hazır. Modül devreye girince gerçek veriler bağlanacak.'}
      </span>
    </div>
  )
}
