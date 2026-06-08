import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FxCard, FxButton, FxBadge, FxIcon, FxCopyButton, type FxIconName } from '../../fx-ui'
import { DocumentSection } from '../documents/DocumentSection'
import { PersonnelFormModal } from './PersonnelFormModal'
import {
  getPersonnel,
  listDepartments,
  listPositions,
  type PersonnelDetail,
  type PersonnelStatus,
  type Lookup,
} from './personnel-api'

const statusTone: Record<PersonnelStatus, 'success' | 'warning' | 'neutral'> = {
  0: 'success',
  1: 'warning',
  2: 'neutral',
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

/** Personel detay sayfası — bilgi kartı + özlük belgeleri. Rota: /personnel/:id */
export function PersonnelDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<PersonnelDetail | null>(null)
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [positions, setPositions] = useState<Lookup[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSeq, setEditSeq] = useState(0)

  const load = useCallback(async () => {
    const [pRes, dRes, posRes] = await Promise.all([getPersonnel(id), listDepartments(), listPositions()])
    if (pRes.succeeded && pRes.data) setDetail(pRes.data)
    else setNotFound(true)
    if (dRes.succeeded && dRes.data) setDepartments(dRes.data)
    if (posRes.succeeded && posRes.data) setPositions(posRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const backButton = (
    <button type="button" className="fx-link-btn" onClick={() => navigate('/personnel')}>
      <FxIcon name="chevron-left" size={16} /> Personel listesi
    </button>
  )

  if (loading) {
    return <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>
  }

  if (notFound || !detail) {
    return (
      <div style={{ padding: 24 }}>
        {backButton}
        <div className="fx-page-head" style={{ marginTop: 16 }}>
          <div className="fx-page-head__title">Personel bulunamadı</div>
          <div className="fx-page-head__sub">Bu kayıt silinmiş veya erişiminiz yok olabilir.</div>
        </div>
      </div>
    )
  }

  const openEdit = () => {
    setEditSeq((s) => s + 1)
    setEditOpen(true)
  }

  const infoIcon = (name: FxIconName) => <FxIcon name={name} size={15} />

  return (
    <>
      <div style={{ marginBottom: 12 }}>{backButton}</div>

      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">{detail.fullName}</div>
          <FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          {detail.positionName ?? 'Kadro atanmamış'}
          {detail.departmentName ? ` · ${detail.departmentName}` : ''}
        </div>
      </div>

      <FxCard
        title="Kişi Bilgileri"
        action={
          <FxButton variant="subtle" size="sm" onClick={openEdit}>
            {infoIcon('settings')} Düzenle
          </FxButton>
        }
      >
        <div className="fx-detail-grid">
          <Item label="Ad Soyad" value={detail.fullName} copy={detail.fullName} />
          <Item label="T.C. Kimlik No" value={detail.nationalId} copy={detail.nationalId} />
          <Item label="Departman" value={detail.departmentName} />
          <Item label="Kadro" value={detail.positionName} />
          <Item label="E-posta" value={detail.email} copy={detail.email} />
          <Item label="Telefon" value={detail.phone} copy={detail.phone} />
          <Item label="İşe Giriş" value={fmtDate(detail.hireDate)} />
          <Item label="Durum" value={<FxBadge tone={statusTone[detail.status]}>{detail.statusLabel}</FxBadge>} />
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
        <FxCard title="Özlük Belgeleri">
          <DocumentSection personnelId={detail.id} />
        </FxCard>
      </div>

      <PersonnelFormModal
        key={editSeq}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        initial={detail}
        departments={departments}
        positions={positions}
      />
    </>
  )
}
