import { useMemo, useState } from 'react'
import { FxIcon, FxBadge } from '../fx-ui'
import { useSession } from '../core/auth/SessionContext'
import { visibleSections, findParentKey, type NavItem } from './nav-items'

interface SidebarProps {
  activeKey: string
  onNavigate: (key: string) => void
  collapsed: boolean
  onExpand: () => void
}

/**
 * Sol sidebar — FxOs markası + modül navigasyonu (alt menü / dropdown destekli).
 * "Yakında" rozetli öğeler henüz inşa edilmedi (Faz 3+).
 */
export function Sidebar({ activeKey, onNavigate, collapsed, onExpand }: SidebarProps) {
  const { hasPermission } = useSession()
  const sections = useMemo(() => visibleSections(hasPermission), [hasPermission])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const parent = findParentKey(activeKey)
    return parent ? { [parent]: true } : {}
  })

  const toggleGroup = (key: string) => {
    if (collapsed) {
      onExpand()
      setOpenGroups((prev) => ({ ...prev, [key]: true }))
      return
    }
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const openCount = Object.values(openGroups).filter(Boolean).length

  const renderItem = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      const open = !!openGroups[item.key]
      const hasActiveChild = item.children.some((c) => c.key === activeKey)
      return (
        <div key={item.key}>
          <button
            type="button"
            className={`fx-nav-item ${open ? 'is-open' : ''} ${hasActiveChild && !open ? 'is-active' : ''}`}
            onClick={() => toggleGroup(item.key)}
            title={item.label}
            aria-expanded={open}
          >
            <FxIcon name={item.icon} size={18} />
            <span className="fx-nav-item__label">{item.label}</span>
            <FxIcon name="chevron-down" size={15} className="fx-nav-item__chev" />
          </button>
          {open && !collapsed && (
            <div className="fx-subnav">
              {item.children.map((child) => (
                <button
                  key={child.key}
                  type="button"
                  className={`fx-nav-subitem ${activeKey === child.key ? 'is-active' : ''}`}
                  onClick={() => onNavigate(child.key)}
                  title={child.label}
                >
                  <span className="fx-nav-subitem__dot" />
                  <span className="fx-nav-item__label">{child.label}</span>
                  {child.soon && <FxBadge tone="neutral">Yakında</FxBadge>}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        key={item.key}
        type="button"
        className={`fx-nav-item ${activeKey === item.key ? 'is-active' : ''}`}
        onClick={() => onNavigate(item.key)}
        title={item.label}
      >
        <FxIcon name={item.icon} size={18} />
        <span className="fx-nav-item__label">{item.label}</span>
        {item.soon && <FxBadge tone="neutral">Yakında</FxBadge>}
      </button>
    )
  }

  return (
    <aside className="fx-sidebar">
      <div className="fx-sidebar__brand">
        <img className="fx-sidebar__logo" src="/images/fxos-logo.png" alt="FxOs" />
        <span className="fx-sidebar__wordmark">
          <span className="fx-text-brand">Fx</span>Os
        </span>
      </div>

      <nav className="fx-sidebar__nav">
        {!collapsed && openCount > 1 && (
          <button
            type="button"
            className="fx-nav-collapse-all"
            onClick={() => setOpenGroups({})}
            title="Açık menüleri kapat"
          >
            <FxIcon name="chevron-up" size={14} /> Tümünü kapat
          </button>
        )}
        {sections.map((section) => (
          <div key={section.title}>
            <div className="fx-sidebar__section">{section.title}</div>
            {section.items.map(renderItem)}
          </div>
        ))}
      </nav>

      <div className="fx-sidebar__footer">© {new Date().getFullYear()} Formex</div>
    </aside>
  )
}
