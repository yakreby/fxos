import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxTable, FxBadge, FxButton, FxIcon, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import {
  listAccounts,
  getAccount,
  deleteAccount,
  fmtMoney,
  balanceLabel,
  type AccountListItem,
  type AccountDetail,
} from './preaccounting-api'
import { AccountFormModal } from './AccountFormModal'

export function PreAccountingPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<AccountListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AccountDetail | null>(null)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>({ page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false })

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listAccounts({
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
  const openEdit = async (a: AccountListItem) => {
    const res = await getAccount(a.id)
    if (!res.succeeded || !res.data) {
      toast.error(res.message ?? 'Cari alınamadı.')
      return
    }
    setEditing(res.data)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }
  const handleDelete = async (a: AccountListItem) => {
    if (!window.confirm(`"${a.name}" carisi silinsin mi?`)) return
    const res = await deleteAccount(a.id)
    if (res.succeeded) {
      toast.success('Cari silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<AccountListItem>[] = [
    {
      key: 'name',
      header: 'Ünvan',
      sortable: true,
      accessor: (a) => a.name,
      render: (a) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/pre-accounting/${a.id}`)}>
          <strong>{a.name}</strong>
        </button>
      ),
    },
    { key: 'type', header: 'Tür', sortable: true, accessor: (a) => a.type, render: (a) => <FxBadge tone="neutral">{a.typeLabel}</FxBadge> },
    { key: 'phone', header: 'Telefon', accessor: (a) => a.phone ?? '', render: (a) => a.phone ?? <span className="fx-text-muted">—</span> },
    {
      key: 'balance',
      header: 'Bakiye',
      align: 'right',
      render: (a) => (
        <span style={{ color: a.balance > 0 ? 'var(--fx-danger)' : a.balance < 0 ? 'var(--fx-brand)' : undefined }}>
          {fmtMoney(Math.abs(a.balance))} <span className="fx-text-muted" style={{ fontSize: 12 }}>{balanceLabel(a.balance)}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/pre-accounting/${a.id}`)}>
            <FxIcon name="chevron-right" size={15} /> Detay
          </FxButton>
          <FxButton variant="subtle" size="sm" onClick={() => void openEdit(a)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(a)}>
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
          <div className="fx-page-head__title">Ön Muhasebe</div>
          <FxBadge tone="brand">Cari</FxBadge>
        </div>
        <div className="fx-page-head__sub">Cari hesaplar, bakiyeler ve tahsilat/ödeme hareketleri.</div>
      </div>

      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} cari`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="plus" size={16} /> Yeni Cari
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={rows}
        rowKey={(a) => a.id}
        searchPlaceholder="Cari ara (ünvan/telefon/vergi no)…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <AccountFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          toast.success(editing !== null ? 'Cari güncellendi.' : 'Cari oluşturuldu.')
          reload()
        }}
        initial={editing}
      />
    </>
  )
}
