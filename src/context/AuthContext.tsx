import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../types/api'
import { apiFetch, AUTH_TOKEN_KEY } from '../config/api'

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
})

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
    } catch {
      
    }
    window.localStorage.clear()
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

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
