'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, Trash2 } from 'lucide-react'

export default function ProfileForm({
  initialName,
  email,
  userId,
  avatarUrl
}: {
  initialName: string
  email: string
  userId: string
  avatarUrl: string
}) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ text: '', type: '' })

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', userId)

    setIsSaving(false)

    if (profileError) {
      setMessage({ text: profileError.message || 'Failed to update profile.', type: 'error' })
    } else {
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { full_name: name } }))
      setMessage({ text: 'Profile updated successfully.', type: 'success' })
      router.refresh()
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError
      
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar_url: publicUrl } }))
      router.refresh()
      setMessage({ text: 'Profile picture updated!', type: 'success' })
    } catch (error: any) {
      setMessage({ text: error.message || 'Error uploading image', type: 'error' })
    } finally {
      setUploading(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error
      
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar_url: null } }))
      router.refresh()
    } catch (error: any) {
      setMessage({ text: error.message || 'Error removing image', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 border-b border-gray-100 pb-8">
        <div className="relative w-32 h-32 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <span className="text-4xl text-gray-300 font-bold">{initialName.charAt(0)}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-sfa-red/30 border-t-sfa-red rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        <div className="text-center sm:text-left space-y-3 pt-2">
          <h3 className="font-bold text-gray-900 text-lg">Profile Picture</h3>
          <p className="text-sm text-gray-500">A picture helps your group members recognize you.</p>
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Camera size={16} /> Upload New
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={uploadAvatar} 
              accept="image/*" 
              className="hidden" 
            />
            {avatarUrl && (
              <button 
                onClick={removeAvatar}
                disabled={uploading}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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

        <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Background Notifications</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">Enable push notifications to receive reminders on your lock screen even when the app is closed.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const { subscribeToPushNotifications } = await import('@/lib/notifications/push-client')
              setUploading(true)
              const result = await subscribeToPushNotifications(userId)
              if (result.success) {
                setMessage({ text: 'Background notifications enabled!', type: 'success' })
              } else {
                setMessage({ text: result.error || 'Failed to enable notifications.', type: 'error' })
              }
              setUploading(false)
              setTimeout(() => setMessage({ text: '', type: '' }), 5000)
            }}
            disabled={uploading}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-50"
          >
            {uploading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>

        <div className="pt-6 border-t border-gray-100">
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
    </div>
  )
}
