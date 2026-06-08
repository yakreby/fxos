import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import {
  listPersonnel,
  listDepartments,
  listPositions,
  getPersonnel,
  deletePersonnel,
  type Personnel,
  type PersonnelDetail,
  type PersonnelStatus,
  type Lookup,
} from './personnel-api'
import { PersonnelFormModal } from './PersonnelFormModal'

const statusTone: Record<PersonnelStatus, 'success' | 'warning' | 'neutral'> = {
  0: 'success',
  1: 'warning',
  2: 'neutral',
}

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

/** Personel sekmesi — liste (server-side) + oluştur/düzenle/sil. */
export function PersonnelTab() {
  const toast = useToast()
  const navigate = useNavigate()
  const [people, setPeople] = useState<Personnel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [positions, setPositions] = useState<Lookup[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PersonnelDetail | null>(null)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  // Lookup'lar bir kez (dropdown'lar için).
  useEffect(() => {
    void Promise.all([listDepartments(), listPositions()]).then(([dRes, posRes]) => {
      if (dRes.succeeded && dRes.data) setDepartments(dRes.data)
      if (posRes.succeeded && posRes.data) setPositions(posRes.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listPersonnel({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sortBy: query.sortBy,
      sortDescending: query.sortDescending,
    })
    if (res.succeeded && res.data) {
      setPeople(res.data.items)
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

  const openEdit = async (person: Personnel) => {
    const res = await getPersonnel(person.id)
    if (!res.succeeded || !res.data) {
      toast.error(res.message ?? 'Personel detayı alınamadı.')
      return
    }
    setEditing(res.data)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (person: Personnel) => {
    if (!window.confirm(`"${person.fullName}" silinsin mi?`)) return
    const res = await deletePersonnel(person.id)
    if (res.succeeded) {
      toast.success('Personel silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const handleSaved = (isEdit: boolean) => {
    toast.success(isEdit ? 'Personel güncellendi.' : 'Personel oluşturuldu.')
    reload()
  }

  const columns: FxColumn<Personnel>[] = [
    {
      key: 'fullName',
      header: 'Ad Soyad',
      sortable: true,
      accessor: (p) => `${p.lastName} ${p.firstName}`,
      render: (p) => (
        <button type="button" className="fx-link-btn" onClick={() => navigate(`/personnel/${p.id}`)}>
          <strong>{p.fullName}</strong>
        </button>
      ),
    },
    { key: 'department', header: 'Departman', sortable: true, accessor: (p) => p.departmentName ?? '', render: (p) => p.departmentName ?? <span className="fx-text-muted">—</span> },
    { key: 'position', header: 'Kadro', sortable: true, accessor: (p) => p.positionName ?? '', render: (p) => p.positionName ?? <span className="fx-text-muted">—</span> },
    { key: 'phone', header: 'Telefon', accessor: (p) => p.phone ?? '', render: (p) => p.phone ?? <span className="fx-text-muted">—</span> },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      accessor: (p) => p.status,
      render: (p) => <FxBadge tone={statusTone[p.status]}>{p.statusLabel}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => navigate(`/personnel/${p.id}`)}>
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
    <div>
      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} personel`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="users" size={16} /> Yeni Personel
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={people}
        rowKey={(p) => p.id}
        searchPlaceholder="Personel ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <PersonnelFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => handleSaved(editing !== null)}
        initial={editing}
        departments={departments}
        positions={positions}
      />
    </div>
  )
}
