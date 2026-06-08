import { Navigate } from 'react-router-dom'
import { useSession } from './SessionContext'
import { AppLayout } from '../../layout/AppLayout'
import { AppSplash } from '../../layout/AppSplash'

/**
 * ProtectedLayout — auth-korumalı rotaların kapısı + uygulama kabuğu.
 * Oturum geri yükleniyorsa splash, oturum yoksa /login'e yönlendirir;
 * aksi halde AppLayout'u (içinde <Outlet/>) render eder.
 */
export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useSession()

  if (isLoading) return <AppSplash />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <AppLayout />
}
