import { useCallback, useEffect, useState } from 'react'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn } from '../../fx-ui'
import {
  listDefinitions,
  deleteDefinition,
  type Definition,
  type DefinitionType,
} from './definitions-api'
import { DefinitionFormModal } from './DefinitionFormModal'

interface DefinitionTabProps {
  type: DefinitionType
  typeLabel: string
}

/** Tek bir tanım türünün listesi + CRUD'u. Tür değişince yeniden monte edilir (key). */
export function DefinitionTab({ type, typeLabel }: DefinitionTabProps) {
  const toast = useToast()
  const [items, setItems] = useState<Definition[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Definition | null>(null)
  const [openSeq, setOpenSeq] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listDefinitions(type)
    if (res.succeeded && res.data) setItems(res.data)
    setLoading(false)
  }, [type])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }
  const openEdit = (item: Definition) => {
    setEditing(item)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (item: Definition) => {
    if (!window.confirm(`"${item.name}" silinsin mi?`)) return
    const res = await deleteDefinition(item.id)
    if (res.succeeded) {
      toast.success('Tanım silindi.')
      void load()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<Definition>[] = [
    { key: 'name', header: 'Ad', sortable: true, accessor: (x) => x.name, render: (x) => <strong>{x.name}</strong> },
    {
      key: 'code',
      header: 'Kod',
      width: 140,
      accessor: (x) => x.code ?? '',
      render: (x) => x.code ?? <span className="fx-text-muted">—</span>,
    },
    {
      key: 'sortOrder',
      header: 'Sıra',
      width: 80,
      align: 'right',
      sortable: true,
      accessor: (x) => x.sortOrder,
    },
    {
      key: 'isActive',
      header: 'Durum',
      width: 100,
      sortable: true,
      accessor: (x) => (x.isActive ? 1 : 0),
      render: (x) => <FxBadge tone={x.isActive ? 'success' : 'neutral'}>{x.isActive ? 'Aktif' : 'Pasif'}</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (x) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <FxButton variant="subtle" size="sm" onClick={() => openEdit(x)}>
            <FxIcon name="settings" size={15} /> Düzenle
          </FxButton>
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(x)}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="fx-flex fx-justify-between fx-items-center" style={{ marginBottom: 14 }}>
        <div className="fx-text-muted">
          {loading ? 'Yükleniyor…' : `${items.length} kayıt`}
        </div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="plus" size={16} /> Yeni {typeLabel}
        </FxButton>
      </div>

      <FxTable
        columns={columns}
        data={items}
        rowKey={(x) => x.id}
        pageSize={10}
        loading={loading}
        searchPlaceholder={`${typeLabel} ara…`}
        emptyText="Bu türde henüz tanım yok."
      />

      <DefinitionFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          toast.success(editing !== null ? 'Tanım güncellendi.' : 'Tanım oluşturuldu.')
          void load()
        }}
        initial={editing}
        type={type}
        typeLabel={typeLabel}
      />
    </div>
  )
}
