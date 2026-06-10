import type { FacilityNode } from './facility-api'

/**
 * Harita noktaları için **geçici mock istatistikler** (sunum için). Düğüm id'sinden
 * deterministik üretilir → her render'da aynı kalır. İleride gerçek Sayım/Hareket
 * verisiyle (`/facility/nodes/{id}/stats` gibi bir uçla) değiştirilecek.
 */
export interface NodeStats {
  customer: string
  palletCount: number
  totalPallets: number
  movementTonnage: number
  recentPlates: string[]
  /** Son 7 günlük hareket (mini grafik için). */
  trend: number[]
}

const CUSTOMERS = [
  'Migros', 'BİM', 'A101', 'ŞOK Marketler', 'CarrefourSA',
  'Metro Türkiye', 'Banvit', 'Pınar', 'Ülker', 'Eti', 'Torku',
]

/** İl plaka kodları (plaka üretimi için). */
const PLATE_CODES: Record<string, string> = {
  'İstanbul': '34', 'Bursa': '16', 'Kocaeli': '41', 'Sakarya': '54',
  'İzmir': '35', 'Balıkesir': '10', 'Eskişehir': '26', 'Ankara': '06',
  'Antalya': '07', 'Konya': '42', 'Denizli': '20', 'Trabzon': '61',
}

const LETTERS = 'ABCDEFGHJKLMNPRSTUVYZ'

/** FNV-1a hash → 32-bit seed. */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — deterministik PRNG (0..1). */
function rngFrom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function plate(code: string, r: () => number): string {
  const l = Array.from({ length: 2 + Math.floor(r() * 2) }, () => LETTERS[Math.floor(r() * LETTERS.length)]).join('')
  const n = 100 + Math.floor(r() * 900)
  return `${code} ${l} ${n}`
}

/** Bir düğüm için deterministik mock istatistik üretir. */
export function statsFor(node: FacilityNode): NodeStats {
  const r = rngFrom(hashStr(node.id))
  const palletCount = 20 + Math.floor(r() * 180)
  const totalPallets = palletCount * 6 + Math.floor(r() * 600)
  const movementTonnage = Math.round((palletCount * 0.45 + r() * 28) * 10) / 10
  const customer = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)]
  const code = PLATE_CODES[node.city] ?? '34'
  const recentPlates = [plate(code, r), plate(code, r), plate(code, r)]
  const trend = Array.from({ length: 7 }, () => 12 + Math.floor(r() * 88))
  return { customer, palletCount, totalPallets, movementTonnage, recentPlates, trend }
}

const nf = new Intl.NumberFormat('tr-TR')

/** Leaflet popup'ı için tech-style istatistik kartı HTML'i üretir. */
export function statsPopupHtml(node: FacilityNode, s: NodeStats): string {
  const maxTrend = Math.max(...s.trend, 1)
  const bars = s.trend
    .map((v) => `<span class="fx-mappop__bar" style="height:${Math.round((v / maxTrend) * 100)}%"></span>`)
    .join('')
  const plates = s.recentPlates.map((p) => `<span class="fx-mappop__plate">${p}</span>`).join('')
  return `
  <div class="fx-mappop">
    <div class="fx-mappop__head">
      <div class="fx-mappop__title">${node.name}</div>
      <div class="fx-mappop__sub">${node.city} · ${node.nodeTypeLabel}</div>
    </div>
    <div class="fx-mappop__grid">
      <div class="fx-mappop__stat"><span class="fx-mappop__k">Müşteri</span><span class="fx-mappop__v">${s.customer}</span></div>
      <div class="fx-mappop__stat"><span class="fx-mappop__k">Palet Sayısı</span><span class="fx-mappop__v">${nf.format(s.palletCount)}</span></div>
      <div class="fx-mappop__stat"><span class="fx-mappop__k">Hareket Tonajı</span><span class="fx-mappop__v">${nf.format(s.movementTonnage)} t</span></div>
      <div class="fx-mappop__stat"><span class="fx-mappop__k">Toplam Palet</span><span class="fx-mappop__v">${nf.format(s.totalPallets)}</span></div>
    </div>
    <div class="fx-mappop__section">
      <span class="fx-mappop__k">Son Plakalar</span>
      <div class="fx-mappop__plates">${plates}</div>
    </div>
    <div class="fx-mappop__section">
      <span class="fx-mappop__k">Haftalık Hareket</span>
      <div class="fx-mappop__chart">${bars}</div>
    </div>
    <button type="button" class="fx-mappop__btn">Merkez Detayları →</button>
  </div>`
}
