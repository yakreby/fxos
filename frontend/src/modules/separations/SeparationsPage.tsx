import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listPersonnelLookup, type PersonnelLookup } from '../personnel/personnel-api'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import { listShelves, type Shelf } from '../stock/stock-api'
import {
  listSeparations,
  deleteSeparation,
  fmtNum,
  type SeparationListItem,
  type SeparationStatus,
} from './separations-api'
import { SeparationFormModal } from './SeparationFormModal'
import { ExportButton } from '../common/ExportButton'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

const statusTone: Record<SeparationStatus, 'neutral' | 'warning' | 'success'> = {
  0: 'neutral',  // Beklemede
  1: 'warning',  // Ayrıştırılıyor
  2: 'success',  // Tamamlandı
  3: 'neutral',  // İptal
}

const fmtDate = (iso: string): string => iso.slice(0, 10)

/** Separasyon talebinin işlem/içerik özet metni. */
const processSummary = (s: SeparationListItem): string =>
  s.processTypeName ?? s.wasteTypeName ?? s.content ?? ''

/**
 * Separasyon modülü — talep listesi (server-side) + yeni talep. Durum akışı detayda.
 * İşlem personele damgalanır (performans). İçerik/işlem/sonuç Definition lookup'ları.
 */
export function SeparationsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<SeparationListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [personnel, setPersonnel] = useState<PersonnelLookup[]>([])
  const [wasteTypes, setWasteTypes] = useState<Definition[]>([])
  const [processTypes, setProcessTypes] = useState<Definition[]>([])
  const [wasteGroups, setWasteGroups] = useState<Definition[]>([])
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    void Promise.all([
      listPersonnelLookup(),
      listDefinitions(1), // WasteType
      listDefinitions(4), // ProcessType
      listDefinitions(3), // WasteGroup
      listProductsLookup(),
      listShelves(),
    ]).then(([per, wt, pt, wg, prod, shelf]) => {
      if (per.succeeded && per.data) setPersonnel(per.data)
      if (wt.succeeded && wt.data) setWasteTypes(wt.data)
      if (pt.succeeded && pt.data) setProcessTypes(pt.data)
      if (wg.succeeded && wg.data) setWasteGroups(wg.data)
      if (prod.succeeded && prod.data) setProducts(prod.data)
      if (shelf.succeeded && shelf.data) setShelves(shelf.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listSeparations({
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

  const handleDelete = async (s: SeparationListItem) => {
    if (!window.confirm(`"${s.requestNumber}" separasyon talebi silinsin mi?`)) return
    const res = await deleteSeparation(s.id)
    if (res.succeeded) {
      toast.success('Separasyon talebi silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<SeparationListItem>[] = [
    {
      key: 'requestNumber',
      header: 'Talep No',
      width: 160,
      sortable: true,
      accessor: (s) => s.requestNumber,
      render: (s) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/separation/${s.id}`)}>
          <strong>{s.requestNumber}</strong>
        </button>
      ),
    },
    { key: 'requestDate', header: 'Tarih', width: 110, sortable: true, accessor: (s) => s.requestDate, render: (s) => fmtDate(s.requestDate) },
    { key: 'personnel', header: 'Personel', render: (s) => s.assignedPersonnelName ?? <span className="fx-text-muted">—</span> },
    { key: 'process', header: 'İşlem', render: (s) => processSummary(s) || <span className="fx-text-muted">—</span> },
    { key: 'palletCount', header: 'Palet', width: 80, align: 'right', sortable: true, accessor: (s) => s.palletCount ?? 0, render: (s) => fmtNum(s.palletCount) },
    {
      key: 'status',
      header: 'Durum',
      width: 130,
      sortable: true,
      accessor: (s) => s.status,
      render: (s) => <FxBadge tone={statusTone[s.status]}>{s.statusLabel}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/separation/${s.id}`)}>
            <FxIcon name="chevron-right" size={15} /> Detay
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(s)}>
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
          <div className="fx-page-head__title">Separasyon</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Ayrıştırma talepleri ve durum akışı (geri kazanım/imha). İşlem atanan personele damgalanır.
        </div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} talep`}</div>
        <span className="fx-demo-row" style={{ gap: 8 }}>
          <ExportButton endpoint="/separations/export" fileBase="separasyon" />
          <FxButton variant="primary" onClick={() => { setOpenSeq((s) => s + 1); setModalOpen(true) }}>
            <FxIcon name="plus" size={16} /> Yeni Talep
          </FxButton>
        </span>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(s) => s.id}
        searchPlaceholder="Talep no, personel veya içerik ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <SeparationFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { toast.success('Separasyon talebi oluşturuldu.'); reload() }}
        initial={null}
        personnel={personnel}
        wasteTypes={wasteTypes}
        processTypes={processTypes}
        wasteGroups={wasteGroups}
        products={products}
        shelves={shelves}
        today={today}
      />
    </>
  )
}
