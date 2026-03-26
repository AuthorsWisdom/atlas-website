'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContext {
  user: User | null
  session: Session | null
  isLoading: boolean
  isPro: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  isLoading: true,
  isPro: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single()
    setIsPro(data?.is_pro ?? false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsPro(false)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsPro(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isPro, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
