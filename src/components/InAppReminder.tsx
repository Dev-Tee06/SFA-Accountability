'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BellRing, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function InAppReminder() {
  const [schedule, setSchedule] = useState<any>(null)
  const [activeAlert, setActiveAlert] = useState<{ type: string, title: string, message: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadSchedule() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) setSchedule(data)
    }

    loadSchedule()
  }, [])

  useEffect(() => {
    if (!schedule) return

    const checkTime = () => {
      if (activeAlert) return // Already showing an alert

      const now = new Date()
      // Use local system time for the active web session check
      const localH = now.getHours().toString().padStart(2, '0')
      const localM = now.getMinutes().toString().padStart(2, '0')
      const currentTime = `${localH}:${localM}`

      const prayerTime = schedule.prayer_time?.substring(0, 5)
      const bibleTime = schedule.bible_study_time?.substring(0, 5)

      // Only show once per day per type
      const today = new Date().toDateString()
      
      if (currentTime === prayerTime) {
        const key = `in_app_shown_prayer_${today}`
        if (!localStorage.getItem(key)) {
          setActiveAlert({ type: 'prayer', title: 'Prayer Time', message: 'It is time for your scheduled prayer. Take a moment to pray and stay accountable.' })
          localStorage.setItem(key, 'true')
        }
      } else if (currentTime === bibleTime) {
         const key = `in_app_shown_bible_${today}`
         if (!localStorage.getItem(key)) {
           setActiveAlert({ type: 'bible_study', title: 'Bible Study Time', message: 'Your scheduled Bible study time has arrived. Time to dive into the Word.' })
           localStorage.setItem(key, 'true')
         }
      }
    }

    checkTime() // Check immediately on mount/load
    const interval = setInterval(checkTime, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [schedule, activeAlert])

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div 
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm"
        >
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden border border-gray-100 flex flex-col relative">
            <button 
              onClick={() => setActiveAlert(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors z-10"
            >
              <X size={18} />
            </button>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 flex justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sfa-red via-transparent to-transparent"></div>
              <div className="bg-white p-4 rounded-2xl shadow-lg text-sfa-red relative animate-[bounce_2s_infinite]">
                <BellRing size={40} />
              </div>
            </div>
            
            <div className="p-8 text-center space-y-4">
              <h3 className="font-extrabold text-2xl text-gray-900 tracking-tight">{activeAlert.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{activeAlert.message}</p>
              
              <div className="pt-4">
                <Link 
                  href="/dashboard/records" 
                  onClick={() => setActiveAlert(null)}
                  className="block w-full py-4 bg-black text-white rounded-xl font-bold shadow-md hover:bg-gray-900 hover:shadow-lg transition-all active:scale-95"
                >
                  Log Activity Now
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
