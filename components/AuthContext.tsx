'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface Profile {
  id: string
  email: string
  is_pro: boolean
  subscription_source: string
  subscription_status: string
  stripe_customer_id: string | null
}

interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const LOCAL_USER = { id: 'local', email: 'local@xatlas.app' }
const LOCAL_PROFILE: Profile = {
  id: 'local',
  email: 'local@xatlas.app',
  is_pro: true,
  subscription_source: 'local',
  subscription_status: 'active',
  stripe_customer_id: null,
}

const AuthContext = createContext<AuthState>({
  user: LOCAL_USER, profile: LOCAL_PROFILE, loading: false,
  signIn: async () => null, signUp: async () => null,
  signOut: async () => {}, refreshProfile: async () => {},
})

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: LOCAL_USER,
      profile: LOCAL_PROFILE,
      loading: false,
      signIn: async () => null,
      signUp: async () => null,
      signOut: async () => {},
      refreshProfile: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}
