import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from '../types/api'
import { apiFetch } from '../config/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    apiFetch<AuthUser>('/auth/me', { skipRedirectOn401: true })
      .then((authUser) => {
        if (cancelled) return
        setUser(authUser)
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (err) {
      // Logging out locally must succeed even if the server call does not —
      // the redirect below is what actually ends the session for the user.
      console.warn('Logout request failed; clearing local session anyway:', err)
    }
    // The session lives in an httpOnly cookie the server clears above; there is
    // no client-side auth state to wipe, and clear() would discard unrelated
    // keys for this origin.
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        logout,
      }}
    >
      {children}
    </AuthContext>
  )
}
