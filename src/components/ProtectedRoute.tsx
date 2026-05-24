import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-brand">
        <img src="/favicon.svg" alt="Loading..." width={48} height={48} />
      </div>
      <p className="loading-text">Authenticating...</p>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
