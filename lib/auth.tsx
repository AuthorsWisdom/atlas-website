'use client'

import { createContext, useContext } from 'react'

interface AuthContext {
  user: { id: string; email: string } | null
  session: null
  isLoading: boolean
  isPro: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: { id: 'local', email: 'local@xatlas.app' },
  session: null,
  isLoading: false,
  isPro: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: { id: 'local', email: 'local@xatlas.app' },
      session: null,
      isLoading: false,
      isPro: true,
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}
