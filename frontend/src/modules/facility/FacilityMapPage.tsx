import { useCallback, useEffect, useState } from 'react'
import { FxBadge, FxButton, FxCard, FxIcon, FxTable, useToast, type FxColumn } from '../../fx-ui'
import { FacilityLeafletMap } from './FacilityLeafletMap'
import { FacilityNodeFormModal } from './FacilityNodeFormModal'
import {
  listFacilityNodes,
  deleteFacilityNode,
  type FacilityNode,
  type FacilityNodeStatus,
} from './facility-api'

const statusTone: Record<FacilityNodeStatus, 'success' | 'warning' | 'neutral'> = {
  0: 'success', // Aktif
  1: 'warning', // Planlı
  2: 'neutral', // Pasif
}

/**
 * Lokasyon Haritası (yönetim) — gerçek gezilebilir Leaflet haritası (CARTO dark) üzerinde
 * tesis/toplama noktalarının yönetimi: haritaya tıkla → koordinat otomatik → nokta ekle;
 * marker'a tıkla → düzenle/sil. Aynı `FacilityNode` verisi Dashboard'daki SVG hero'yu da besler.
 */
export function FacilityMapPage() {
  const toast = useToast()
  const [nodes, setNodes] = useState<FacilityNode[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FacilityNode | null>(null)
  const [prefill, setPrefill] = useState<{ lat: number; lng: number } | null>(null)
  const [seq, setSeq] = useState(0)

  // setState yalnız .then() callback'inde (effect içinde senkron setState yok).
  const loadNodes = useCallback(() => {
    void listFacilityNodes().then((res) => {
      if (res.succeeded && res.data) setNodes(res.data)
      else toast.error(res.message ?? 'Noktalar alınamadı.')
      setLoading(false)
    })
  }, [toast])

  useEffect(() => {
    loadNodes()
  }, [loadNodes])

  const openNew = (coords: { lat: number; lng: number } | null) => {
    setEditing(null)
    setPrefill(coords)
    setSeq((s) => s + 1)
    setModalOpen(true)
  }

  const openEdit = (node: FacilityNode) => {
    setEditing(node)
    setPrefill(null)
    setSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (node: FacilityNode) => {
    if (!window.confirm(`"${node.name}" noktası silinsin mi?`)) return
    const res = await deleteFacilityNode(node.id)
    if (res.succeeded) {
      toast.success('Nokta silindi.')
      loadNodes()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<FacilityNode>[] = [
    { key: 'name', header: 'Ad', render: (n) => <strong>{n.name}</strong> },
    { key: 'city', header: 'Şehir', width: 130, render: (n) => n.city },
    {
      key: 'type',
      header: 'Tür',
      width: 150,
      render: (n) => <FxBadge tone={n.nodeType === 0 ? 'brand' : 'info'}>{n.nodeTypeLabel}</FxBadge>,
    },
    {
      key: 'status',
      header: 'Durum',
      width: 110,
      render: (n) => <FxBadge tone={statusTone[n.status]}>{n.statusLabel}</FxBadge>,
    },
    {
      key: 'coords',
      header: 'Koordinat',
      width: 160,
      render: (n) => (
        <span className="fx-text-muted" style={{ fontFamily: 'var(--fx-font-mono)', fontSize: 12.5 }}>
          {n.latitude.toFixed(4)}, {n.longitude.toFixed(4)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (n) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => openEdit(n)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(n)}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Lokasyon Haritası</div>
          <FxBadge tone="brand">Sevkiyat & Lojistik</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Tesis ve toplama noktalarını harita üzerinde yönetin. Haritaya tıklayarak yeni nokta
          ekleyin (koordinat otomatik dolar); noktaya tıklayarak düzenleyin.
        </div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${nodes.length} nokta`}</div>
        <FxButton variant="primary" onClick={() => openNew(null)}>
          <FxIcon name="plus" size={16} /> Yeni Nokta
        </FxButton>
      </div>

      <FacilityLeafletMap nodes={nodes} onMapClick={(lat, lng) => openNew({ lat, lng })} onMarkerClick={openEdit} />

      <div style={{ marginTop: 'var(--fx-space-6)' }}>
        <FxCard title="Noktalar">
          <FxTable columns={columns} data={nodes} rowKey={(n) => n.id} loading={loading} />
        </FxCard>
      </div>

      <FacilityNodeFormModal
        key={seq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(msg) => { toast.success(msg); loadNodes() }}
        onDeleted={(msg) => { toast.success(msg); loadNodes() }}
        initial={editing}
        prefill={prefill}
      />
    </>
  )
}
