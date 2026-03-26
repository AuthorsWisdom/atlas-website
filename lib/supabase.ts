import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
