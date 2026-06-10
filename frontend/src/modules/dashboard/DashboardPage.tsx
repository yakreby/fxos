import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxCard, FxButton, FxIcon, type FxIconName } from '../../fx-ui'
import { CommandKpis } from './CommandKpis'
import { SelectedCenterPanel } from './SelectedCenterPanel'
import { OperationFeed } from './OperationFeed'
import { DashboardCharts } from './DashboardCharts'
import { DashboardActivity } from './DashboardActivity'
import './command-center.css'
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
  const { user } = useSession()
  const navigate = useNavigate()

  const [nodes, setNodes] = useState<FacilityNode[]>([])
  const [selected, setSelected] = useState<FacilityNode | null>(null)
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

      <CommandKpis />

      <div className="fx-cmd-grid" style={{ marginTop: 'var(--fx-space-6)', marginBottom: 'var(--fx-space-6)' }}>
        <FxCard
          title="Dijital Tesis Haritası"
          action={
            <FxButton variant="ghost" size="sm" onClick={() => navigate('/facility-dashboard')}>
              <FxIcon name="grid" size={16} /> Tesis Paneli
            </FxButton>
          }
        >
          <Suspense fallback={<div style={{ height: '60vh', minHeight: 440, display: 'grid', placeItems: 'center', color: '#9fb4a6', background: '#0b1410', borderRadius: 'var(--fx-radius-lg)', border: '1px solid rgba(72,215,54,0.18)' }}>Harita yükleniyor…</div>}>
            <FacilityLeafletMap
              nodes={nodes}
              mode="view"
              onSelect={setSelected}
              onNodeDetails={() => navigate('/logistics-movements')}
            />
          </Suspense>
        </FxCard>

        <div className="fx-cmd-rail">
          <SelectedCenterPanel node={selected} onDetails={() => navigate('/logistics-movements')} />
          <OperationFeed />
        </div>
      </div>

      <DashboardCharts />

      <DashboardActivity />

      <div style={{ marginTop: 'var(--fx-space-6)' }}>
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
      </div>

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

    </>
  )
}
