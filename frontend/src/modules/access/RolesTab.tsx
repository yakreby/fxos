import { useCallback, useEffect, useState } from 'react'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn } from '../../fx-ui'
import {
  listRoles,
  getRole,
  deleteRole,
  getPermissionCatalog,
  type RoleListItem,
  type RoleDetail,
  type PermissionGroup,
} from './access-api'
import { RoleFormModal } from './RoleFormModal'

/** Roller sekmesi — liste + oluştur/düzenle (izin matrisi)/sil. */
export function RolesTab() {
  const toast = useToast()
  const [roles, setRoles] = useState<RoleListItem[]>([])
  const [catalog, setCatalog] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RoleDetail | null>(null)
  const [openSeq, setOpenSeq] = useState(0)

  // İlk setState await'ten sonra; loading başlangıçta zaten true (mount-fetch).
  const load = useCallback(async () => {
    const [rolesRes, catalogRes] = await Promise.all([listRoles(), getPermissionCatalog()])
    if (rolesRes.succeeded && rolesRes.data) setRoles(rolesRes.data)
    if (catalogRes.succeeded && catalogRes.data) setCatalog(catalogRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Mount'ta veri çek (setState yalnız await'ten sonra; meşru fetch-on-mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const openEdit = async (role: RoleListItem) => {
    // İzinleri detay ucundan çek, sonra modalı aç.
    const res = await getRole(role.id)
    if (res.succeeded && res.data) {
      setEditing(res.data)
      setOpenSeq((s) => s + 1)
      setModalOpen(true)
    } else {
      toast.error(res.message ?? 'Rol yüklenemedi.')
    }
  }

  const handleDelete = async (role: RoleListItem) => {
    if (!window.confirm(`"${role.name}" rolü silinsin mi?`)) return
    const res = await deleteRole(role.id)
    if (res.succeeded) {
      toast.success('Rol silindi.')
      void load()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<RoleListItem>[] = [
    { key: 'name', header: 'Rol', sortable: true, accessor: (r) => r.name, render: (r) => <strong>{r.name}</strong> },
    { key: 'description', header: 'Açıklama', accessor: (r) => r.description ?? '', render: (r) => r.description ?? <span className="fx-text-muted">—</span> },
    { key: 'permissionCount', header: 'İzin', sortable: true, align: 'center', accessor: (r) => r.permissionCount },
    {
      key: 'isSystem',
      header: 'Tür',
      align: 'center',
      accessor: (r) => (r.isSystem ? 1 : 0),
      render: (r) => (r.isSystem ? <FxBadge tone="info">Çekirdek</FxBadge> : <FxBadge tone="neutral">Özel</FxBadge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => void openEdit(r)}>
            <FxIcon name="shield" size={15} /> İzinler
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => handleDelete(r)} disabled={r.isSystem} title={r.isSystem ? 'Çekirdek roller silinemez' : undefined}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${roles.length} rol`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="shield" size={16} /> Yeni Rol
        </FxButton>
      </div>

      <FxTable columns={columns} data={roles} rowKey={(r) => r.id} pageSize={10} searchPlaceholder="Rol ara…" />

      <RoleFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        role={editing}
        catalog={catalog}
      />
    </div>
  )
}
