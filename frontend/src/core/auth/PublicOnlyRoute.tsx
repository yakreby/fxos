import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession } from './SessionContext'
import { AppSplash } from '../../layout/AppSplash'

/**
 * PublicOnlyRoute — yalnız oturumsuz erişilebilen sayfalar (login) için.
 * Zaten oturum açıksa panele (/dashboard) yönlendirir.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession()

  if (isLoading) return <AppSplash />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
