import { FxCard, FxDonut, FxAreaChart, type DonutSegment } from '../../fx-ui'

/**
 * DashboardCharts — komuta merkezi grafik şeridi: günlük toplama (alan) + malzeme dağılımı
 * (donut) + araç durumu (donut). Hepsi el yapımı SVG, MOCK veri (ileride gerçek modüllerden).
 */
const MATERIAL: DonutSegment[] = [
  { label: 'Plastik', value: 38, color: '#48d736' },
  { label: 'Metal', value: 22, color: '#2fd4d4' },
  { label: 'Cam', value: 16, color: '#3aa86c' },
  { label: 'Kâğıt', value: 14, color: '#e0a52e' },
  { label: 'Organik', value: 10, color: '#9aa3af' },
]

const VEHICLE: DonutSegment[] = [
  { label: 'Yolda', value: 7, color: '#48d736' },
  { label: 'Tesiste', value: 6, color: '#2fd4d4' },
  { label: 'Boşta', value: 3, color: '#9aa3af' },
  { label: 'Bakımda', value: 2, color: '#e0a52e' },
]

const DAILY = [42, 55, 48, 61, 58, 72, 65, 80, 76, 69, 88, 95, 82, 96]

function Legend({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div className="fx-chart-legend">
      {segments.map((s) => (
        <div key={s.label} className="fx-chart-legend__row">
          <span className="fx-chart-legend__sw" style={{ background: s.color }} />
          <span className="fx-chart-legend__label">{s.label}</span>
          <span className="fx-chart-legend__val">%{Math.round((s.value / total) * 100)}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardCharts() {
  return (
    <div className="fx-charts-grid">
      <FxCard title="Toplama Miktarı (Günlük)">
        <FxAreaChart data={DAILY} height={150} />
        <div className="fx-chart-foot">
          <span><b>1.284 t</b> son 14 gün</span>
          <span className="fx-chart-foot__up">▲ %8,2</span>
        </div>
      </FxCard>

      <FxCard title="Malzeme Dağılımı">
        <div className="fx-donut-card">
          <FxDonut segments={MATERIAL} centerLabel="391t" centerSub="toplam" />
          <Legend segments={MATERIAL} />
        </div>
      </FxCard>

      <FxCard title="Araç Durumu">
        <div className="fx-donut-card">
          <FxDonut segments={VEHICLE} centerLabel="18" centerSub="araç" />
          <Legend segments={VEHICLE} />
        </div>
      </FxCard>
    </div>
  )
}
