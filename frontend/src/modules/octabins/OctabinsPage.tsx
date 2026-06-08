import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import { listShelves, type Shelf } from '../stock/stock-api'
import {
  listOctabins,
  deleteOctabin,
  fmtKg,
  fmtPercent,
  type OctabinListItem,
  type OctabinStatus,
} from './octabins-api'
import { OctabinFormModal } from './OctabinFormModal'
import { ExportButton } from '../common/ExportButton'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

const statusTone: Record<OctabinStatus, 'warning' | 'success' | 'neutral'> = {
  0: 'warning',  // Açık
  1: 'success',  // Dolu
  2: 'neutral',  // Sevk Edildi
}

const fmtDate = (iso: string): string => iso.slice(0, 10)

/** Octabin içeriğinin özet metni (atık tipi > ürün > serbest metin). */
const contentSummary = (o: OctabinListItem): string =>
  o.wasteTypeName ?? o.productName ?? o.content ?? ''

/**
 * Octabin modülü — liste (server-side) + yeni octabin. Durum akışı (kapat/sevk) detayda.
 * İçerik esnek: atık tipi (Definition FK) ve/veya ürün ve/veya serbest metin.
 */
export function OctabinsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<OctabinListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [wasteTypes, setWasteTypes] = useState<Definition[]>([])
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    void Promise.all([listDefinitions(1), listProductsLookup(), listShelves()]).then(([wt, prod, shelf]) => {
      if (wt.succeeded && wt.data) setWasteTypes(wt.data)
      if (prod.succeeded && prod.data) setProducts(prod.data)
      if (shelf.succeeded && shelf.data) setShelves(shelf.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listOctabins({
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

  const handleDelete = async (o: OctabinListItem) => {
    if (!window.confirm(`"${o.octabinNumber}" octabin silinsin mi?`)) return
    const res = await deleteOctabin(o.id)
    if (res.succeeded) {
      toast.success('Octabin silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<OctabinListItem>[] = [
    {
      key: 'octabinNumber',
      header: 'Octabin No',
      width: 170,
      sortable: true,
      accessor: (o) => o.octabinNumber,
      render: (o) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/octabin/${o.id}`)}>
          <strong>{o.octabinNumber}</strong>
        </button>
      ),
    },
    { key: 'openedDate', header: 'Açılış', width: 110, sortable: true, accessor: (o) => o.openedDate, render: (o) => fmtDate(o.openedDate) },
    { key: 'content', header: 'İçerik', render: (o) => contentSummary(o) || <span className="fx-text-muted">—</span> },
    { key: 'shelf', header: 'Raf', width: 120, render: (o) => o.shelfCode ?? <span className="fx-text-muted">—</span> },
    { key: 'fillPercent', header: 'Doluluk', width: 100, align: 'right', render: (o) => fmtPercent(o.fillPercent) },
    { key: 'netWeight', header: 'Net Ağırlık', align: 'right', sortable: true, accessor: (o) => o.netWeight ?? 0, render: (o) => fmtKg(o.netWeight) },
    {
      key: 'status',
      header: 'Durum',
      width: 120,
      sortable: true,
      accessor: (o) => o.status,
      render: (o) => <FxBadge tone={statusTone[o.status]}>{o.statusLabel}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/octabin/${o.id}`)}>
            <FxIcon name="chevron-right" size={15} /> Detay
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(o)}>
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
          <div className="fx-page-head__title">Octabin Yönetimi</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Büyük konteyner (octabin) takibi: açma, doldurma, kapatma ve sevk. Durum akışı octabin detayında.
        </div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} octabin`}</div>
        <span className="fx-demo-row" style={{ gap: 8 }}>
          <ExportButton endpoint="/octabins/export" fileBase="octabin" />
          <FxButton variant="primary" onClick={() => { setOpenSeq((s) => s + 1); setModalOpen(true) }}>
            <FxIcon name="plus" size={16} /> Yeni Octabin
          </FxButton>
        </span>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        searchPlaceholder="Octabin no, içerik veya ürün ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <OctabinFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { toast.success('Octabin oluşturuldu.'); reload() }}
        initial={null}
        wasteTypes={wasteTypes}
        products={products}
        shelves={shelves}
        today={today}
      />
    </>
  )
}
