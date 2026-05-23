import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../types/api'

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

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setUser(null)
          setIsLoading(false)
          return
        }
        const json = await res.json()
        if (json.success && json.data) {
          setUser(json.data as AuthUser)
        } else {
          setUser(null)
        }
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
