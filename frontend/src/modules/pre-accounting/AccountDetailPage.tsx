import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxBadge, FxButton, FxIcon, FxCopyButton, FxTable, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import {
  getAccount,
  listTransactions,
  deleteTransaction,
  fmtMoney,
  balanceLabel,
  type AccountDetail,
  type Transaction,
} from './preaccounting-api'
import { TransactionFormModal } from './TransactionFormModal'
import { AccountFormModal } from './AccountFormModal'

const fmtDate = (iso: string | null): string => (iso ? iso.slice(0, 10) : '—')

function Item({ label, value, copy }: { label: string; value: ReactNode; copy?: string | null }) {
  return (
    <div className="fx-detail-item">
      <div className="fx-detail-item__label">{label}</div>
      <div className={`fx-detail-item__value${copy ? ' fx-detail-item__value--copyable' : ''}`}>
        <span>{value || <span className="fx-text-muted">—</span>}</span>
        {copy ? <FxCopyButton value={copy} title={`${label} kopyala`} /> : null}
      </div>
    </div>
  )
}

/** Cari detay sayfası — bilgi + bakiye + hareketler. Rota: /pre-accounting/:id */
export function AccountDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detail, setDetail] = useState<AccountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [txRows, setTxRows] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txLoading, setTxLoading] = useState(true)
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [txSeq, setTxSeq] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)
  const txQueryRef = useRef<FxServerQuery>({ page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false })

  const today = new Date().toISOString().slice(0, 10)

  const loadDetail = useCallback(async () => {
    const res = await getAccount(id)
    if (res.succeeded && res.data) setDetail(res.data)
    else setNotFound(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail()
  }, [loadDetail])

  const fetchTx = useCallback(
    async (query: FxServerQuery) => {
      txQueryRef.current = query
      setTxLoading(true)
      const res = await listTransactions(id, query.page, query.pageSize)
      if (res.succeeded && res.data) {
        setTxRows(res.data.items)
        setTxTotal(res.data.totalCount)
      }
      setTxLoading(false)
    },
    [id],
  )

  // Hareket değişince hem listeyi hem bakiyeyi tazele.
  const afterTxChange = () => {
    void fetchTx(txQueryRef.current)
    void loadDetail()
  }

  const handleDeleteTx = async (t: Transaction) => {
    if (!window.confirm('Hareket silinsin mi?')) return
    const res = await deleteTransaction(t.id)
    if (res.succeeded) {
      toast.success('Hareket silindi.')
      afterTxChange()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const backButton = (
    <button type="button" className="fx-link-btn" onClick={() => navigate('/pre-accounting')}>
      <FxIcon name="chevron-left" size={16} /> Cari listesi
    </button>
  )

  if (loading) return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Cari bulunamadı</div>
        </div>
      </div>
    )
  }

  const columns: FxColumn<Transaction>[] = [
    { key: 'date', header: 'Tarih', width: 110, render: (t) => fmtDate(t.date) },
    { key: 'type', header: 'Tür', width: 110, render: (t) => <FxBadge tone={t.type === 0 ? 'success' : 'warning'}>{t.typeLabel}</FxBadge> },
    { key: 'direction', header: 'Yön', width: 90, render: (t) => <span className="fx-text-muted">{t.directionLabel}</span> },
    { key: 'amount', header: 'Tutar', align: 'right', render: (t) => fmtMoney(t.amount) },
    { key: 'method', header: 'Yöntem', width: 90, render: (t) => <span className="fx-text-muted">{t.methodLabel}</span> },
    { key: 'description', header: 'Açıklama', render: (t) => t.description ?? <span className="fx-text-muted">—</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <FxButton variant="danger" size="sm" onClick={() => void handleDeleteTx(t)}>
          <FxIcon name="x" size={15} /> Sil
        </FxButton>
      ),
    },
  ]

  const bal = detail.balance

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.name}</div>
          <FxBadge tone="neutral">{detail.typeLabel}</FxBadge>
        </div>
        <div className="fx-page-head__sub">Cari hesap detayı ve hareketleri.</div>
      </div>

      <FxCard
        title="Cari Bilgileri"
        action={
          <FxButton variant="subtle" size="sm" onClick={() => { setEditSeq((s) => s + 1); setEditOpen(true) }}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div className="fx-detail-item__label">Güncel Bakiye</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: bal > 0 ? 'var(--fx-danger)' : bal < 0 ? 'var(--fx-brand)' : undefined }}>
            {fmtMoney(Math.abs(bal))} <span style={{ fontSize: 14, fontWeight: 400 }} className="fx-text-muted">{balanceLabel(bal)}</span>
          </div>
        </div>
        <div className="fx-detail-grid">
          <Item label="Tür" value={detail.typeLabel} />
          <Item label="Vergi No" value={detail.taxNumber} copy={detail.taxNumber} />
          <Item label="Telefon" value={detail.phone} copy={detail.phone} />
          <Item label="E-posta" value={detail.email} copy={detail.email} />
          <Item label="Açılış Bakiyesi" value={fmtMoney(detail.openingBalance)} />
          <Item label="Kayıt Tarihi" value={fmtDate(detail.createdAt)} />
          <Item label="Adres" value={detail.address} copy={detail.address} />
        </div>
        {detail.notes && (
          <div style={{ marginTop: 16 }}>
            <div className="fx-detail-item__label">Not</div>
            <div className="fx-detail-item__value" style={{ whiteSpace: 'pre-wrap' }}>{detail.notes}</div>
          </div>
        )}
      </FxCard>

      <div style={{ marginTop: 20 }}>
        <FxCard
          title="Hareketler"
          action={
            <FxButton variant="primary" size="sm" onClick={() => { setTxSeq((s) => s + 1); setTxModalOpen(true) }}>
              <FxIcon name="plus" size={15} /> Yeni Hareket
            </FxButton>
          }
        >
          <FxTable
            columns={columns}
            data={txRows}
            rowKey={(t) => t.id}
            searchable={false}
            emptyText="Henüz hareket yok."
            server={{ totalCount: txTotal, loading: txLoading, onQueryChange: fetchTx }}
          />
        </FxCard>
      </div>

      <TransactionFormModal
        key={`tx-${txSeq}`}
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSaved={() => { toast.success('Hareket eklendi.'); afterTxChange() }}
        accountId={detail.id}
        today={today}
      />

      <AccountFormModal
        key={`edit-${editSeq}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { toast.success('Cari güncellendi.'); void loadDetail() }}
        initial={detail}
      />
    </>
  )
}
