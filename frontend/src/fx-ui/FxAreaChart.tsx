/**
 * FxAreaChart — alan/çizgi grafiği (SVG, sıfır bağımlılık).
 * Veri normalize edilir; hafif dolgulu alan + çizgi + son nokta + soluk yatay ızgara.
 * Genişliği %100 (preserveAspectRatio none ile esner), yüksekliği sabit.
 */
interface FxAreaChartProps {
  data: number[]
  height?: number
  color?: string
}

export function FxAreaChart({ data, height = 130, color = 'var(--fx-brand)' }: FxAreaChartProps) {
  if (data.length === 0) return null

  const W = 300
  const H = height
  const padTop = 10
  const padBottom = 10
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W
    const y = padTop + (1 - (v - min) / range) * (H - padTop - padBottom)
    return [x, y] as const
  })

  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H} Z`
  const [lastX, lastY] = pts[pts.length - 1]
  const grid = [0.25, 0.5, 0.75].map((g) => padTop + g * (H - padTop - padBottom))

  return (
    <svg
      className="fx-area"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H }}
      role="img"
      aria-hidden="true"
    >
      {grid.map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="var(--fx-border)" strokeWidth={1} opacity={0.5} />
      ))}
      <path d={area} fill={color} opacity={0.13} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={3.2} fill={color} stroke="var(--fx-surface)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
