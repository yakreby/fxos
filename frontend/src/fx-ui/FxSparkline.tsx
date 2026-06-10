/**
 * FxSparkline — minik trend grafiği (SVG, sıfır bağımlılık).
 * KPI kartlarında değerin altındaki "son N gün" çizgisi için. Veri normalize edilir,
 * isteğe bağlı altı hafif dolgulu. Renk temadan veya prop'tan gelir.
 */
interface FxSparklineProps {
  data: number[]
  height?: number
  color?: string
  area?: boolean
  strokeWidth?: number
}

export function FxSparkline({ data, height = 28, color = 'var(--fx-brand)', area = true, strokeWidth = 1.5 }: FxSparklineProps) {
  if (data.length === 0) return null

  const W = 100
  const H = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = strokeWidth + 1

  const points = data.map((v, i) => {
    const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W
    const y = pad + (1 - (v - min) / range) * (H - pad * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const areaPath = `${line} L${W} ${H} L0 ${H} Z`

  return (
    <svg
      className="fx-sparkline"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H }}
      role="img"
      aria-hidden="true"
    >
      {area && <path d={areaPath} fill={color} opacity={0.12} stroke="none" />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
