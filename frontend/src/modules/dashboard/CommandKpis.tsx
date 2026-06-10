import { FxIcon, FxSparkline, type FxIconName } from '../../fx-ui'
import './CommandKpis.css'

/**
 * CommandKpis — komuta merkezi üst KPI şeridi (5 metrik + sparkline).
 * Değerler şimdilik MOCK; Sayım/Hareket/Araç modülleri gelince gerçek veriye bağlanacak.
 */
interface Kpi {
  label: string
  value: string
  icon: FxIconName
  trend?: { value: string; positive: boolean }
  spark: number[]
  accent?: 'green' | 'teal'
}

const KPIS: Kpi[] = [
  { label: 'Bugünkü Toplama', value: '48,2 t', icon: 'package', trend: { value: '%8,2', positive: true }, spark: [12, 18, 14, 22, 19, 28, 24, 31] },
  { label: 'Bekleyen Sevkiyat', value: '37', icon: 'truck', trend: { value: '%3,1', positive: false }, spark: [40, 38, 42, 36, 39, 35, 37, 34] },
  { label: 'Toplam Tonaj (Ay)', value: '1.284 t', icon: 'activity', trend: { value: '%5,4', positive: true }, spark: [80, 95, 88, 102, 110, 98, 120, 128] },
  { label: 'Aktif Merkez', value: '11 / 12', icon: 'grid', spark: [9, 10, 10, 11, 11, 10, 11, 11] },
  { label: 'CO₂ Kazanımı', value: '892 t', icon: 'activity', trend: { value: '%12', positive: true }, spark: [50, 58, 55, 64, 70, 78, 84, 92], accent: 'teal' },
]

export function CommandKpis() {
  return (
    <div className="fx-kpi-strip">
      {KPIS.map((k) => (
        <div key={k.label} className={`fx-kpi${k.accent === 'teal' ? ' fx-kpi--teal' : ''}`}>
          <div className="fx-kpi__top">
            <span className="fx-kpi__icon"><FxIcon name={k.icon} size={17} /></span>
            {k.trend && (
              <span className={`fx-kpi__trend ${k.trend.positive ? 'is-up' : 'is-down'}`}>
                {k.trend.positive ? '▲' : '▼'} {k.trend.value}
              </span>
            )}
          </div>
          <div className="fx-kpi__value">{k.value}</div>
          <div className="fx-kpi__label">{k.label}</div>
          <div className="fx-kpi__spark">
            <FxSparkline data={k.spark} height={26} color={k.accent === 'teal' ? '#2fd4d4' : 'var(--fx-brand)'} />
          </div>
        </div>
      ))}
    </div>
  )
}
