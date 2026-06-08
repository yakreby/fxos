import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AiBubble } from './AiBubble'
import { findNavItem } from './nav-items'
import { FxScrollTop } from '../fx-ui'

/* Sidebar dışından erişilen özel sayfaların başlıkları. */
const SPECIAL_TITLES: Record<string, string> = {
  settings: 'Ayarlar',
  'fx-debug': 'fx-debug',
}

/**
 * Uygulama kabuğu: Sidebar (sol) · Header (üst) · Content (<Outlet/>).
 * Aktif sayfa ve başlık URL'den (react-router) türetilir; navigasyon `navigate` ile.
 */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Mobil kırılım: sidebar off-canvas davranışına geçer.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 980px)')
    const update = () => {
      setIsMobile(mq.matches)
      if (!mq.matches) setMobileOpen(false) // masaüstüne dönünce drawer'ı kapat
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // /dashboard → 'dashboard'. İlk segment aktif anahtardır (ileride /access/roles/:id için de çalışır).
  const activeKey = location.pathname.split('/').filter(Boolean)[0] ?? 'dashboard'
  const pageTitle = SPECIAL_TITLES[activeKey] ?? findNavItem(activeKey)?.label ?? 'FxOs'

  // Navigasyonda mobil drawer'ı kapat.
  const handleNavigate = (key: string) => {
    navigate(`/${key}`)
    setMobileOpen(false)
  }

  // Header menü tuşu: mobilde drawer aç/kapat, masaüstünde sidebar daralt/genişlet.
  const toggleSidebar = () => (isMobile ? setMobileOpen((v) => !v) : setCollapsed((v) => !v))

  const shellClass = [
    'fx-shell',
    collapsed && !isMobile ? 'is-collapsed' : '',
    mobileOpen ? 'is-mobile-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={shellClass}>
      <Sidebar
        activeKey={activeKey}
        onNavigate={handleNavigate}
        collapsed={collapsed && !isMobile}
        onExpand={() => setCollapsed(false)}
      />
      <Header
        title={pageTitle}
        onToggleSidebar={toggleSidebar}
        onNavigate={handleNavigate}
      />
      <main className="fx-content" ref={contentRef}>
        <Outlet />
        <FxScrollTop targetRef={contentRef} />
        <AiBubble />
      </main>

      {mobileOpen && (
        <button
          type="button"
          className="fx-sidebar-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  )
}
