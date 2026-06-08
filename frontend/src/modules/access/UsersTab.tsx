import { useCallback, useEffect, useRef, useState } from 'react'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import {
  listUsers,
  listRoles,
  deleteUser,
  type AccessUser,
  type RoleListItem,
} from './access-api'
import { UserFormModal } from './UserFormModal'

const DEFAULT_QUERY: FxServerQuery = { page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false }

/** Kullanıcılar sekmesi — liste (server-side) + oluştur/düzenle/sil. */
export function UsersTab() {
  const toast = useToast()
  const [users, setUsers] = useState<AccessUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<RoleListItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AccessUser | null>(null)
  const [openSeq, setOpenSeq] = useState(0)
  const queryRef = useRef<FxServerQuery>(DEFAULT_QUERY)

  // Roller bir kez (form için).
  useEffect(() => {
    void listRoles().then((res) => {
      if (res.succeeded && res.data) setRoles(res.data)
    })
  }, [])

  const fetchPage = useCallback(async (query: FxServerQuery) => {
    queryRef.current = query
    setLoading(true)
    const res = await listUsers({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sortBy: query.sortBy,
      sortDescending: query.sortDescending,
    })
    if (res.succeeded && res.data) {
      setUsers(res.data.items)
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
  const openEdit = (user: AccessUser) => {
    setEditing(user)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (user: AccessUser) => {
    if (!window.confirm(`"${user.email}" kullanıcısı silinsin mi?`)) return
    const res = await deleteUser(user.id)
    if (res.succeeded) {
      toast.success('Kullanıcı silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<AccessUser>[] = [
    { key: 'email', header: 'E-posta', sortable: true, accessor: (u) => u.email, render: (u) => <strong>{u.email}</strong> },
    { key: 'fullName', header: 'Ad Soyad', sortable: true, accessor: (u) => u.fullName ?? '' },
    {
      key: 'roles',
      header: 'Roller',
      render: (u) =>
        u.roles.length ? (
          <span className="fx-demo-row" style={{ gap: 6 }}>
            {u.roles.map((r) => (
              <FxBadge key={r} tone="brand">{r}</FxBadge>
            ))}
          </span>
        ) : (
          <span className="fx-text-muted">—</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Durum',
      sortable: true,
      accessor: (u) => (u.isActive ? 1 : 0),
      render: (u) => <FxBadge tone={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Aktif' : 'Pasif'}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => openEdit(u)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(u)}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${total} kullanıcı`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="users" size={16} /> Yeni Kullanıcı
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={users}
        rowKey={(u) => u.id}
        searchPlaceholder="Kullanıcı ara…"
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />

      <UserFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
        user={editing}
        availableRoles={roles}
      />
    </div>
  )
}
