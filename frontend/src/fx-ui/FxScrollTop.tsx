import { useEffect, useState, type RefObject } from 'react'
import { FxIcon } from './FxIcon'

interface FxScrollTopProps {
  /** Dinlenecek/scroll edilecek kaydırma kabı. */
  targetRef: RefObject<HTMLElement | null>
  /** Bu px eşiğini geçince buton görünür. */
  threshold?: number
}

/**
 * FxScrollTop — kaydırma kabı belli bir eşiği geçince beliren "başa dön" butonu.
 */
export function FxScrollTop({ targetRef, threshold = 240 }: FxScrollTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const onScroll = () => setVisible(el.scrollTop > threshold)
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [targetRef, threshold])

  if (!visible) return null

  return (
    <button
      type="button"
      className="fx-scrolltop"
      onClick={() => targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Başa dön"
      aria-label="Başa dön"
    >
      <FxIcon name="arrow-up" size={20} />
    </button>
  )
}
