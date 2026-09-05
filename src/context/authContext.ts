import { createContext, useContext } from 'react'
import type { AuthUser } from '../types/api'

/**
 * Auth context and its hook, kept apart from the provider component.
 *
 * A module exporting both a component and a hook is not a Fast Refresh
 * boundary, so editing either forced a full reload and dropped app state.
 */
export type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
})

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
