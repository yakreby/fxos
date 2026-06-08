import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxTable, FxBadge, FxButton, FxIcon, useToast, type FxColumn, type FxServerQuery } from '../../fx-ui'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NOTIFICATION_TYPE_LABEL,
  type AppNotification,
  type NotificationType,
} from './notifications-api'

const typeTone: Record<NotificationType, 'info' | 'success' | 'warning' | 'danger'> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger',
}

const fmtTs = (iso: string): string => iso.replace('T', ' ').slice(0, 16)

/** Bildirimler sayfası — kullanıcının kalıcı bildirimleri (server-side liste + yönetim). */
export function NotificationsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<AppNotification[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const queryRef = useRef<FxServerQuery>({ page: 1, pageSize: 10, search: '', sortBy: null, sortDescending: false })

  const fetchPage = useCallback(
    async (query: FxServerQuery) => {
      queryRef.current = query
      setLoading(true)
      const res = await listNotifications({ page: query.page, pageSize: query.pageSize, unreadOnly })
      if (res.succeeded && res.data) {
        setRows(res.data.items)
        setTotal(res.data.totalCount)
      }
      setLoading(false)
    },
    [unreadOnly],
  )

  const reload = () => void fetchPage(queryRef.current)

  const handleOpen = async (n: AppNotification) => {
    if (!n.isRead) {
      await markNotificationRead(n.id)
      reload()
    }
    if (n.link) navigate(n.link)
  }

  const handleMarkRead = async (n: AppNotification) => {
    const res = await markNotificationRead(n.id)
    if (res.succeeded) reload()
    else toast.error(res.message ?? 'İşlem başarısız.')
  }

  const handleDelete = async (n: AppNotification) => {
    const res = await deleteNotification(n.id)
    if (res.succeeded) {
      toast.success('Bildirim silindi.')
      reload()
    } else {
      toast.error(res.message ?? 'Silme başarısız.')
    }
  }

  const handleMarkAll = async () => {
    const res = await markAllNotificationsRead()
    if (res.succeeded) {
      toast.success(res.message ?? 'Tümü okundu işaretlendi.')
      reload()
    } else {
      toast.error(res.message ?? 'İşlem başarısız.')
    }
  }

  const columns: FxColumn<AppNotification>[] = [
    {
      key: 'type',
      header: 'Tür',
      width: 110,
      render: (n) => <FxBadge tone={typeTone[n.type]}>{NOTIFICATION_TYPE_LABEL[n.type]}</FxBadge>,
    },
    {
      key: 'title',
      header: 'Bildirim',
      render: (n) => (
        <div>
          <button
            type="button"
            className="fx-link-btn"
            onClick={() => void handleOpen(n)}
            style={{ fontWeight: n.isRead ? 400 : 700 }}
          >
            {n.title}
          </button>
          <div className="fx-text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{n.message}</div>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Tarih', width: 150, render: (n) => <span className="fx-text-muted">{fmtTs(n.createdAt)}</span> },
    {
      key: 'state',
      header: 'Durum',
      width: 100,
      render: (n) =>
        n.isRead ? <span className="fx-text-muted">Okundu</span> : <FxBadge tone="brand">Yeni</FxBadge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (n) => (
        <span className="fx-demo-row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {!n.isRead && (
            <FxButton variant="subtle" size="sm" onClick={() => void handleMarkRead(n)}>
              <FxIcon name="check" size={15} /> Okundu
            </FxButton>
          )}
          <FxButton variant="danger" size="sm" onClick={() => void handleDelete(n)}>
            <FxIcon name="x" size={15} /> Sil
          </FxButton>
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Bildirimler</div>
          <FxBadge tone="brand">Sistem</FxBadge>
        </div>
        <div className="fx-page-head__sub">Hesabınıza ait kalıcı bildirimler.</div>
      </div>

      <div className="fx-demo-row" style={{ marginBottom: 14, gap: 8, justifyContent: 'space-between' }}>
        <div className="fx-tabs" style={{ marginBottom: 0 }}>
          <button type="button" className={`fx-tab ${!unreadOnly ? 'is-active' : ''}`} onClick={() => setUnreadOnly(false)}>
            Tümü
          </button>
          <button type="button" className={`fx-tab ${unreadOnly ? 'is-active' : ''}`} onClick={() => setUnreadOnly(true)}>
            Okunmamış
          </button>
        </div>
        <FxButton variant="subtle" size="sm" onClick={() => void handleMarkAll()}>
          <FxIcon name="check" size={16} /> Tümünü okundu işaretle
        </FxButton>
      </div>

      <FxTable
        key={unreadOnly ? 'unread' : 'all'}
        columns={columns}
        data={rows}
        rowKey={(n) => n.id}
        searchable={false}
        emptyText={unreadOnly ? 'Okunmamış bildirim yok.' : 'Bildirim yok.'}
        server={{ totalCount: total, loading, onQueryChange: fetchPage }}
      />
    </>
  )
}
