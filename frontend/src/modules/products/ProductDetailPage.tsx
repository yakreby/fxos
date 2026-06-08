import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxButton, FxBadge, FxIcon, FxCopyButton } from '../../fx-ui'
import { listDefinitions, type Definition } from '../definitions/definitions-api'
import { listAccountsLookup, type AccountLookup } from '../pre-accounting/preaccounting-api'
import { ProductFormModal, type ProductFormLookups } from './ProductFormModal'
import { getProduct, type ProductDetail } from './products-api'

const fmtDate = (iso: string | null): string => (iso ? iso.slice(0, 10) : '—')
const fmtWeight = (g: number | null): ReactNode =>
  g != null ? `${g.toLocaleString('tr-TR')} g` : ''
const fmtCount = (n: number | null): ReactNode => (n != null ? n.toLocaleString('tr-TR') : '')

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

const EMPTY_LOOKUPS: ProductFormLookups = {
  customers: [], productGroups: [], returnGroups: [], wasteGroups: [], processTypes: [],
}

/** Ürün detay sayfası — bilgi kartı (kopyalanabilir alanlar). Rota: /products/:id */
export function ProductDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [lookups, setLookups] = useState<ProductFormLookups>(EMPTY_LOOKUPS)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await getProduct(id)
    if (res.succeeded && res.data) setDetail(res.data)
    else setNotFound(true)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Düzenleme modalı için lookup'lar (sadece bir kez).
  useEffect(() => {
    void Promise.all([
      listAccountsLookup(),
      listDefinitions(5),
      listDefinitions(2),
      listDefinitions(3),
      listDefinitions(4),
    ]).then(([cust, pg, rg, wg, pt]) => {
      const active = (d: Definition[] | undefined) => (d ?? []).filter((x) => x.isActive)
      setLookups({
        customers: (cust.succeeded && cust.data ? cust.data : []) as AccountLookup[],
        productGroups: active(pg.data),
        returnGroups: active(rg.data),
        wasteGroups: active(wg.data),
        processTypes: active(pt.data),
      })
    })
  }, [])

  const backButton = (
    <button type="button" className="fx-link-btn" onClick={() => navigate('/products')}>
      <FxIcon name="chevron-left" size={16} /> Ürün listesi
    </button>
  )

  if (loading) return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Ürün bulunamadı</div>
          <div className="fx-page-head__sub">Bu kayıt silinmiş veya erişiminiz yok olabilir.</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.name}</div>
          <FxBadge tone={detail.isActive ? 'success' : 'neutral'}>{detail.isActive ? 'Aktif' : 'Pasif'}</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          {detail.productCode}
          {detail.customerName ? ` · ${detail.customerName}` : ''}
        </div>
      </div>

      <FxCard
        title="Ürün Bilgileri"
        action={
          <FxButton variant="subtle" size="sm" onClick={() => { setEditSeq((s) => s + 1); setEditOpen(true) }}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
        }
      >
        <div className="fx-detail-grid">
          <Item label="Ürün Kodu" value={detail.productCode} copy={detail.productCode} />
          <Item label="Barkod" value={detail.barcode} copy={detail.barcode} />
          <Item label="Ad" value={detail.name} copy={detail.name} />
          <Item label="Müşteri" value={detail.customerName} />
          <Item label="Ambalaj Türü" value={detail.packageTypeLabel} />
          <Item label="Net Gramaj" value={fmtWeight(detail.netWeight)} />
          <Item label="Brüt Gramaj" value={fmtWeight(detail.grossWeight)} />
          <Item label="Paket İçi Adet" value={fmtCount(detail.unitsPerPackage)} />
          <Item label="Koli İçi Adet" value={fmtCount(detail.unitsPerCase)} />
          <Item label="Ürün Grubu" value={detail.productGroupName} />
          <Item label="İade Grubu" value={detail.returnGroupName} />
          <Item label="Atık Grubu" value={detail.wasteGroupName} />
          <Item label="İşlem Türü" value={detail.processTypeName} />
          <Item label="Kayıt Tarihi" value={fmtDate(detail.createdAt)} />
        </div>
      </FxCard>

      <ProductFormModal
        key={editSeq}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        initial={detail}
        lookups={lookups}
      />
    </>
  )
}
