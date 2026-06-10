import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxStatCard, FxCard, FxBadge, FxButton, FxIcon, type FxIconName } from '../../fx-ui'
import { useTheme } from '../../core/theme/ThemeContext'
import { useSession } from '../../core/auth/SessionContext'
import { listFacilityNodes, type FacilityNode } from '../facility/facility-api'
// SVG harita (offline çalışır) yerine Leaflet'e geçildi. Geri dönmek için aşağıdaki satırı aç
// ve render'daki <FacilityLeafletMap .../> yerine <TurkeyMap /> kullan.
// import { TurkeyMap } from '../facility/TurkeyMap'
// Leaflet ağır olduğundan harita lazy yüklenir (ana bundle'dan ayrı chunk).
const FacilityLeafletMap = lazy(() =>
  import('../facility/FacilityLeafletMap').then((m) => ({ default: m.FacilityLeafletMap })),
)

/**
 * Dashboard — genel bakış. Özet kartları + hızlı erişim + operasyon akışı + son işlemler.
 * Sayısal değerler şimdilik örnektir; modüller (ve API) bağlandıkça gerçek veriyle dolar.
 */

interface DemoRow {
  id: string
  ref: string
  type: string
  location: string
  status: { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' }
  date: string
}

const DEMO_ROWS: DemoRow[] = [
  { id: '1', ref: 'WB-2026-0412', type: 'İrsaliye', location: 'Kocaeli Deposu', status: { label: 'Teslim Edildi', tone: 'success' }, date: '05.06.2026' },
  { id: '2', ref: 'CL-2026-0388', type: 'Toplama', location: 'İzmit Saha', status: { label: 'Yolda', tone: 'info' }, date: '05.06.2026' },
  { id: '3', ref: 'DOC-2026-1190', type: 'Belge', location: 'Merkez', status: { label: 'Onay Bekliyor', tone: 'warning' }, date: '04.06.2026' },
  { id: '4', ref: 'WB-2026-0411', type: 'İrsaliye', location: 'Gebze Tesis', status: { label: 'Teslim Edildi', tone: 'success' }, date: '04.06.2026' },
  { id: '5', ref: 'CL-2026-0387', type: 'Toplama', location: 'Sakarya Saha', status: { label: 'Planlandı', tone: 'neutral' }, date: '03.06.2026' },
]

/** Hızlı erişim kısayolları (gerçek, çalışan modüller). */
const SHORTCUTS: { key: string; label: string; icon: FxIconName }[] = [
  { key: 'personnel', label: 'Personel', icon: 'users' },
  { key: 'pre-accounting', label: 'Cari Hesaplar', icon: 'credit-card' },
  { key: 'definitions', label: 'Tanımlamalar', icon: 'settings' },
  { key: 'products', label: 'Ürünler', icon: 'package' },
  { key: 'goods-receipt', label: 'Mal Kabul', icon: 'package' },
  { key: 'stock', label: 'Stok', icon: 'grid' },
  { key: 'shelves', label: 'Raflar', icon: 'grid' },
  { key: 'notifications', label: 'Bildirimler', icon: 'bell' },
]

/** Operasyon akışı adımları (zero-waste döngüsü). */
const FLOW: { label: string; icon: FxIconName }[] = [
  { label: 'Mal Kabul', icon: 'package' },
  { label: 'Depolama', icon: 'grid' },
  { label: 'Sayım / Saha', icon: 'activity' },
  { label: 'Separasyon', icon: 'grid' },
  { label: 'Sevkiyat', icon: 'truck' },
]

export function DashboardPage() {
  const { theme } = useTheme()
  const { user } = useSession()
  const navigate = useNavigate()
  const formexLogo = theme === 'dark' ? '/images/logo.png' : '/images/logo-dark.png'

  const [nodes, setNodes] = useState<FacilityNode[]>([])
  useEffect(() => {
    void listFacilityNodes().then((res) => {
      if (res.succeeded && res.data) setNodes(res.data)
    })
  }, [])

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-page-head__title">Formex Yönetim Paneli</div>
        <div className="fx-page-head__sub">
          Saha toplama → mal kabul → ayrıştırma → geri kazanım/sevkiyat döngüsünün merkezî yönetimi
          {user?.name ? ` · Hoş geldin, ${user.name.split(' ')[0]}` : ''}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--fx-space-6)' }}>
        <FxCard
          title="Dijital Tesis Haritası"
          action={
            <FxButton variant="ghost" size="sm" onClick={() => navigate('/facility-dashboard')}>
              <FxIcon name="grid" size={16} /> Tesis Paneli
            </FxButton>
          }
        >
          <Suspense fallback={<div style={{ height: '60vh', minHeight: 440, display: 'grid', placeItems: 'center', color: '#9fb4a6', background: '#0b1410', borderRadius: 'var(--fx-radius-lg)', border: '1px solid rgba(72,215,54,0.18)' }}>Harita yükleniyor…</div>}>
            <FacilityLeafletMap nodes={nodes} mode="view" onNodeDetails={() => navigate('/logistics-movements')} />
          </Suspense>
          <p className="fx-text-muted" style={{ margin: '12px 2px 0', fontSize: 13, lineHeight: 1.6 }}>
            Formex genel merkezi (İstanbul), toplama merkezleri ve bölgesel dağıtım merkezleri tek
            ekranda. Noktaların üzerine gelerek müşteri, palet, tonaj ve son plaka bilgilerini
            görebilirsiniz; veriler ileride Sayım/Hareket modüllerinden beslenecek.
          </p>
        </FxCard>
      </div>

      <div className="fx-grid fx-grid--stats" style={{ marginBottom: 'var(--fx-space-6)' }}>
        <FxStatCard icon="package" label="Toplanan Ürün (ay)" value="1.284 t" trend={{ value: '%8,2', positive: true }} />
        <FxStatCard icon="truck" label="Aktif Sevkiyat" value="37" hint="14 yolda" />
        <FxStatCard icon="file-text" label="Bekleyen Belge" value="12" trend={{ value: '%3,1', positive: false }} />
        <FxStatCard icon="users" label="Aktif Personel" value="58" hint="6 sahada" />
      </div>

      <FxCard title="Hızlı Erişim Menüsü">
        <div className="fx-quick-grid">
          {SHORTCUTS.map((s) => (
            <button key={s.key} type="button" className="fx-quick" onClick={() => navigate(`/${s.key}`)}>
              <span className="fx-quick__icon"><FxIcon name={s.icon} size={19} /></span>
              <span className="fx-quick__label">{s.label}</span>
            </button>
          ))}
        </div>
      </FxCard>

      <div style={{ marginTop: 'var(--fx-space-6)' }}>
        <FxCard title="Operasyon Akışı">
          <div className="fx-flow">
            {FLOW.map((step, i) => (
              <span key={step.label} className="fx-flow__step-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span className="fx-flow__step"><FxIcon name={step.icon} size={16} /> {step.label}</span>
                {i < FLOW.length - 1 && <FxIcon name="chevron-right" size={16} className="fx-flow__arrow" />}
              </span>
            ))}
          </div>
          <p className="fx-text-muted" style={{ margin: '14px 0 0', fontSize: 13.5, lineHeight: 1.6 }}>
            Tarihi geçmiş ürünler sahadan toplanır, tesise kabul edilir, depolanır; sayım ve
            separasyon sonrası geri kazanım/sevkiyat ile döngü tamamlanır.
          </p>
        </FxCard>
      </div>

      <div className="fx-grid fx-grid--2" style={{ marginTop: 'var(--fx-space-6)' }}>
        <FxCard
          title="Son İşlemler"
          action={
            <FxButton variant="ghost" size="sm" onClick={() => navigate('/logs')}>
              <FxIcon name="activity" size={16} /> Loglar
            </FxButton>
          }
        >
          <div className="fx-table-wrap">
            <table className="fx-table">
              <thead>
                <tr>
                  <th>Referans</th>
                  <th>Tür</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>{row.ref}</td>
                    <td>{row.type}</td>
                    <td className="fx-text-muted">{row.location}</td>
                    <td><FxBadge tone={row.status.tone}>{row.status.label}</FxBadge></td>
                    <td className="fx-text-muted">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FxCard>

        <FxCard title="Formex · Zero Waste">
          <div className="fx-flex fx-flex-col fx-gap-4">
            <img src={formexLogo} alt="Formex" style={{ width: '100%', maxWidth: 220 }} />
            <p className="fx-text-muted" style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>
              Tarihi geçmiş ürünler sahadan toplanır, merkezde ayrıştırılır; yem katkı maddesi ve
              granül gibi hammaddelere dönüştürülür. FxOs bu döngünün lojistiğini uçtan uca takip eder.
            </p>
            <div className="fx-flex fx-gap-2">
              <FxBadge tone="success">Geri Dönüşüm</FxBadge>
              <FxBadge tone="brand">Çevre Katkısı</FxBadge>
            </div>
          </div>
        </FxCard>
      </div>
    </>
  )
}
