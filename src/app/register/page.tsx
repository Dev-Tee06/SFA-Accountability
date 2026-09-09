'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [prayerTime, setPrayerTime] = useState('06:00')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      if (data.user) {
        // Update the schedules table with the chosen prayer time. 
        // The trigger creates the schedule right after signup.
        await supabase
          .from('schedules')
          .update({ prayer_time: `${prayerTime}:00` })
          .eq('user_id', data.user.id)
      }
      
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sfa-gray relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="mb-8 block">
          <Image src="/SFA.jpg" alt="SFA Logo" width={64} height={64} className="rounded-2xl shadow-lg" />
        </Link>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 relative z-10"
      >
        <h1 className="text-2xl font-bold text-center mb-6 tracking-tight text-gray-900">Create Account</h1>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-sfa-red p-3 rounded-xl text-sm mb-6 border border-red-100 text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-600" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:bg-white focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-600" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:bg-white focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-600" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:bg-white focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-600" htmlFor="confirmPassword">Confirm</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:bg-white focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-600" htmlFor="prayerTime">Preferred Prayer Time</label>
            <input
              id="prayerTime"
              type="time"
              value={prayerTime}
              onChange={(e) => setPrayerTime(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:bg-white focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sfa-red to-red-600 text-white py-3.5 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-sfa-red font-semibold hover:underline">
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
