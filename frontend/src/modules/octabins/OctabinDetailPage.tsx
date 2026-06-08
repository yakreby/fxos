import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxButton, FxBadge, FxIcon, FxCopyButton, useToast } from '../../fx-ui'
import type { ApiResult } from '../../core/api/client'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import { listShelves, type Shelf } from '../stock/stock-api'
import { OctabinFormModal } from './OctabinFormModal'
import {
  getOctabin,
  closeOctabin,
  reopenOctabin,
  dispatchOctabin,
  fmtKg,
  fmtPercent,
  type OctabinDetail,
  type OctabinStatus,
} from './octabins-api'

const statusTone: Record<OctabinStatus, 'warning' | 'success' | 'neutral'> = {
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

/** Octabin detay sayfası — bilgi kartı + durum akışı (kapat/sevk/yeniden aç). Rota: /octabin/:id */
export function OctabinDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detail, setDetail] = useState<OctabinDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [wasteTypes, setWasteTypes] = useState<Definition[]>([])
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await getOctabin(id)
    if (res.succeeded && res.data) setDetail(res.data)
    else setNotFound(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    void Promise.all([listDefinitions(1), listProductsLookup(), listShelves()]).then(([wt, prod, shelf]) => {
      if (wt.succeeded && wt.data) setWasteTypes(wt.data)
      if (prod.succeeded && prod.data) setProducts(prod.data)
      if (shelf.succeeded && shelf.data) setShelves(shelf.data)
    })
  }, [])

  const runAction = async (
    action: (id: string) => Promise<ApiResult>,
    okMessage: string,
  ) => {
    if (!detail) return
    setBusy(true)
    const res = await action(detail.id)
    setBusy(false)
    if (res.succeeded) { toast.success(okMessage); void load() }
    else toast.error(res.message ?? 'İşlem başarısız.')
  }

  const backButton = (
    <button type="button" className="fx-link-btn" onClick={() => navigate('/octabin')}>
      <FxIcon name="chevron-left" size={16} /> Octabin listesi
    </button>
  )

  if (loading) return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Octabin bulunamadı</div>
          <div className="fx-page-head__sub">Bu kayıt silinmiş veya erişiminiz yok olabilir.</div>
        </div>
      </div>
    )
  }

  const isOpen = detail.status === 0
  const isFull = detail.status === 1
  const isDispatched = detail.status === 2
  const contentText = detail.wasteTypeName ?? detail.productName ?? detail.content ?? null

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.octabinNumber}</div>
          <FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Açılış {fmtDate(detail.openedDate)}
          {contentText ? ` · ${contentText}` : ''}
        </div>
      </div>

      <FxCard
        title="Octabin Bilgileri"
        action={
          <span className="fx-demo-row" style={{ gap: 6 }}>
            {!isDispatched && (
              <FxButton variant="subtle" size="sm" disabled={busy} onClick={() => { setEditSeq((s) => s + 1); setEditOpen(true) }}>
                <FxIcon name="settings" size={15} /> Düzenle
              </FxButton>
            )}
            {isOpen && (
              <FxButton variant="primary" size="sm" disabled={busy} onClick={() => void runAction(closeOctabin, 'Octabin kapatıldı.')}>
                <FxIcon name="check" size={15} /> Kapat (Dolu)
              </FxButton>
            )}
            {isFull && (
              <FxButton variant="subtle" size="sm" disabled={busy} onClick={() => void runAction(reopenOctabin, 'Octabin yeniden açıldı.')}>
                <FxIcon name="chevron-left" size={15} /> Yeniden Aç
              </FxButton>
            )}
            {isFull && (
              <FxButton variant="primary" size="sm" disabled={busy} onClick={() => void runAction(dispatchOctabin, 'Octabin sevk edildi.')}>
                <FxIcon name="truck" size={15} /> Sevk Et
              </FxButton>
            )}
          </span>
        }
      >
        <div className="fx-detail-grid">
          <Item label="Octabin No" value={detail.octabinNumber} copy={detail.octabinNumber} />
          <Item label="Durum" value={<FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>} />
          <Item label="Atık Tipi" value={detail.wasteTypeName} />
          <Item label="Ürün" value={detail.productName} copy={detail.productCode} />
          <Item label="İçerik (serbest)" value={detail.content} copy={detail.content} />
          <Item label="Raf / Lokasyon" value={detail.shelfCode} />
          <Item label="Kapasite" value={fmtKg(detail.capacity)} />
          <Item label="Net Ağırlık" value={fmtKg(detail.netWeight)} />
          <Item label="Doluluk" value={fmtPercent(detail.fillPercent)} />
          <Item label="Açılış Tarihi" value={fmtDate(detail.openedDate)} />
          <Item label="Kapanış Tarihi" value={fmtDate(detail.closedDate)} />
          <Item label="Sevk Tarihi" value={fmtDate(detail.dispatchedDate)} />
        </div>
        {detail.notes && (
          <div style={{ marginTop: 16 }}>
            <div className="fx-detail-item__label">Not</div>
            <div className="fx-detail-item__value" style={{ whiteSpace: 'pre-wrap' }}>{detail.notes}</div>
          </div>
        )}
      </FxCard>

      <OctabinFormModal
        key={`edit-${editSeq}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { toast.success('Octabin güncellendi.'); void load() }}
        initial={detail}
        wasteTypes={wasteTypes}
        products={products}
        shelves={shelves}
        today={fmtDate(detail.openedDate)}
      />
    </>
  )
}
