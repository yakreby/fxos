import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setUnauthorizedHandler } from '../api/client'
import { login as apiLogin, logout as apiLogout, me as apiMe, type ApiUser } from './auth-api'

export interface SessionUser {
  id: string
  name: string
  email: string
  /** Birincil rol (gösterim için); tüm roller <see cref="roles"/>'dadır. */
  role: string
  roles: string[]
  /** Kullanıcının etkin izinleri (sidebar/aksiyon görünürlüğü). */
  permissions: string[]
}

export interface LoginResult {
  ok: boolean
  message?: string
}

interface SessionContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  /** Açılışta oturum geri yükleniyor mu (me çağrısı sürüyor mu)? */
  isLoading: boolean
  /** Kullanıcının verilen izne sahip olup olmadığı (oturum yoksa false). */
  hasPermission: (permission: string) => boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>
  logout: () => Promise<void>
}

/**
 * SessionContext — cookie tabanlı gerçek oturum yönetimi.
 * Açılışta `/api/auth/me` ile oturum geri yüklenir; login/logout API'ye gider.
 * Cookie HttpOnly olduğundan token JS'te tutulmaz; tarayıcı otomatik taşır.
 */
const SessionContext = createContext<SessionContextValue | undefined>(undefined)

function mapUser(u: ApiUser): SessionUser {
  return {
    id: u.id,
    name: u.fullName?.trim() || u.email,
    email: u.email,
    role: u.roles[0] ?? '',
    roles: u.roles,
    permissions: u.permissions ?? [],
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Herhangi bir isteğin 401'inde (oturum doldu) oturumu temizle → router /login'e düşürür.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  // Açılışta mevcut oturumu geri yükle.
  useEffect(() => {
    let cancelled = false
    apiMe()
      .then((res) => {
        if (!cancelled && res.succeeded && res.data) setUser(mapUser(res.data))
      })
      .catch(() => {
        /* ağ hatası: anonim kabul et */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, rememberMe = true): Promise<LoginResult> => {
      try {
        const res = await apiLogin({ email, password, rememberMe })
        if (res.succeeded && res.data) {
          setUser(mapUser(res.data))
          return { ok: true }
        }
        return { ok: false, message: res.message ?? 'Giriş başarısız.' }
      } catch {
        return { ok: false, message: 'Sunucuya ulaşılamadı.' }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* yine de yerel oturumu temizle */
    } finally {
      setUser(null)
    }
  }, [])

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  )

  const value = useMemo<SessionContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, hasPermission, login, logout }),
    [user, isLoading, hasPermission, login, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession, SessionProvider içinde kullanılmalıdır.')
  return ctx
}
