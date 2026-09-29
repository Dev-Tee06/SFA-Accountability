'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function ProfileForm({
  initialName,
  email,
}: {
  initialName: string
  email: string
}) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ text: '', type: '' })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id)

    setIsSaving(false)

    if (profileError) {
      setMessage({ text: profileError?.message || 'Failed to update profile.', type: 'error' })
    } else {
      setMessage({ text: 'Profile updated successfully.', type: 'success' })
      router.refresh()
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === 'error' ? 'bg-red-50 text-sfa-red' : 'bg-green-50 text-green-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
        <div className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 cursor-not-allowed truncate">
          {email}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-2 focus:ring-red-100 transition-all"
          required
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSaving || (name === initialName)}
          className="bg-gradient-to-r from-sfa-red to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
