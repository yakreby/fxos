import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import { listAccountsLookup, type AccountLookup } from '../pre-accounting/preaccounting-api'
import {
  listGoodsReceipts,
  deleteGoodsReceipt,
  fmtQty,
  fmtKg,
  type GoodsReceiptListItem,
  type GoodsReceiptStatus,
} from './goods-receipts-api'
import { GoodsReceiptFormModal } from './GoodsReceiptFormModal'
import { ExportButton } from '../common/ExportButton'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

const statusTone: Record<GoodsReceiptStatus, 'warning' | 'success' | 'neutral'> = {
  0: 'warning',  // Taslak
  1: 'success',  // Onaylandı
  2: 'neutral',  // İptal
}

const fmtDate = (iso: string): string => iso.slice(0, 10)

/**
 * Mal Kabul modülü — fiş listesi (server-side) + yeni fiş. Satırlar fiş detayında yönetilir.
 * Tedarikçi cari FK'si; satırlar ürün FK'si. (Stok girişi/adresleme ileride.)
 */
export function GoodsReceiptsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<GoodsReceiptListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<AccountLookup[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    void listAccountsLookup().then((res) => {
      if (res.succeeded && res.data) setSuppliers(res.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listGoodsReceipts({
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

  const handleDelete = async (g: GoodsReceiptListItem) => {
    if (!window.confirm(`"${g.receiptNumber}" mal kabul fişi silinsin mi?`)) return
    const res = await deleteGoodsReceipt(g.id)
    if (res.succeeded) {
      toast.success('Mal kabul silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<GoodsReceiptListItem>[] = [
    {
      key: 'receiptNumber',
      header: 'Fiş No',
      width: 160,
      sortable: true,
      accessor: (g) => g.receiptNumber,
      render: (g) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/goods-receipt/${g.id}`)}>
          <strong>{g.receiptNumber}</strong>
        </button>
      ),
    },
    { key: 'receiptDate', header: 'Tarih', width: 110, sortable: true, accessor: (g) => g.receiptDate, render: (g) => fmtDate(g.receiptDate) },
    { key: 'supplier', header: 'Tedarikçi', sortable: true, accessor: (g) => g.supplierName ?? '', render: (g) => g.supplierName ?? <span className="fx-text-muted">—</span> },
    { key: 'lineCount', header: 'Satır', width: 70, align: 'right', render: (g) => g.lineCount },
    { key: 'totalQuantity', header: 'Miktar', align: 'right', render: (g) => fmtQty(g.totalQuantity) },
    { key: 'totalWeight', header: 'Tartım', align: 'right', render: (g) => fmtKg(g.totalWeight) },
    {
      key: 'status',
      header: 'Durum',
      width: 110,
      sortable: true,
      accessor: (g) => g.status,
      render: (g) => <FxBadge tone={statusTone[g.status]}>{g.statusLabel}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (g) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/goods-receipt/${g.id}`)}>
            <FxIcon name="chevron-right" size={15} /> Detay
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(g)}>
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
          <div className="fx-page-head__title">Mal Kabul</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Gelen ürünlerin tesise kabulü, tartım ve satır kalemleri. Satırlar fiş detayında yönetilir.
        </div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} fiş`}</div>
        <span className="fx-demo-row" style={{ gap: 8 }}>
          <ExportButton endpoint="/goods-receipts/export" fileBase="mal-kabul" />
          <FxButton variant="primary" onClick={() => { setOpenSeq((s) => s + 1); setModalOpen(true) }}>
            <FxIcon name="plus" size={16} /> Yeni Mal Kabul
          </FxButton>
        </span>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(g) => g.id}
        searchPlaceholder="Fiş no veya tedarikçi ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <GoodsReceiptFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { toast.success('Mal kabul oluşturuldu.'); reload() }}
        initial={null}
        suppliers={suppliers}
        today={today}
      />
    </>
  )
}
