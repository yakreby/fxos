import { useCallback, useEffect, useRef, useState } from 'react'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import {
  listStockMovements,
  listShelves,
  deleteStockMovement,
  fmtNum,
  fmtKg,
  type Shelf,
  type StockMovement,
} from './stock-api'
import { StockMovementFormModal } from './StockMovementFormModal'
import { TransferFormModal } from './TransferFormModal'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 15, search: '', sortBy: null, sortDescending: false }
const fmtDate = (iso: string): string => iso.slice(0, 10)

/** Hareket Detayı — stok hareketleri ledger'ı (server-side) + yeni hareket / transfer. */
export function StockMovementsPage() {
  const toast = useToast()
  const [rows, setRows] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveSeq, setMoveSeq] = useState(0)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSeq, setTransferSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    void Promise.all([listProductsLookup(), listShelves()]).then(([prod, shelf]) => {
      if (prod.succeeded && prod.data) setProducts(prod.data)
      if (shelf.succeeded && shelf.data) setShelves(shelf.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listStockMovements({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sortBy: query.sortBy,
      sortDescending: query.sortDescending,
    })
    if (res.succeeded && res.data) {
      setRows(res.data.items)
      setTotal(res.data.totalCount)
    }
    setLoading(false)
  }, [])

  const reload = () => void fetchPage(queryRef.current)

  const handleDelete = async (m: StockMovement) => {
    if (!window.confirm('Bu stok hareketi silinsin mi?')) return
    const res = await deleteStockMovement(m.id)
    if (res.succeeded) { toast.success('Hareket silindi.'); reload() }
    else toast.error(res.message ?? 'Silme başarısız.')
  }

  const columns: FxColumn<StockMovement>[] = [
    { key: 'movementDate', header: 'Tarih', width: 105, sortable: true, accessor: (m) => m.movementDate, render: (m) => fmtDate(m.movementDate) },
    { key: 'product', header: 'Ürün', sortable: true, accessor: (m) => m.productName, render: (m) => <span><strong>{m.productCode}</strong> · {m.productName}</span> },
    { key: 'shelf', header: 'Raf', width: 120, render: (m) => m.shelfCode ?? <span className="fx-text-muted">—</span> },
    { key: 'direction', header: 'Yön', width: 80, render: (m) => <FxBadge tone={m.direction === 0 ? 'success' : 'warning'}>{m.directionLabel}</FxBadge> },
    { key: 'type', header: 'Tür', width: 100, render: (m) => <span className="fx-text-muted">{m.typeLabel}</span> },
    { key: 'quantity', header: 'Miktar', align: 'right', sortable: true, accessor: (m) => m.quantity, render: (m) => fmtNum(m.quantity) },
    { key: 'weight', header: 'Ağırlık', align: 'right', render: (m) => fmtKg(m.weight) },
    { key: 'reference', header: 'Referans', render: (m) => m.reference ?? <span className="fx-text-muted">—</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <FxButton variant="danger" size="sm" onClick={() => void handleDelete(m)}><FxIcon name="x" size={15} /> Sil</FxButton>
      ),
    },
  ]

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Hareket Detayı</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">Tüm stok hareketleri (giriş/çıkış/transfer/düzeltme/sayım). Eldeki stok bunlardan hesaplanır.</div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} hareket`}</div>
        <span className="fx-demo-row" style={{ gap: 8 }}>
          <FxButton variant="subtle" onClick={() => { setTransferSeq((s) => s + 1); setTransferOpen(true) }}>
            <FxIcon name="truck" size={16} /> Transfer
          </FxButton>
          <FxButton variant="primary" onClick={() => { setMoveSeq((s) => s + 1); setMoveOpen(true) }}>
            <FxIcon name="plus" size={16} /> Yeni Hareket
          </FxButton>
        </span>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(m) => m.id}
        searchPlaceholder="Ürün veya referans ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <StockMovementFormModal
        key={`move-${moveSeq}`}
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        onSaved={() => { toast.success('Stok hareketi eklendi.'); reload() }}
        products={products}
        shelves={shelves}
        today={today}
      />

      <TransferFormModal
        key={`transfer-${transferSeq}`}
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSaved={() => { toast.success('Transfer yapıldı.'); reload() }}
        products={products}
        shelves={shelves}
        today={today}
      />
    </>
  )
}
