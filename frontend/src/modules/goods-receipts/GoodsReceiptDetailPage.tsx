import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxButton, FxBadge, FxIcon, FxCopyButton, FxTable, useToast, type FxColumn } from '../../fx-ui'
import { listAccountsLookup, type AccountLookup } from '../pre-accounting/preaccounting-api'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import { listShelves, type Shelf } from '../stock/stock-api'
import { GoodsReceiptFormModal } from './GoodsReceiptFormModal'
import { GoodsReceiptLineFormModal } from './GoodsReceiptLineFormModal'
import {
  getGoodsReceipt,
  deleteGoodsReceiptLine,
  confirmGoodsReceipt,
  cancelGoodsReceipt,
  fmtQty,
  fmtKg,
  type GoodsReceiptDetail,
  type GoodsReceiptLine,
  type GoodsReceiptStatus,
} from './goods-receipts-api'

const statusTone: Record<GoodsReceiptStatus, 'warning' | 'success' | 'neutral'> = {
  0: 'warning', 1: 'success', 2: 'neutral',
}
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

/** Mal kabul detay sayfası — başlık + satırlar. Rota: /goods-receipt/:id */
export function GoodsReceiptDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detail, setDetail] = useState<GoodsReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [suppliers, setSuppliers] = useState<AccountLookup[]>([])
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)
  const [lineOpen, setLineOpen] = useState(false)
  const [lineSeq, setLineSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await getGoodsReceipt(id)
    if (res.succeeded && res.data) setDetail(res.data)
    else setNotFound(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    void Promise.all([listAccountsLookup(), listProductsLookup(), listShelves()]).then(([sup, prod, shelf]) => {
      if (sup.succeeded && sup.data) setSuppliers(sup.data)
      if (prod.succeeded && prod.data) setProducts(prod.data)
      if (shelf.succeeded && shelf.data) setShelves(shelf.data)
    })
  }, [])

  const handleConfirm = async () => {
    if (!detail) return
    if (!window.confirm('Fiş onaylanacak ve satırlar için stok girişi yapılacak. Onaylıyor musunuz?')) return
    setBusy(true)
    const res = await confirmGoodsReceipt(detail.id)
    setBusy(false)
    if (res.succeeded) { toast.success('Onaylandı; stok girişi yapıldı.'); void load() }
    else toast.error(res.message ?? 'Onay başarısız.')
  }

  const handleCancel = async () => {
    if (!detail) return
    if (!window.confirm('Fiş iptal edilecek; onaylanmışsa stok girişi geri alınacak. Devam?')) return
    setBusy(true)
    const res = await cancelGoodsReceipt(detail.id)
    setBusy(false)
    if (res.succeeded) { toast.success('İptal edildi.'); void load() }
    else toast.error(res.message ?? 'İptal başarısız.')
  }

  const handleDeleteLine = async (line: GoodsReceiptLine) => {
    if (!window.confirm(`"${line.productName}" satırı silinsin mi?`)) return
    const res = await deleteGoodsReceiptLine(line.id)
    if (res.succeeded) {
      toast.success('Satır silindi.')
      void load()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const backButton = (
    <button type="button" className="fx-link-btn" onClick={() => navigate('/goods-receipt')}>
      <FxIcon name="chevron-left" size={16} /> Mal kabul listesi
    </button>
  )

  if (loading) return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Mal kabul bulunamadı</div>
          <div className="fx-page-head__sub">Bu kayıt silinmiş veya erişiminiz yok olabilir.</div>
        </div>
      </div>
    )
  }

  const isDraft = detail.status === 0

  const columns: FxColumn<GoodsReceiptLine>[] = [
    { key: 'productCode', header: 'Kod', width: 130, render: (l) => l.productCode },
    { key: 'productName', header: 'Ürün', render: (l) => <strong>{l.productName}</strong> },
    { key: 'shelf', header: 'Raf', width: 120, render: (l) => l.shelfCode ?? <span className="fx-text-muted">—</span> },
    { key: 'quantity', header: 'Miktar', align: 'right', render: (l) => fmtQty(l.quantity) },
    { key: 'weight', header: 'Tartım', align: 'right', render: (l) => fmtKg(l.weight) },
    { key: 'note', header: 'Not', render: (l) => l.note ?? <span className="fx-text-muted">—</span> },
    ...(isDraft
      ? [{
          key: 'actions',
          header: '',
          align: 'right' as const,
          render: (l: GoodsReceiptLine) => (
            <FxButton variant="danger" size="sm" onClick={() => void handleDeleteLine(l)}>
              <FxIcon name="x" size={15} /> Sil
            </FxButton>
          ),
        }]
      : []),
  ]

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.receiptNumber}</div>
          <FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          {fmtDate(detail.receiptDate)}
          {detail.supplierName ? ` · ${detail.supplierName}` : ''}
        </div>
      </div>

      <FxCard
        title="Fiş Bilgileri"
        action={
          <span className="fx-demo-row" style={{ gap: 6 }}>
            {isDraft && (
              <FxButton variant="subtle" size="sm" disabled={busy} onClick={() => { setEditSeq((s) => s + 1); setEditOpen(true) }}>
                <FxIcon name="settings" size={15} /> Düzenle
              </FxButton>
            )}
            {isDraft && (
              <FxButton variant="primary" size="sm" disabled={busy} onClick={() => void handleConfirm()}>
                <FxIcon name="check" size={15} /> Onayla
              </FxButton>
            )}
            {detail.status !== 2 && (
              <FxButton variant="danger" size="sm" disabled={busy} onClick={() => void handleCancel()}>
                <FxIcon name="x" size={15} /> İptal Et
              </FxButton>
            )}
          </span>
        }
      >
        <div className="fx-detail-grid">
          <Item label="Fiş No" value={detail.receiptNumber} copy={detail.receiptNumber} />
          <Item label="Tarih" value={fmtDate(detail.receiptDate)} />
          <Item label="Tedarikçi" value={detail.supplierName} />
          <Item label="Durum" value={<FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>} />
          <Item label="Toplam Miktar" value={fmtQty(detail.totalQuantity)} />
          <Item label="Toplam Tartım" value={fmtKg(detail.totalWeight)} />
          <Item label="Kayıt Tarihi" value={fmtDate(detail.createdAt)} />
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
          title="Satırlar"
          action={
            isDraft ? (
              <FxButton variant="primary" size="sm" onClick={() => { setLineSeq((s) => s + 1); setLineOpen(true) }}>
                <FxIcon name="plus" size={15} /> Satır Ekle
              </FxButton>
            ) : (
              <span className="fx-text-muted" style={{ fontSize: 13 }}>Onaylı/iptal fiş — satırlar kilitli</span>
            )
          }
        >
          <FxTable
            columns={columns}
            data={detail.lines}
            rowKey={(l) => l.id}
            searchable={false}
            emptyText="Henüz satır yok."
          />
        </FxCard>
      </div>

      <GoodsReceiptFormModal
        key={`edit-${editSeq}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { toast.success('Mal kabul güncellendi.'); void load() }}
        initial={detail}
        suppliers={suppliers}
        today={fmtDate(detail.receiptDate)}
      />

      <GoodsReceiptLineFormModal
        key={`line-${lineSeq}`}
        open={lineOpen}
        onClose={() => setLineOpen(false)}
        onSaved={() => { toast.success('Satır eklendi.'); void load() }}
        receiptId={detail.id}
        products={products}
        shelves={shelves}
      />
    </>
  )
}
