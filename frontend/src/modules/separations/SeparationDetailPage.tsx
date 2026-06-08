import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxButton, FxBadge, FxIcon, FxCopyButton, useToast } from '../../fx-ui'
import type { ApiResult } from '../../core/api/client'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listPersonnelLookup, type PersonnelLookup } from '../personnel/personnel-api'
import { listProductsLookup, type ProductLookup } from '../products/products-api'
import { listShelves, type Shelf } from '../stock/stock-api'
import { SeparationFormModal } from './SeparationFormModal'
import {
  getSeparation,
  startSeparation,
  completeSeparation,
  reopenSeparation,
  cancelSeparation,
  fmtKg,
  fmtNum,
  type SeparationDetail,
  type SeparationStatus,
} from './separations-api'

const statusTone: Record<SeparationStatus, 'neutral' | 'warning' | 'success'> = {
  0: 'neutral', 1: 'warning', 2: 'success', 3: 'neutral',
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

/** Separasyon detay sayfası — bilgi kartı + durum akışı (başlat/tamamla/iptal/yeniden aç). Rota: /separation/:id */
export function SeparationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detail, setDetail] = useState<SeparationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [personnel, setPersonnel] = useState<PersonnelLookup[]>([])
  const [wasteTypes, setWasteTypes] = useState<Definition[]>([])
  const [processTypes, setProcessTypes] = useState<Definition[]>([])
  const [wasteGroups, setWasteGroups] = useState<Definition[]>([])
  const [products, setProducts] = useState<ProductLookup[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await getSeparation(id)
    if (res.succeeded && res.data) setDetail(res.data)
    else setNotFound(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    void Promise.all([
      listPersonnelLookup(), listDefinitions(1), listDefinitions(4), listDefinitions(3), listProductsLookup(), listShelves(),
    ]).then(([per, wt, pt, wg, prod, shelf]) => {
      if (per.succeeded && per.data) setPersonnel(per.data)
      if (wt.succeeded && wt.data) setWasteTypes(wt.data)
      if (pt.succeeded && pt.data) setProcessTypes(pt.data)
      if (wg.succeeded && wg.data) setWasteGroups(wg.data)
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
    <button type="button" className="fx-link-btn" onClick={() => navigate('/separation')}>
      <FxIcon name="chevron-left" size={16} /> Separasyon listesi
    </button>
  )

  if (loading) return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Separasyon talebi bulunamadı</div>
          <div className="fx-page-head__sub">Bu kayıt silinmiş veya erişiminiz yok olabilir.</div>
        </div>
      </div>
    )
  }

  const isPending = detail.status === 0
  const isInProgress = detail.status === 1
  const isCompleted = detail.status === 2
  const isCancelled = detail.status === 3
  const isLocked = isCompleted || isCancelled

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.requestNumber}</div>
          <FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          {fmtDate(detail.requestDate)}
          {detail.assignedPersonnelName ? ` · ${detail.assignedPersonnelName}` : ''}
        </div>
      </div>

      <FxCard
        title="Talep Bilgileri"
        action={
          <span className="fx-demo-row" style={{ gap: 6 }}>
            {!isLocked && (
              <FxButton variant="subtle" size="sm" disabled={busy} onClick={() => { setEditSeq((s) => s + 1); setEditOpen(true) }}>
                <FxIcon name="settings" size={15} /> Düzenle
              </FxButton>
            )}
            {isPending && (
              <FxButton variant="primary" size="sm" disabled={busy} onClick={() => void runAction(startSeparation, 'Separasyon başlatıldı.')}>
                <FxIcon name="activity" size={15} /> Başlat
              </FxButton>
            )}
            {isInProgress && (
              <FxButton variant="primary" size="sm" disabled={busy} onClick={() => void runAction(completeSeparation, 'Separasyon tamamlandı.')}>
                <FxIcon name="check" size={15} /> Tamamla
              </FxButton>
            )}
            {isCompleted && (
              <FxButton variant="subtle" size="sm" disabled={busy} onClick={() => void runAction(reopenSeparation, 'Separasyon yeniden açıldı.')}>
                <FxIcon name="chevron-left" size={15} /> Yeniden Aç
              </FxButton>
            )}
            {(isPending || isInProgress) && (
              <FxButton variant="danger" size="sm" disabled={busy} onClick={() => void runAction(cancelSeparation, 'Separasyon talebi iptal edildi.')}>
                <FxIcon name="x" size={15} /> İptal Et
              </FxButton>
            )}
          </span>
        }
      >
        <div className="fx-detail-grid">
          <Item label="Talep No" value={detail.requestNumber} copy={detail.requestNumber} />
          <Item label="Durum" value={<FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>} />
          <Item label="Atanan Personel" value={detail.assignedPersonnelName} />
          <Item label="İşlem Türü" value={detail.processTypeName} />
          <Item label="Atık Tipi" value={detail.wasteTypeName} />
          <Item label="Sonuç Grubu" value={detail.resultGroupName} />
          <Item label="Ürün" value={detail.productName} copy={detail.productCode} />
          <Item label="Kaynak Raf" value={detail.shelfCode} />
          <Item label="İçerik (serbest)" value={detail.content} copy={detail.content} />
          <Item label="Palet Sayısı" value={fmtNum(detail.palletCount)} />
          <Item label="Ağırlık" value={fmtKg(detail.weight)} />
          <Item label="Talep Tarihi" value={fmtDate(detail.requestDate)} />
          <Item label="Tamamlanma" value={fmtDate(detail.completedDate)} />
        </div>
        {detail.notes && (
          <div style={{ marginTop: 16 }}>
            <div className="fx-detail-item__label">Not</div>
            <div className="fx-detail-item__value" style={{ whiteSpace: 'pre-wrap' }}>{detail.notes}</div>
          </div>
        )}
      </FxCard>

      <SeparationFormModal
        key={`edit-${editSeq}`}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { toast.success('Separasyon talebi güncellendi.'); void load() }}
        initial={detail}
        personnel={personnel}
        wasteTypes={wasteTypes}
        processTypes={processTypes}
        wasteGroups={wasteGroups}
        products={products}
        shelves={shelves}
        today={fmtDate(detail.requestDate)}
      />
    </>
  )
}
