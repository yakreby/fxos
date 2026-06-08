import { FxIcon, type FxIconName } from './FxIcon'

interface FxStatCardProps {
  icon: FxIconName
  label: string
  value: string
  hint?: string
  trend?: { value: string; positive?: boolean }
}

/**
 * FxStatCard — dashboard istatistik kutucuğu.
 */
export function FxStatCard({ icon, label, value, hint, trend }: FxStatCardProps) {
  return (
    <div className="fx-stat">
      <div className="fx-stat__icon">
        <FxIcon name={icon} size={22} />
      </div>
      <div className="fx-stat__body">
        <div className="fx-stat__label">{label}</div>
        <div className="fx-stat__value">{value}</div>
        <div className="fx-stat__foot">
          {trend && (
            <span className={`fx-stat__trend ${trend.positive ? 'is-up' : 'is-down'}`}>
              {trend.positive ? '▲' : '▼'} {trend.value}
            </span>
          )}
          {hint && <span className="fx-text-muted">{hint}</span>}
        </div>
      </div>
    </div>
  )
}
