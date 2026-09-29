'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BellRing, Send } from 'lucide-react'

export default function AdminNotificationsPage() {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all') // 'all', 'active'
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' })

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return

    setSending(true)
    setStatus({ type: null, msg: '' })

    try {
      // Fetch all subscriptions for target users
      let query = supabase.from('notification_subscriptions').select('user_id, platform, subscription_data')
      
      // We could filter by target here, for now it sends to all who are subscribed
      const { data: subs, error: subsError } = await query

      if (subsError) throw subsError

      if (!subs || subs.length === 0) {
        setStatus({ type: 'error', msg: 'No users are subscribed to push notifications.' })
        setSending(false)
        return
      }

      let sentCount = 0

      for (const sub of subs) {
        // Send to our backend API to actually dispatch (Wait, we should create a broadcast API endpoint for this to hide VAPID keys)
        // Since VAPID private is on the server, we MUST send this via a secure API endpoint.
        const res = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            target,
            url: '/dashboard'
          })
        })

        if (res.ok) {
           const data = await res.json()
           sentCount = data.sent
        } else {
           throw new Error('Broadcast failed')
        }
        break; // we only need to call the API once, the API handles the loop
      }

      setStatus({ type: 'success', msg: `Broadcast sent successfully! Delivered to ${sentCount} devices.` })
      setTitle('')
      setMessage('')
    } catch (err: any) {
      console.error(err)
      setStatus({ type: 'error', msg: err.message || 'Failed to send broadcast.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Broadcast Notifications</h1>
        <p className="text-gray-500 mt-1">Send push notifications directly to users' devices.</p>
      </header>

      {status.type && (
        <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {status.msg}
        </div>
      )}

      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl">
        <form onSubmit={handleBroadcast} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sfa-red focus:ring-sfa-red sm:text-sm p-2 border bg-white"
            >
              <option value="all">All Subscribed Users</option>
              <option value="active">Active Users Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., SFA Weekly Check-In"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sfa-red focus:ring-sfa-red sm:text-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea 
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Remember to complete your accountability activity today."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-sfa-red focus:ring-sfa-red sm:text-sm p-2 border"
            />
          </div>

          <button 
            type="submit" 
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-sfa-red text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {sending ? <BellRing className="animate-pulse" size={18} /> : <Send size={18} />}
            {sending ? 'Sending Broadcast...' : 'Send Broadcast'}
          </button>
        </form>
      </section>
    </div>
  )
}
