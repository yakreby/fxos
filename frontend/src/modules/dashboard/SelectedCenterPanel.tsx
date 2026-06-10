import { FxIcon, FxBadge, FxButton } from '../../fx-ui'
import { statsFor } from '../facility/facility-mock'
import type { FacilityNode, FacilityNodeStatus } from '../facility/facility-api'

/**
 * SelectedCenterPanel — komuta merkezi sağ rayındaki "seçili merkez" dosyası.
 * Haritada bir noktaya tıklanınca o merkezin özeti burada kalıcı görünür (mock istatistik).
 */
const nf = new Intl.NumberFormat('tr-TR')

const statusTone: Record<FacilityNodeStatus, 'success' | 'warning' | 'neutral'> = {
  0: 'success',
  1: 'warning',
  2: 'neutral',
}

export function SelectedCenterPanel({ node, onDetails }: { node: FacilityNode | null; onDetails: () => void }) {
  if (!node) {
    return (
      <div className="fx-cc-card fx-cc-selected fx-cc-selected--empty">
        <FxIcon name="map-pin" size={26} />
        <div className="fx-cc-selected__hint">Haritadan bir merkez seçin</div>
        <div className="fx-cc-selected__hint2">Müşteri, palet ve tonaj detayları burada görünecek.</div>
      </div>
    )
  }

  const s = statsFor(node)
  return (
    <div className="fx-cc-card fx-cc-selected">
      <div className="fx-cc-selected__head">
        <div>
          <div className="fx-cc-selected__name">{node.name}</div>
          <div className="fx-cc-selected__city">{node.city} · {node.nodeTypeLabel}</div>
        </div>
        <FxBadge tone={statusTone[node.status]}>{node.statusLabel}</FxBadge>
      </div>

      <div className="fx-cc-stats">
        <div className="fx-cc-stat"><span>Müşteri</span><b>{s.customer}</b></div>
        <div className="fx-cc-stat"><span>Palet</span><b>{nf.format(s.palletCount)}</b></div>
        <div className="fx-cc-stat"><span>Tonaj</span><b>{nf.format(s.movementTonnage)} t</b></div>
        <div className="fx-cc-stat"><span>Toplam Palet</span><b>{nf.format(s.totalPallets)}</b></div>
      </div>

      <div className="fx-cc-selected__plates">
        {s.recentPlates.map((p) => <span key={p} className="fx-cc-plate">{p}</span>)}
      </div>

      <FxButton variant="subtle" size="sm" onClick={onDetails}>
        <FxIcon name="chevron-right" size={15} /> Merkez Detayları
      </FxButton>
    </div>
  )
}
