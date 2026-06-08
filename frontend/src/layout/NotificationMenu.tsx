import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FxIcon, FxPopover, type FxIconName } from '../fx-ui'
import {
  listNotifications,
  unreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
  type NotificationType,
} from '../modules/notifications/notifications-api'

interface NotificationMenuProps {
  onSeeAll: () => void
}

const typeIcon: Record<NotificationType, FxIconName> = {
  0: 'bell',
  1: 'check',
  2: 'alert-circle',
  3: 'alert-circle',
}

/** "2026-06-06T16:01:07" (UTC, Z'siz) → göreli zaman. */
function relTime(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'az önce'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} sa önce`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days} gün önce`
  return iso.slice(0, 10)
}

/**
 * Header bildirim menüsü — okunmamış sayısı, son bildirimler ve "tümünü okundu".
 * Gerçek API'ye bağlı; açılışta ve aksiyon sonrası yenilenir.
 */
export function NotificationMenu({ onSeeAll }: NotificationMenuProps) {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const [cRes, lRes] = await Promise.all([unreadCount(), listNotifications({ page: 1, pageSize: 8 })])
    if (cRes.succeeded && typeof cRes.data === 'number') setCount(cRes.data)
    if (lRes.succeeded && lRes.data) setItems(lRes.data.items)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const onItemClick = async (item: AppNotification) => {
    if (!item.isRead) {
      await markNotificationRead(item.id)
      void refresh()
    }
    if (item.link) navigate(item.link)
  }

  const markAll = async () => {
    await markAllNotificationsRead()
    void refresh()
  }

  return (
    <FxPopover
      align="right"
      width={340}
      className="fx-notif-popover"
      trigger={({ toggle }) => (
        <button type="button" className="fx-icon-btn" onClick={toggle} title="Bildirimler" aria-label="Bildirimler">
          <FxIcon name="bell" size={18} />
          {count > 0 && <span className="fx-icon-btn__dot" />}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="fx-notif-head">
            <span className="fx-notif-head__title">Bildirimler{count > 0 ? ` (${count})` : ''}</span>
            {count > 0 && (
              <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => void markAll()}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="fx-notif-list">
            {items.length === 0 ? (
              <div className="fx-notif-empty fx-text-muted">Bildirim yok.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`fx-notif ${item.isRead ? '' : 'is-unread'}`}
                  onClick={() => void onItemClick(item)}
                >
                  <div className="fx-notif__icon">
                    <FxIcon name={typeIcon[item.type]} size={18} />
                  </div>
                  <div>
                    <div className="fx-notif__title">{item.title}</div>
                    <div className="fx-notif__text">{item.message}</div>
                    <div className="fx-notif__time">{relTime(item.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="fx-notif-foot">
            <button
              type="button"
              className="fx-btn fx-btn--ghost fx-btn--sm"
              onClick={() => {
                close()
                onSeeAll()
              }}
            >
              Tümünü gör
            </button>
          </div>
        </>
      )}
    </FxPopover>
  )
}
