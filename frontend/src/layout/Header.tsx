import { FxIcon, FxAvatar, FxPopover, FxButton } from '../fx-ui'
import { useTheme } from '../core/theme/ThemeContext'
import { useSession } from '../core/auth/SessionContext'
import { useToast } from '../fx-ui'
import { NotificationMenu } from './NotificationMenu'

interface HeaderProps {
  title: string
  onToggleSidebar: () => void
  onNavigate: (key: string) => void
}

/**
 * Üst header — sidebar toggle, sayfa başlığı, fx-debug linki, Formex logosu
 * (tema-duyarlı), tema toggle, bildirim menüsü, kullanıcı menüsü.
 */
export function Header({ title, onToggleSidebar, onNavigate }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useSession()
  const toast = useToast()

  // logo.png (beyaz yazı) koyu zemin için; logo-dark.png (siyah yazı) açık zemin için.
  const formexLogo = theme === 'dark' ? '/images/logo.png' : '/images/logo-dark.png'

  const handleLogout = async () => {
    await logout()
    toast.info('Oturum kapatıldı.')
  }

  return (
    <header className="fx-header">
      <div className="fx-header__left">
        <button
          type="button"
          className="fx-icon-btn"
          onClick={onToggleSidebar}
          title="Menüyü daralt/genişlet"
          aria-label="Menüyü daralt/genişlet"
        >
          <FxIcon name="menu" size={18} />
        </button>
        <span className="fx-header__page-title">{title}</span>
      </div>

      <div className="fx-header__right">
        <FxButton variant="subtle" size="sm" className="fx-hide-mobile" onClick={() => onNavigate('fx-debug')} title="fx-ui bileşen kütüphanesi">
          <FxIcon name="code" size={16} /> fx-debug
        </FxButton>

        <img className="fx-header__formex fx-hide-mobile" src={formexLogo} alt="Formex" />

        <button
          type="button"
          className="fx-icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Karanlık moda geç' : 'Aydınlık moda geç'}
          aria-label="Tema değiştir"
        >
          <FxIcon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
        </button>

        <NotificationMenu onSeeAll={() => onNavigate('notifications')} />

        <FxPopover
          align="right"
          width={240}
          trigger={({ toggle }) => (
            <button type="button" className="fx-usermenu" onClick={toggle} aria-label="Kullanıcı menüsü">
              <FxAvatar name={user?.name ?? 'FxOs'} size={32} />
              <div className="fx-usermenu__meta">
                <div className="fx-usermenu__name">{user?.name ?? 'Kullanıcı'}</div>
                <div className="fx-usermenu__role">{user?.role ?? ''}</div>
              </div>
              <FxIcon name="chevron-down" size={16} />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="fx-menu-head">
                <div className="fx-menu-head__name">{user?.name ?? 'Kullanıcı'}</div>
                <div className="fx-menu-head__sub">{user?.email ?? ''}</div>
              </div>
              <div className="fx-menu-sep" />
              <button
                type="button"
                className="fx-menu-item"
                onClick={() => {
                  close()
                  onNavigate('settings')
                }}
              >
                <FxIcon name="settings" size={17} /> Ayarlar
              </button>
              <button
                type="button"
                className="fx-menu-item fx-menu-item--danger"
                onClick={() => {
                  close()
                  handleLogout()
                }}
              >
                <FxIcon name="log-out" size={17} /> Çıkış yap
              </button>
            </>
          )}
        </FxPopover>
      </div>
    </header>
  )
}
