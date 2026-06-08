import { FxBadge, FxCard, FxStatCard } from '../../fx-ui'
import { PreviewBanner } from '../common/preview/PreviewBanner'
import { PreviewTable } from '../common/preview/PreviewTable'

/**
 * Tesis Paneli — view-specific placeholder. Gerçek dashboard düzeni (özet kartları +
 * son kabuller + depo doluluğu + separasyon) veri olmadan önizlenir. Veriler Mal Kabul,
 * Stok ve Separasyon modüllerinden türetilecek.
 */
export function FacilityDashboardPage() {
  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Tesis Paneli</div>
          <FxBadge tone="warning">Önizleme</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Tesisin anlık durumu: günlük mal kabul, depo doluluğu ve separasyon özeti.
        </div>
      </div>

      <PreviewBanner text="Önizleme — panel düzeni hazır. Kartlar Mal Kabul, Stok ve Separasyon modüllerinden beslenecek." />

      <div className="fx-grid fx-grid--stats">
        <FxStatCard icon="package" label="Günlük Mal Kabul (adet)" value="—" hint="bugün kabul edilen" />
        <FxStatCard icon="activity" label="Günlük Toplam (KG)" value="—" hint="tartım toplamı" />
        <FxStatCard icon="grid" label="Separasyon Palet" value="—" hint="açık separasyon" />
        <FxStatCard icon="truck" label="Depo Doluluk" value="—" hint="palet/raf oranı" />
      </div>

      <div style={{ marginTop: 20 }}>
        <FxCard title="Son Mal Kabuller">
          <PreviewTable
            columns={[
              { header: 'Fiş No', width: 150 },
              { header: 'Tarih', width: 120 },
              { header: 'Ürün' },
              { header: 'Paket (x/y)', align: 'right' },
              { header: 'KG', align: 'right' },
              { header: 'Müşteri' },
            ]}
            rows={5}
          />
        </FxCard>
      </div>

      <div className="fx-grid fx-grid--2" style={{ marginTop: 20 }}>
        <FxCard title="Depo Doluluğu">
          <PreviewTable
            columns={[
              { header: 'Depo' },
              { header: 'Boş Raf', align: 'right' },
              { header: 'Palet (x/y)', align: 'right' },
              { header: 'Tonaj', align: 'right' },
            ]}
            rows={4}
          />
        </FxCard>

        <FxCard title="Separasyon İşlem Detayları">
          <PreviewTable
            columns={[
              { header: 'Personel' },
              { header: 'Makine' },
              { header: 'İşlem' },
              { header: 'Palet', align: 'right' },
            ]}
            rows={4}
          />
        </FxCard>
      </div>
    </>
  )
}
