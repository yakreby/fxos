import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxBadge, FxButton, FxIcon, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listAccountsLookup, type AccountLookup } from '../pre-accounting/preaccounting-api'
import {
  listProducts,
  getProduct,
  deleteProduct,
  type ProductListItem,
  type ProductDetail,
} from './products-api'
import { ProductFormModal, type ProductFormLookups } from './ProductFormModal'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

const EMPTY_LOOKUPS: ProductFormLookups = {
  customers: [], productGroups: [], returnGroups: [], wasteGroups: [], processTypes: [],
}

/**
 * Ürünler modülü — ürün kartları (server-side liste) + CRUD. Grup/tür alanları Tanımlamalar
 * (Definition) FK'leri, müşteri cari FK'sidir. Diğer modüller (Mal Kabul/Stok) buna bağlanacak.
 */
export function ProductsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lookups, setLookups] = useState<ProductFormLookups>(EMPTY_LOOKUPS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductDetail | null>(null)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  // Dropdown lookup'ları bir kez: cariler + 4 Definition türü (5/2/3/4).
  useEffect(() => {
    void Promise.all([
      listAccountsLookup(),
      listDefinitions(5), // ProductGroup
      listDefinitions(2), // ReturnGroup
      listDefinitions(3), // WasteGroup
      listDefinitions(4), // ProcessType
    ]).then(([cust, pg, rg, wg, pt]) => {
      setLookups({
        customers: (cust.succeeded && cust.data ? cust.data : []) as AccountLookup[],
        productGroups: pickActive(pg.data),
        returnGroups: pickActive(rg.data),
        wasteGroups: pickActive(wg.data),
        processTypes: pickActive(pt.data),
      })
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listProducts({
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

  const openNew = () => {
    setEditing(null)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const openEdit = async (p: ProductListItem) => {
    const res = await getProduct(p.id)
    if (!res.succeeded || !res.data) {
      toast.error(res.message ?? 'Ürün detayı alınamadı.')
      return
    }
    setEditing(res.data)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (p: ProductListItem) => {
    if (!window.confirm(`"${p.name}" silinsin mi?`)) return
    const res = await deleteProduct(p.id)
    if (res.succeeded) {
      toast.success('Ürün silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<ProductListItem>[] = [
    {
      key: 'productCode',
      header: 'Kod',
      width: 130,
      sortable: true,
      accessor: (p) => p.productCode,
      render: (p) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/products/${p.id}`)}>
          <strong>{p.productCode}</strong>
        </button>
      ),
    },
    { key: 'name', header: 'Ad', sortable: true, accessor: (p) => p.name },
    { key: 'customer', header: 'Müşteri', sortable: true, accessor: (p) => p.customerName ?? '', render: (p) => p.customerName ?? <span className="fx-text-muted">—</span> },
    { key: 'productGroup', header: 'Ürün Grubu', accessor: (p) => p.productGroupName ?? '', render: (p) => p.productGroupName ?? <span className="fx-text-muted">—</span> },
    { key: 'packageType', header: 'Ambalaj', width: 90, render: (p) => <FxBadge tone="neutral">{p.packageTypeLabel}</FxBadge> },
    {
      key: 'isActive',
      header: 'Durum',
      width: 90,
      render: (p) => <FxBadge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Aktif' : 'Pasif'}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/products/${p.id}`)}>
            <FxIcon name="chevron-right" size={15} /> Detay
          </FxButton>
          <FxButton variant="subtle" size="sm" onClick={() => void openEdit(p)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(p)}>
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
          <div className="fx-page-head__title">Ürünler</div>
          <FxBadge tone="brand">Yönetim</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Ürün kartları. Grup/tür alanları Tanımlamalar'a, müşteri cari hesaba bağlanır.
        </div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} ürün`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="plus" size={16} /> Yeni Ürün
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        searchPlaceholder="Kod, ad veya barkod ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <ProductFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          toast.success(editing !== null ? 'Ürün güncellendi.' : 'Ürün oluşturuldu.')
          reload()
        }}
        initial={editing}
        lookups={lookups}
      />
    </>
  )
}

/** Liste yanıtından yalnız aktif tanımları al (form dropdown'larında pasifler gizlenir). */
function pickActive(data: Definition[] | undefined): Definition[] {
  return (data ?? []).filter((d) => d.isActive)
}
