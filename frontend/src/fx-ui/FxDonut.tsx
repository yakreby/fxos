/**
 * FxDonut — halka (donut) grafiği (SVG, sıfır bağımlılık).
 * Segmentler `stroke-dasharray` ile çizilir; ortada toplam/etiket gösterilebilir.
 * Lejantı çağıran taraf aynı `segments` ile kendisi basar.
 */
export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface FxDonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}

export function FxDonut({ segments, size = 124, thickness = 15, centerLabel, centerSub }: FxDonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const cx = size / 2

  // Segment uzunlukları + kümülatif offset'ler (render sırasında mutasyonsuz).
  const lengths = segments.map((s) => (s.value / total) * c)
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <svg className="fx-donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--fx-border)" strokeWidth={thickness} opacity={0.45} />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${lengths[i].toFixed(2)} ${(c - lengths[i]).toFixed(2)}`}
            strokeDashoffset={-offsets[i]}
            strokeLinecap="butt"
          />
        ))}
      </g>
      {centerLabel && <text x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" className="fx-donut__val">{centerLabel}</text>}
      {centerSub && <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="fx-donut__sub">{centerSub}</text>}
    </svg>
  )
}
