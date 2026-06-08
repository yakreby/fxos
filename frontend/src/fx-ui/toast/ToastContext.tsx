import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FxToastContainer } from './FxToastContainer'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  title?: string
  message: string
}

interface ToastOptions {
  title?: string
  /** ms; 0 => otomatik kapanma yok. */
  duration?: number
}

interface ToastApi {
  success: (message: string, opts?: ToastOptions) => void
  error: (message: string, opts?: ToastOptions) => void
  warning: (message: string, opts?: ToastOptions) => void
  info: (message: string, opts?: ToastOptions) => void
  dismiss: (id: number) => void
}

const DEFAULT_DURATION = 4000

const ToastContext = createContext<ToastApi | undefined>(undefined)

/**
 * FxToast — kendi toast bildirim altyapımız (sıfır dış bağımlılık).
 * Kullanım: const toast = useToast(); toast.success('Kaydedildi')
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (type: ToastType, message: string, opts?: ToastOptions) => {
      counter.current += 1
      const id = counter.current
      const duration = opts?.duration ?? DEFAULT_DURATION
      setToasts((prev) => [...prev, { id, type, message, title: opts?.title }])
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      warning: (m, o) => push('warning', m, o),
      info: (m, o) => push('info', m, o),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <FxToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalıdır.')
  return ctx
}
