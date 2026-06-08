import { useCallback, useEffect, useState } from 'react'
import type { ApiResult } from '../../core/api/client'
import { FxTable, FxButton, FxBadge, FxIcon, useToast, type FxColumn } from '../../fx-ui'
import type { Lookup, LookupPayload } from './personnel-api'
import { LookupFormModal } from './LookupFormModal'

interface LookupTabProps {
  /** Tekil ad (ör. "Departman", "Kadro"). */
  noun: string
  searchPlaceholder: string
  list: () => Promise<ApiResult<Lookup[]>>
  create: (payload: LookupPayload) => Promise<ApiResult<string>>
  update: (id: string, payload: LookupPayload) => Promise<ApiResult>
  remove: (id: string) => Promise<ApiResult>
}

/** Departman/kadro gibi basit lookup listeleri için ortak sekme (liste + CRUD). */
export function LookupTab({ noun, searchPlaceholder, list, create, update, remove }: LookupTabProps) {
  const toast = useToast()
  const [items, setItems] = useState<Lookup[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lookup | null>(null)
  const [openSeq, setOpenSeq] = useState(0)

  const load = useCallback(async () => {
    const res = await list()
    if (res.succeeded && res.data) setItems(res.data)
    setLoading(false)
  }, [list])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }
  const openEdit = (item: Lookup) => {
    setEditing(item)
    setOpenSeq((s) => s + 1)
    setModalOpen(true)
  }

  const handleDelete = async (item: Lookup) => {
    if (!window.confirm(`"${item.name}" silinsin mi?`)) return
    const res = await remove(item.id)
    if (res.succeeded) {
      toast.success(`${noun} silindi.`)
      void load()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const columns: FxColumn<Lookup>[] = [
    { key: 'name', header: 'Ad', sortable: true, accessor: (x) => x.name, render: (x) => <strong>{x.name}</strong> },
    {
      key: 'description',
      header: 'Açıklama',
      accessor: (x) => x.description ?? '',
      render: (x) => x.description ?? <span className="fx-text-muted">—</span>,
    },
    {
      key: 'personnelCount',
      header: 'Personel',
      align: 'right',
      sortable: true,
      accessor: (x) => x.personnelCount,
      render: (x) => <FxBadge tone={x.personnelCount > 0 ? 'info' : 'neutral'}>{x.personnelCount}</FxBadge>,
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
        <div className="fx-text-muted">{loading ? 'Yükleniyor…' : `${items.length} ${noun.toLocaleLowerCase('tr')}`}</div>
        <FxButton variant="primary" onClick={openNew}>
          <FxIcon name="plus" size={16} /> Yeni {noun}
        </FxButton>
      </div>

      <FxTable columns={columns} data={items} rowKey={(x) => x.id} pageSize={10} searchPlaceholder={searchPlaceholder} />

      <LookupFormModal
        key={openSeq}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          toast.success(editing !== null ? `${noun} güncellendi.` : `${noun} oluşturuldu.`)
          void load()
        }}
        initial={editing}
        noun={noun}
        create={create}
        update={update}
      />
    </div>
  )
}
