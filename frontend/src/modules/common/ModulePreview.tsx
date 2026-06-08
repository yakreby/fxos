import { FxBadge, FxCard, FxStatCard } from '../../fx-ui'
import { PreviewBanner } from './preview/PreviewBanner'
import { PreviewTable } from './preview/PreviewTable'
import { PreviewCalendar } from './preview/PreviewCalendar'
import { PreviewGallery } from './preview/PreviewGallery'
import { PreviewCards } from './preview/PreviewCards'
import type { ModulePreviewSpec } from './module-previews'

interface ModulePreviewProps {
  title: string
  description?: string
  spec: ModulePreviewSpec
}

/**
 * ModulePreview — bir modülün gerçek view düzenini (özet kartları + tablo/takvim/galeri/kart
 * bölümleri) **veri olmadan** önizler. Spec'ten render edilir; mock veri yok.
 */
export function ModulePreview({ title, description, spec }: ModulePreviewProps) {
  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{title}</div>
          <FxBadge tone="warning">Önizleme</FxBadge>
        </div>
        {description && <div className="fx-page-head__sub">{description}</div>}
      </div>

      <PreviewBanner text={spec.banner} />

      {spec.stats && spec.stats.length > 0 && (
        <div className="fx-grid fx-grid--stats">
          {spec.stats.map((s) => (
            <FxStatCard key={s.label} icon={s.icon} label={s.label} value="—" hint={s.hint} />
          ))}
        </div>
      )}

      {spec.sections?.map((section, i) => (
        <div key={`${section.title}-${i}`} style={{ marginTop: 20 }}>
          <FxCard title={section.title}>
            {section.kind === 'table' && <PreviewTable columns={section.columns} rows={section.rows} />}
            {section.kind === 'calendar' && <PreviewCalendar />}
            {section.kind === 'gallery' && <PreviewGallery tiles={section.tiles} />}
            {section.kind === 'cards' && <PreviewCards cards={section.cards} />}
          </FxCard>
        </div>
      ))}
    </>
  )
}
