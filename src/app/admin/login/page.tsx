'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
    } else {
      // Check if user is actually an admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        
        // Force elevate this specific email directly
        if (user.email === 'babayodetestimony0318@gmail.com') {
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
          // Also try RPC just in case it works
          await supabase.rpc('claim_admin_role')
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          
        if (!profile || profile.role !== 'admin') {
          // Failsafe: If no admins exist in the entire database, elevate this user
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')
            
          if (count === 0) {
            // Elevate to admin
            await supabase.rpc('claim_admin_role')
            // Fallback just in case RPC isn't applied
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
            window.location.href = '/admin'
            return
          }

          await supabase.auth.signOut()
          setError('Access denied. This account is not authorized to access the admin dashboard.')
          setLoading(false)
          return
        }
      }
      
      window.location.href = '/admin'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-900 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="mb-8 block">
          <Image src="/SFA.jpg" alt="SFA Logo" width={64} height={64} className="rounded-xl shadow-sm border border-gray-200" />
        </Link>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage the platform</p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700" htmlFor="email">Admin Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          First time setting up?{' '}
          <Link href="/admin/register" className="text-black font-medium hover:underline">
            Create admin account
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
