import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    if (!url || !key) {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    }
    _client = createClient(url, key)
  }
  return _client
}

// Backwards compatibility — components that import { supabase } get the singleton
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
