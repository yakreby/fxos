import { useEffect, useMemo, useRef, useState } from 'react'
import { listFacilityNodes, type FacilityNode } from './facility-api'
import './TurkeyMap.css'

/**
 * TurkeyMap — Dijital Tesis Haritası (tech-style, sıfır dış bağımlılık).
 *
 * Türkiye silüeti gerçek sınır verisinden (düşük çözünürlüklü), düğümler ise aynı
 * **equirectangular** projeksiyonla (lon/lat → x/y) çizilir; böylece markerlar silüete
 * birebir oturur. Genel merkezden aktif toplama merkezlerine animasyonlu ağ çizgileri,
 * atan-nabız düğümler ve hover detay kartı içerir. Veri `GET /facility/nodes`'tan gelir.
 */

/* ---- Projeksiyon (Türkiye sınırlarına göre sabit kutu) ---- */
const MIN_LON = 25.5, MAX_LON = 45.0
const MIN_LAT = 35.5, MAX_LAT = 42.3
const VB_W = 1000
// Enlem-boylam oranını koruyacak yükseklik (equirectangular, orta enlem düzeltmesi).
const MID_LAT = (MIN_LAT + MAX_LAT) / 2
const VB_H = Math.round(
  (VB_W * (MAX_LAT - MIN_LAT)) / ((MAX_LON - MIN_LON) * Math.cos((MID_LAT * Math.PI) / 180)),
)

function projX(lon: number): number {
  return ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * VB_W
}
function projY(lat: number): number {
  return ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * VB_H
}

/* ---- Türkiye sınır halkası (lon/lat; georgique/world-geojson, ~250 noktaya indirgenmiş) ---- */
const TURKEY_RINGS: [number, number][][] = [
  [[35.007, 42.109], [34.214, 41.978], [32.61, 41.846], [31.748, 41.469], [31.194, 41.123], [30.19, 41.181], [29.36, 41.224], [28.634, 41.372], [28.051, 41.873], [27.841, 41.994], [27.565, 41.905], [27.22, 42.093], [26.955, 42.002], [26.581, 41.908], [26.374, 41.706], [26.484, 41.659], [26.598, 41.546], [26.634, 41.371], [26.458, 41.282], [26.308, 41.18], [26.33, 40.99], [26.249, 40.884], [26.208, 40.867], [26.211, 40.838], [26.18, 40.82], [26.128, 40.756], [26.12, 40.578], [26.738, 40.568], [26.257, 40.256], [26.349, 40.116], [26.603, 40.322], [27.057, 40.586], [27.539, 40.96], [28.037, 41.024], [28.705, 40.951], [29.097, 40.928], [29.111, 40.81], [29.327, 40.766], [29.671, 40.724], [29.119, 40.673], [29.057, 40.458], [28.511, 40.409], [28.043, 40.453], [28.032, 40.497], [27.717, 40.451], [27.852, 40.379], [27.585, 40.32], [27.305, 40.461], [27.09, 40.45], [26.892, 40.404], [26.689, 40.373], [26.501, 40.215], [26.39, 40.153], [26.257, 40.021], [25.974, 39.792], [26.295, 39.476], [26.865, 39.554], [26.838, 39.441], [26.739, 39.379], [26.693, 39.358], [26.564, 39.379], [26.586, 39.328], [26.678, 39.256], [26.779, 39.034], [26.928, 38.917], [26.907, 38.83], [26.822, 38.77], [26.712, 38.653], [26.892, 38.486], [27.033, 38.448], [26.981, 38.408], [26.775, 38.457], [26.687, 38.499], [26.633, 38.413], [26.544, 38.635], [26.348, 38.634], [26.34, 38.457], [26.406, 38.438], [26.437, 38.404], [26.368, 38.322], [26.268, 38.379], [26.249, 38.258], [26.467, 38.176], [26.64, 38.175], [26.816, 38.128], [26.892, 38.049], [27.16, 37.973], [27.234, 37.822], [27.013, 37.695], [27.156, 37.567], [27.21, 37.413], [27.297, 37.34], [27.408, 37.385], [27.449, 37.249], [27.571, 37.264], [27.498, 37.17], [27.516, 37.123], [27.38, 37.169], [27.32, 37.148], [27.274, 37.109], [27.243, 37.022], [27.353, 36.998], [27.481, 36.953], [27.73, 36.984], [28.203, 37.027], [28.165, 36.956], [28.0, 36.871], [27.922, 36.813], [27.64, 36.818], [27.454, 36.779], [27.35, 36.695], [27.535, 36.658], [27.71, 36.736], [27.943, 36.737], [27.986, 36.717], [28.041, 36.614], [27.997, 36.555], [28.135, 36.601], [28.293, 36.714], [28.323, 36.79], [28.457, 36.806], [28.583, 36.794], [28.639, 36.695], [28.815, 36.646], [28.928, 36.655], [29.022, 36.678], [29.025, 36.612], [29.095, 36.54], [29.098, 36.41], [29.288, 36.265], [29.379, 36.226], [29.422, 36.225], [29.476, 36.209], [29.621, 36.194], [29.652, 36.125], [29.79, 36.132], [29.959, 36.21], [30.162, 36.292], [30.409, 36.164], [30.473, 36.255], [30.497, 36.387], [30.555, 36.513], [30.576, 36.728], [30.784, 36.841], [31.387, 36.755], [31.772, 36.597], [32.016, 36.533], [32.3, 36.224], [32.772, 36.021], [33.024, 36.086], [33.262, 36.123], [33.52, 36.132], [33.662, 36.145], [33.776, 36.173], [33.909, 36.3], [34.088, 36.324], [34.243, 36.533], [34.553, 36.733], [34.895, 36.73], [35.414, 36.566], [35.653, 36.667], [35.679, 36.756], [35.938, 36.868], [36.183, 36.711], [36.001, 36.506], [35.771, 36.317], [35.915, 35.955], [36.107, 35.861], [36.284, 35.945], [36.378, 36.072], [36.381, 36.116], [36.381, 36.155], [36.399, 36.191], [36.383, 36.216], [36.487, 36.219], [36.593, 36.224], [36.673, 36.236], [36.684, 36.295], [36.613, 36.336], [36.557, 36.462], [36.641, 36.784], [36.98, 36.76], [37.065, 36.642], [37.402, 36.646], [37.785, 36.75], [38.162, 36.9], [38.589, 36.827], [39.515, 36.706], [40.18, 36.876], [40.759, 37.115], [41.217, 37.063], [41.962, 37.163], [42.259, 37.273], [42.354, 37.104], [42.426, 37.126], [42.485, 37.135], [42.58, 37.147], [42.678, 37.271], [42.961, 37.313], [43.256, 37.328], [43.513, 37.239], [43.811, 37.22], [44.063, 37.323], [44.279, 37.167], [44.352, 37.043], [44.611, 37.177], [44.788, 37.257], [44.655, 37.389], [44.602, 37.583], [44.449, 37.804], [44.252, 37.944], [44.36, 38.102], [44.495, 38.347], [44.305, 38.447], [44.258, 38.719], [44.242, 38.872], [44.179, 39.01], [44.173, 39.176], [44.039, 39.364], [44.195, 39.414], [44.425, 39.413], [44.481, 39.664], [44.815, 39.64], [44.749, 39.716], [44.613, 39.824], [44.42, 40.002], [44.07, 40.036], [43.816, 40.067], [43.716, 40.161], [43.632, 40.298], [43.568, 40.496], [43.727, 40.663], [43.673, 40.912], [43.447, 41.1], [43.238, 41.184], [43.214, 41.306], [43.0, 41.405], [42.872, 41.501], [42.783, 41.577], [42.516, 41.473], [42.178, 41.515], [41.893, 41.48], [41.789, 41.45], [41.633, 41.487], [41.416, 41.416], [40.707, 41.103], [40.009, 40.991], [39.356, 41.1], [38.804, 41.028], [38.237, 40.953], [37.669, 41.149], [37.164, 41.167], [36.425, 41.259], [36.016, 41.729], [35.226, 41.797], [35.123, 42.036], [35.007, 42.109]],
]

/** Sınır halkalarını projeksiyondan geçirip tek bir SVG path "d" üretir. */
const COUNTRY_PATH = TURKEY_RINGS.map((ring) =>
  ring
    .map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${projX(lon).toFixed(1)} ${projY(lat).toFixed(1)}`)
    .join(' ') + ' Z',
).join(' ')

/** Graticule (ızgara) çizgileri — boylam/enlem adımlarında. */
const GRID_LON = [27.5, 30, 32.5, 35, 37.5, 40, 42.5]
const GRID_LAT = [37, 38.5, 40, 41.5]

interface TooltipState {
  node: FacilityNode
  x: number
  y: number
}

export function TurkeyMap() {
  const [nodes, setNodes] = useState<FacilityNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tip, setTip] = useState<TooltipState | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    listFacilityNodes()
      .then((res) => {
        if (!alive) return
        if (res.succeeded && res.data) setNodes(res.data)
        else setError(res.message ?? 'Harita verisi alınamadı.')
      })
      .catch(() => alive && setError('Harita verisi alınamadı.'))
    return () => {
      alive = false
    }
  }, [])

  const hq = useMemo(() => nodes?.find((n) => n.nodeType === 0) ?? null, [nodes])

  /** Genel merkezden aktif toplama merkezlerine bağlantı çizgileri. */
  const links = useMemo(() => {
    if (!hq || !nodes) return []
    return nodes
      .filter((n) => n.id !== hq.id && n.status === 0)
      .map((n) => ({
        id: n.id,
        x1: projX(hq.longitude),
        y1: projY(hq.latitude),
        x2: projX(n.longitude),
        y2: projY(n.latitude),
      }))
  }, [hq, nodes])

  const activeCount = nodes?.filter((n) => n.status === 0).length ?? 0
  const plannedCount = nodes?.filter((n) => n.status === 1).length ?? 0

  function showTip(node: FacilityNode, e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setTip({ node, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div className="fx-map" ref={wrapRef}>
      <svg className="fx-map__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="Türkiye operasyon haritası">
        <defs>
          <radialGradient id="fx-map-bg" cx="50%" cy="35%" r="80%">
            <stop offset="0%" stopColor="var(--fx-brand)" stopOpacity="0.10" />
            <stop offset="60%" stopColor="var(--fx-brand)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="fx-map-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arka plan ışıması */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#fx-map-bg)" />

        {/* Izgara */}
        <g className="fx-map__grid">
          {GRID_LON.map((lon) => (
            <line key={`v${lon}`} x1={projX(lon)} y1={0} x2={projX(lon)} y2={VB_H} />
          ))}
          {GRID_LAT.map((lat) => (
            <line key={`h${lat}`} x1={0} y1={projY(lat)} x2={VB_W} y2={projY(lat)} />
          ))}
        </g>

        {/* Ülke silüeti */}
        <path className="fx-map__country" d={COUNTRY_PATH} filter="url(#fx-map-glow)" />

        {/* Bağlantı çizgileri (GM → aktif toplama merkezleri) */}
        <g>
          {links.map((l) => (
            <line key={l.id} className="fx-map__link" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>

        {/* Düğümler */}
        <g>
          {nodes?.map((n) => {
            const x = projX(n.longitude)
            const y = projY(n.latitude)
            const isHq = n.nodeType === 0
            const planned = n.status === 1
            const r = isHq ? 8 : 5
            return (
              <g
                key={n.id}
                className={`fx-map__node${planned ? ' fx-map__node--planned' : ''}${isHq ? ' fx-map__node--hq' : ''}`}
                onMouseEnter={(e) => showTip(n, e)}
                onMouseMove={(e) => showTip(n, e)}
                onMouseLeave={() => setTip(null)}
              >
                {!planned && <circle className="fx-map__pulse" cx={x} cy={y} r={r} />}
                <circle className="fx-map__dot" cx={x} cy={y} r={r} />
                {isHq && <circle className="fx-map__hq-ring" cx={x} cy={y} r={r + 5} />}
                {isHq && (
                  <text className="fx-map__hq-label" x={x + 13} y={y + 4}>
                    {n.city}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Lejant */}
      <div className="fx-map__legend">
        <span className="fx-map__legend-item"><i className="fx-map__sw fx-map__sw--hq" /> Genel Merkez</span>
        <span className="fx-map__legend-item"><i className="fx-map__sw fx-map__sw--active" /> Toplama Merkezi</span>
        <span className="fx-map__legend-item"><i className="fx-map__sw fx-map__sw--planned" /> Planlı</span>
      </div>

      {/* Özet rozetleri */}
      <div className="fx-map__stats">
        <span className="fx-map__stat"><b>{activeCount}</b> aktif nokta</span>
        {plannedCount > 0 && <span className="fx-map__stat fx-map__stat--muted"><b>{plannedCount}</b> planlı</span>}
      </div>

      {/* Hover detay kartı */}
      {tip && (
        <div className="fx-map__tooltip" style={{ left: tip.x, top: tip.y }}>
          <div className="fx-map__tooltip-title">{tip.node.name}</div>
          <div className="fx-map__tooltip-meta">
            {tip.node.city} · {tip.node.nodeTypeLabel}
            <span className={`fx-map__tag fx-map__tag--${tip.node.status}`}>{tip.node.statusLabel}</span>
          </div>
          {tip.node.description && <div className="fx-map__tooltip-desc">{tip.node.description}</div>}
        </div>
      )}

      {/* Durum mesajları */}
      {!nodes && !error && <div className="fx-map__msg">Harita yükleniyor…</div>}
      {error && <div className="fx-map__msg fx-map__msg--err">{error}</div>}
    </div>
  )
}
