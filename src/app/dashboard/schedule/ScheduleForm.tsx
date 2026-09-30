'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import TimePicker from '@/components/TimePicker'
import { scheduleLocalNotifications } from '@/lib/notifications/local-notifications'

export default function ScheduleForm({ initialSchedule, userId }: { initialSchedule: any, userId: string }) {
  const [prayerTime, setPrayerTime] = useState(initialSchedule?.prayer_time ? initialSchedule.prayer_time.substring(0, 5) : '')
  const [prayerDuration, setPrayerDuration] = useState(initialSchedule?.prayer_duration || 60)
  const [studyTime, setStudyTime] = useState(initialSchedule?.bible_study_time ? initialSchedule.bible_study_time.substring(0, 5) : '')
  const [studyDuration, setStudyDuration] = useState(initialSchedule?.bible_study_duration || 60)
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
        prayer_duration: prayerDuration,
        bible_study_time: `${studyTime}:00`,
        bible_study_duration: studyDuration
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Unable to save your schedule: ${error.message}`)
    } else {
      setMessage('Schedule saved successfully.')
      
      // Attempt to schedule native notifications (only applies if in Capacitor wrapper)
      await scheduleLocalNotifications({
        prayerTime,
        bibleStudyTime,
        prayerEnabled: true,
        bibleStudyEnabled: true
      })
      
      window.dispatchEvent(new CustomEvent('schedule-updated', { 
        detail: { 
          prayer_time: `${prayerTime}:00`, 
          prayer_duration: prayerDuration,
          bible_study_time: `${studyTime}:00`,
          bible_study_duration: studyDuration
        } 
      }))
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Prayer Time</label>
          <div className="flex items-center gap-4">
            <TimePicker
              id="prayerTime"
              value={prayerTime}
              onChange={(value) => setPrayerTime(value)}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">Historical records will not be affected by this change.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2" htmlFor="prayerDuration">Prayer Duration</label>
          <select
            id="prayerDuration"
            value={prayerDuration}
            onChange={(e) => setPrayerDuration(Number(e.target.value))}
            className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white rounded-md p-2 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Bible Study Time</label>
            <div className="flex items-center gap-4">
              <TimePicker
                id="studyTime"
                value={studyTime}
                onChange={(value) => setStudyTime(value)}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">Historical records will not be affected by this change.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2" htmlFor="studyDuration">Bible Study Duration</label>
            <select
              id="studyDuration"
              value={studyDuration}
              onChange={(e) => setStudyDuration(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white rounded-md p-2 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>
        </div>
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
