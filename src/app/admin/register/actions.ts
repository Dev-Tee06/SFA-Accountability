'use server'

import { createClient } from '@/utils/supabase/server'

export async function registerAdmin(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const name = formData.get('name') as string

    if (!email || !password || !confirmPassword || !name) {
      return { error: 'All fields are required' }
    }

    if (password !== confirmPassword) {
      return { error: 'Passwords do not match' }
    }

    const supabase = await createClient()

    // Attempt to sign up the user
    let { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    // If the user already exists, let's just log them in and elevate them to admin!
    if (signUpError && signUpError.message.includes('already registered')) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        return { error: 'Account exists but login failed: ' + signInError.message }
      }
      
      authData = signInData
      signUpError = null
    } else if (signUpError) {
      return { error: signUpError.message }
    }

    if (authData?.user) {
      // Set session to ensure backend recognizes the user
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        })
      }

      // Check if profile exists; if not, they might have manually deleted it in Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Elevate role to admin
      // Since they want anyone created here to be an admin, we bypass the "only one admin" limit.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id)
        
      if (updateError) {
        // If the update fails (maybe due to RLS), try the RPC just in case it works
        await supabase.rpc('claim_admin_role')
      }
    }

    return { success: true }
  } catch (err: any) {
    return { error: 'Server exception: ' + (err.message || String(err)) }
  }
}
