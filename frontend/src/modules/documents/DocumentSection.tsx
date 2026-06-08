import { useCallback, useEffect, useState } from 'react'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn } from '../../fx-ui'
import {
  listDocuments,
  deleteDocument,
  documentDownloadUrl,
  type Doc,
} from './documents-api'
import { DocumentFormModal } from './DocumentFormModal'

interface DocumentSectionProps {
  personnelId: string
}

const fmtSize = (b: number): string =>
  b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

const fmtDate = (iso: string | null): string => (iso ? iso.slice(0, 10) : '')

/** Tarayıcıda cookie ile aynı origin'den indirir (yeni sekme açmadan). */
const triggerDownload = (d: Doc) => {
  const a = document.createElement('a')
  a.href = documentDownloadUrl(d.id)
  a.download = d.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Belge bölümü — bir personele bağlı özlük belgelerinin listesi + yükle/düzenle/sil/indir.
 * Gömülebilir (personel detay sayfasında kullanılır); ileride başka entity'lere de bağlanabilir.
 */
export function DocumentSection({ personnelId }: DocumentSectionProps) {
  const toast = useToast()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Doc | null>(null)
  const [openSeq, setOpenSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await listDocuments(personnelId)
    if (res.succeeded && res.data) setDocs(res.data)
    setLoading(false)
  }, [personnelId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }
  const openEdit = (doc: Doc) => {
    setEditing(doc)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (doc: Doc) => {
    if (!window.confirm(`"${doc.title}" belgesi silinsin mi?`)) return
    const res = await deleteDocument(doc.id)
    if (res.succeeded) {
      toast.success('Belge silindi.')
      void load()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const expiryCell = (d: Doc) => {
    if (!d.expiryDate) return <span className="fx-text-muted">—</span>
    if (d.isExpired) return <FxBadge tone="danger">Süresi doldu</FxBadge>
    if (d.daysToExpiry != null && d.daysToExpiry <= 30)
      return <FxBadge tone="warning">{fmtDate(d.expiryDate)} · {d.daysToExpiry}g</FxBadge>
    return <FxBadge tone="neutral">{fmtDate(d.expiryDate)}</FxBadge>
  }

  const columns: FxColumn<Doc>[] = [
    { key: 'title', header: 'Başlık', sortable: true, accessor: (d) => d.title, render: (d) => <strong>{d.title}</strong> },
    { key: 'type', header: 'Tür', sortable: true, accessor: (d) => d.typeLabel },
    { key: 'expiry', header: 'Son Geçerlilik', sortable: true, accessor: (d) => d.expiryDate ?? '', render: expiryCell },
    { key: 'size', header: 'Boyut', align: 'right', accessor: (d) => d.fileSizeBytes, render: (d) => fmtSize(d.fileSizeBytes) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => triggerDownload(d)}>
            <FxIcon name="file-text" size={15} /> İndir
          </FxButton>
          <FxButton variant="subtle" size="sm" onClick={() => openEdit(d)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(d)}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${docs.length} belge`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="plus" size={16} /> Belge Yükle
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={docs}
        rowKey={(d) => d.id}
        pageSize={10}
        loading={loading}
        searchPlaceholder="Belge ara…"
        emptyText="Henüz belge yüklenmemiş."
      />

      <DocumentFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          toast.success(editing !== null ? 'Belge güncellendi.' : 'Belge yüklendi.')
          void load()
        }}
        personnelId={personnelId}
        initial={editing}
      />
    </div>
  )
}
