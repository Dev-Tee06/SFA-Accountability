'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ScheduleForm({ initialSchedule, userId }: { initialSchedule: any, userId: string }) {
  const [prayerTime, setPrayerTime] = useState(initialSchedule?.prayer_time?.substring(0, 5) || '06:00')
  const [studyTime, setStudyTime] = useState(initialSchedule?.bible_study_time?.substring(0, 5) || '20:00')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('schedules')
      .upsert({
        user_id: userId,
        prayer_time: `${prayerTime}:00`,
        bible_study_time: `${studyTime}:00`
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Unable to save your schedule: ${error.message}`)
    } else {
      setMessage('Schedule saved successfully.')
      router.refresh()
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('error') || message.includes('Unable') ? 'bg-red-50 text-sfa-red' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Prayer Time</label>
        <div className="flex items-center gap-4">
          <input
            type="time"
            value={prayerTime}
            onChange={(e) => setPrayerTime(e.target.value)}
            className="border border-gray-300 rounded-md p-2 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Historical records will not be affected by this change.</p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-medium mb-2">Bible Study Time</label>
        <div className="flex items-center gap-4">
          <input
            type="time"
            value={studyTime}
            onChange={(e) => setStudyTime(e.target.value)}
            className="border border-gray-300 rounded-md p-2 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Historical records will not be affected by this change.</p>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-sfa-red text-white px-8 py-2 rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
