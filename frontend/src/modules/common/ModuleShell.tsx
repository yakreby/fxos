import { FxCard, FxIcon, FxBadge } from '../../fx-ui'
import { findNavItem } from '../../layout/nav-items'
import { MODULE_PREVIEWS } from './module-previews'
import { ModulePreview } from './ModulePreview'

interface ModuleShellProps {
  /** Sayfanın nav anahtarı; başlık/ikon/açıklama/planlanan nav-items'tan çözülür. */
  navKey: string
}

/**
 * ModuleShell — henüz içi doldurulmamış modül sayfaları için tutarlı iskelet
 * (başlık + "Yapım aşamasında" rozeti + planlanan özellikler). Her modülün kendi
 * sayfa dosyası bunu çağırır; modül geliştirilince o dosyanın içeriği gerçek
 * ekranla değiştirilir. Metinler tek kaynaktan (nav-items) gelir; mock data yoktur.
 */
export function ModuleShell({ navKey }: ModuleShellProps) {
  const item = findNavItem(navKey)
  const title = item?.label ?? navKey
  const icon = item?.icon ?? 'grid'
  const description = item?.description
  const planned = item?.planned

  // View-specific önizleme tanımı varsa gerçek düzeni (kart/tablo/takvim) göster.
  const spec = MODULE_PREVIEWS[navKey]
  if (spec) return <ModulePreview title={title} description={description} spec={spec} />

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{title}</div>
          <FxBadge tone="warning">Yapım aşamasında</FxBadge>
        </div>
        {description && <div className="fx-page-head__sub">{description}</div>}
      </div>

      <FxCard>
        <div className="fx-placeholder">
          <div className="fx-placeholder__icon">
            <FxIcon name={icon} size={32} />
          </div>
          <div className="fx-placeholder__title">Bu modül yakında hazır olacak</div>
          <p className="fx-placeholder__text fx-text-muted">
            {title} modülü FxOs yol haritasında planlandı. Altyapı (auth, log, tablo,
            bildirim) hazır olduğunda hızlıca devreye alınacak.
          </p>

          {planned && planned.length > 0 && (
            <div className="fx-placeholder__planned">
              <div className="fx-placeholder__planned-title">Planlanan özellikler</div>
              <ul className="fx-placeholder__list">
                {planned.map((feature) => (
                  <li key={feature}>
                    <FxIcon name="activity" size={15} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </FxCard>
    </>
  )
}
