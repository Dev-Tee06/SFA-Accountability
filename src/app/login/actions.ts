'use server'

import { createClient } from '@supabase/supabase-js'

export async function checkProfileExists(email: string) {
  // Use service role to bypass RLS since unauthenticated users can't read profiles
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  )

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .limit(1)

  return data && data.length > 0
}
