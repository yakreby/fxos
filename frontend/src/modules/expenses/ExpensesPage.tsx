import { FxBadge, FxButton, FxCard, FxIcon, FxStatCard } from '../../fx-ui'
import { PreviewBanner } from '../common/preview/PreviewBanner'
import { PreviewTable } from '../common/preview/PreviewTable'

/**
 * Masraf Yönetimi — view-specific placeholder. Gerçek liste düzeni (özet kartları +
 * masraf tablosu) veri olmadan önizlenir. Kategoriler ileride Tanımlamalar'a bağlanabilir.
 */
export function ExpensesPage() {
  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Masraf Yönetimi</div>
          <FxBadge tone="warning">Önizleme</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Masraf kayıtları, kategorileri ve onay/rapor takibi.
        </div>
      </div>

      <PreviewBanner text="Önizleme — ekran düzeni hazır. Kayıt ekleme/onay akışı modül devreye girince aktifleşecek." />

      <div className="fx-grid fx-grid--stats">
        <FxStatCard icon="credit-card" label="Bu Ay Toplam" value="—" hint="dönem masrafı" />
        <FxStatCard icon="activity" label="Bekleyen Onay" value="—" hint="onay sırasında" />
        <FxStatCard icon="grid" label="Kategori" value="—" hint="tanımlı kategori" />
        <FxStatCard icon="file-text" label="Bu Ay Kayıt" value="—" hint="masraf adedi" />
      </div>

      <div style={{ marginTop: 20 }}>
        <FxCard
          title="Masraflar"
          action={
            <FxButton variant="primary" size="sm" disabled title="Modül devreye girince aktifleşecek">
              <FxIcon name="plus" size={15} /> Yeni Masraf
            </FxButton>
          }
        >
          <PreviewTable
            columns={[
              { header: 'Tarih', width: 120 },
              { header: 'Kategori', width: 160 },
              { header: 'Açıklama' },
              { header: 'Tutar', align: 'right' },
              { header: 'Durum', width: 110 },
            ]}
            rows={7}
          />
        </FxCard>
      </div>
    </>
  )
}
