import type { ReactNode } from 'react'

type FxBadgeTone = 'brand' | 'neutral' | 'success' | 'danger' | 'warning' | 'info'

interface FxBadgeProps {
  tone?: FxBadgeTone
  children: ReactNode
}

/**
 * FxBadge — küçük durum/etiket rozeti.
 */
export function FxBadge({ tone = 'neutral', children }: FxBadgeProps) {
  return <span className={`fx-badge fx-badge--${tone}`}>{children}</span>
}
