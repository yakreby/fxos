import { useCallback, useEffect, useRef, useState } from 'react'
import { FxIcon } from './FxIcon'

interface FxCopyButtonProps {
  /** Panoya kopyalanacak metin. */
  value: string
  /** Buton ipucu / erişilebilirlik etiketi. */
  title?: string
  /** İkon boyutu (px). */
  size?: number
  className?: string
  /** Başarılı kopyalamadan sonra (ör. toast göstermek için). */
  onCopied?: (value: string) => void
}

/**
 * FxCopyButton — bir değeri panoya kopyalayan küçük ikon buton.
 * Kopyalama sonrası kısa süre ✓ onayı gösterir; detay view'larında alan değerlerinin
 * yanında kullanılır. Clipboard API yoksa textarea fallback'i devreye girer.
 */
export function FxCopyButton({
  value,
  title = 'Kopyala',
  size = 14,
  className = '',
  onCopied,
}: FxCopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        // Eski tarayıcı / güvensiz bağlam fallback'i
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      onCopied?.(value)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1200)
    } catch {
      /* kopyalama başarısız — sessizce yut */
    }
  }, [value, onCopied])

  const classes = ['fx-copy-btn', copied ? 'fx-copy-btn--copied' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      title={copied ? 'Kopyalandı' : title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation()
        void copy()
      }}
    >
      <FxIcon name={copied ? 'check' : 'copy'} size={size} />
    </button>
  )
}
