'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase-browser'

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

const AuthContext = createContext<AuthState>({
  user: null, profile: null, loading: true,
  signIn: async () => null, signUp: async () => null,
  signOut: async () => {}, refreshProfile: async () => {},
})

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data } = await getSupabase()
        .from('profiles')
        .select('id, is_pro, subscription_source, subscription_status, stripe_customer_id')
        .eq('id', userId)
        .maybeSingle()
      if (data) {
        setProfile({ ...data, email } as Profile)
      } else {
        setProfile({
          id: userId, email, is_pro: false,
          subscription_source: 'none', subscription_status: 'inactive',
          stripe_customer_id: null,
        })
      }
    } catch {
      setProfile({
        id: userId, email, is_pro: false,
        subscription_source: 'none', subscription_status: 'inactive',
        stripe_customer_id: null,
      })
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        fetchProfile(session.user.id, session.user.email || '')
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        fetchProfile(session.user.id, session.user.email || '')
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await getSupabase().auth.signUp({ email, password })
    return error ? error.message : null
  }

  const signOut = async () => {
    await getSupabase().auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
