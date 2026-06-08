import { useCallback, useEffect, useState } from 'react'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn } from '../../fx-ui'
import { listShelves, deleteShelf, fmtNum, fmtKg, type Shelf } from './stock-api'
import { ShelfFormModal } from './ShelfFormModal'

/** Raflar — raf/lokasyon yönetimi + doluluk (hareketlerden). */
export function ShelvesPage() {
  const toast = useToast()
  const [items, setItems] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Shelf | null>(null)
  const [openSeq, setOpenSeq] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listShelves()
    if (res.succeeded && res.data) setItems(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => { setEditing(null); setOpenSeq((s) => s + 1); setModalOpen(true) }
  const openEdit = (s: Shelf) => { setEditing(s); setOpenSeq((x) => x + 1); setModalOpen(true) }

  const handleDelete = async (s: Shelf) => {
    if (!window.confirm(`"${s.code}" rafı silinsin mi?`)) return
    const res = await deleteShelf(s.id)
    if (res.succeeded) { toast.success('Raf silindi.'); void load() }
    else toast.error(res.message ?? 'Silme başarısız.')
  }

  const columns: FxColumn<Shelf>[] = [
    { key: 'code', header: 'Kod', sortable: true, accessor: (s) => s.code, render: (s) => <strong>{s.code}</strong> },
    { key: 'name', header: 'Ad', sortable: true, accessor: (s) => s.name },
    { key: 'quantityOnHand', header: 'Doluluk (Miktar)', align: 'right', sortable: true, accessor: (s) => s.quantityOnHand, render: (s) => fmtNum(s.quantityOnHand) },
    { key: 'weightOnHand', header: 'Doluluk (KG)', align: 'right', render: (s) => fmtKg(s.weightOnHand) },
    { key: 'productCount', header: 'Ürün Çeşidi', align: 'right', render: (s) => <FxBadge tone={s.productCount > 0 ? 'info' : 'neutral'}>{s.productCount}</FxBadge> },
    { key: 'capacity', header: 'Kapasite', align: 'right', accessor: (s) => s.capacity ?? 0, render: (s) => (s.capacity != null ? fmtNum(s.capacity) : <span className="fx-text-muted">—</span>) },
    { key: 'isActive', header: 'Durum', width: 90, render: (s) => <FxBadge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Aktif' : 'Pasif'}</FxBadge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => openEdit(s)}><FxIcon name="settings" size={15} /> Düzenle</FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(s)}><FxIcon name="x" size={15} /> Sil</FxButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Raflar</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">Raf/lokasyon tanımları ve doluluk (stok hareketlerinden hesaplanır).</div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${items.length} raf`}</div>
        <FxButton variant="primary" onClick={openNew}><FxIcon name="plus" size={16} /> Yeni Raf</FxButton>
      </div>

      <FxTable columns={columns} data={items} rowKey={(s) => s.id} pageSize={10} loading={loading} searchPlaceholder="Raf ara…" emptyText="Henüz raf yok." />

      <ShelfFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { toast.success(editing !== null ? 'Raf güncellendi.' : 'Raf oluşturuldu.'); void load() }}
        initial={editing}
      />
    </>
  )
}
