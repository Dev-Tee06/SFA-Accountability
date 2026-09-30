'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function NotificationsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState<any>(null)
  const [pushStatus, setPushStatus] = useState<string>('checking')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch or create preferences
      let { data: pref, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Not found, create default
        const { data: newPref } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single()
        pref = newPref
      }

      setPreferences(pref)
      checkPushStatus()
      setLoading(false)
    }

    loadPreferences()

    // Detect iOS and standalone mode
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(checkIOS)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone)
  }, [])

  const checkPushStatus = () => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      setPushStatus('granted')
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied')
    } else {
      setPushStatus('default')
    }
  }

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission)

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })

        // Send to backend
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            platform: 'web'
          })
        })
        
        await updatePreference('push_enabled', true)
        alert('Push notifications enabled successfully!')
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
      alert('Failed to subscribe to push notifications.')
    }
  }

  const updatePreference = async (key: string, value: boolean) => {
    if (!userId) return
    setSaving(true)
    
    // Optimistic UI update
    setPreferences((prev: any) => ({ ...prev, [key]: value }))

    await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('user_id', userId)
      
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading preferences...</div>

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Notifications & Reminders</h1>
        <p className="text-gray-500 dark:text-white mt-1">Manage your accountability alerts and push notifications.</p>
      </header>

      {/* Push Notification Status Card */}
      <section className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-6 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell size={20} className="text-sfa-red" />
            Push Notifications
          </h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">
            Receive reminders on your device even when SFA is closed.
          </p>
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Status: 
            {pushStatus === 'granted' && <span className="text-green-600 ml-2 flex items-center gap-1 inline-flex"><ShieldCheck size={14} /> Enabled</span>}
            {pushStatus === 'denied' && <span className="text-red-600 ml-2 flex items-center gap-1 inline-flex"><ShieldAlert size={14} /> Blocked by browser</span>}
            {pushStatus === 'default' && <span className="text-gray-600 dark:text-white ml-2">Not requested yet</span>}
            {pushStatus === 'unsupported' && <span className="text-gray-400 dark:text-white ml-2">Unsupported device</span>}
          </div>
        </div>
        
        {isIOS && !isStandalone ? (
          <div className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <strong>iOS User?</strong> To enable push notifications on iPhone or iPad, you must first add SFA to your Home Screen.<br/><br/>
            Tap the <strong>Share</strong> button at the bottom of Safari, scroll down, and select <strong>"Add to Home Screen"</strong>. Then open the SFA app from your home screen to enable notifications.
          </div>
        ) : pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
          <button 
            onClick={handleSubscribe}
            className="px-4 py-2 bg-sfa-red text-white font-medium rounded-lg shadow-sm hover:bg-red-700 transition whitespace-nowrap"
          >
            Enable Notifications
          </button>
        )}
      </section>

      {/* Preferences Toggles */}
      <section className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm divide-y divide-gray-100 dark:divide-white/10 overflow-hidden">
        <div className="p-6 bg-gray-50 dark:bg-black/50 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reminder Preferences</h2>
          <p className="text-sm text-gray-500 dark:text-white mt-1">Choose which alerts you want to receive.</p>
        </div>

        {[
          { key: 'prayer_enabled', label: 'Prayer Reminders', desc: 'Alerts for your scheduled prayer times' },
          { key: 'bible_study_enabled', label: 'Bible Study Reminders', desc: 'Alerts for your scheduled Bible study times' },
          { key: 'accountability_enabled', label: 'Accountability Reminders', desc: 'General reminders to complete your daily activity' },
          { key: 'streak_enabled', label: 'Streak Alerts', desc: 'Warnings when your streak is about to break' },
          { key: 'leaderboard_enabled', label: 'Leaderboard Updates', desc: 'Weekly rankings and updates' },
        ].map((pref) => (
          <div key={pref.key} className="p-6 flex justify-between items-center hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{pref.label}</div>
              <div className="text-sm text-gray-500 dark:text-white mt-1">{pref.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={preferences?.[pref.key] || false}
                onChange={(e) => updatePreference(pref.key, e.target.checked)}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sfa-red dark:peer-checked:bg-sfa-red"></div>
            </label>
          </div>
        ))}
      </section>
    </div>
  )
}
