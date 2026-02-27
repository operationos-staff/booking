import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing Supabase env variables. Check .env.local')
}

// Singleton — один клиент на всё приложение
export const supabase = createClient(supabaseUrl, supabaseAnon)
