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

    const handleScheduleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSchedule(customEvent.detail);
    };
    
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    return () => window.removeEventListener('schedule-updated', handleScheduleUpdate);
  }, [supabase])

  useEffect(() => {
    // Request permission for OS-level notifications if not already granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    if (!schedule) return;

    const checkTime = () => {
      if (activeAlert) return // Already showing an alert

      const now = new Date()
      const localH = now.getHours().toString().padStart(2, '0')
      const localM = now.getMinutes().toString().padStart(2, '0')
      const currentTime = `${localH}:${localM}`

      const prayerTime = schedule.prayer_time?.substring(0, 5)
      const bibleTime = schedule.bible_study_time?.substring(0, 5)

      // Include the exact time in the key so testing multiple times works
      const today = new Date().toDateString()
      
      const triggerAlert = (type: string, title: string, message: string, key: string) => {
        setActiveAlert({ type, title, message })
        localStorage.setItem(key, 'true')
        
        // Trigger OS-level notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            requireInteraction: true // Keeps the notification on screen until dismissed
          });
        }
      }

      if (currentTime === prayerTime) {
        const key = `in_app_prayer_${today}_${prayerTime}`
        if (!localStorage.getItem(key)) {
          triggerAlert('prayer', 'Prayer Time', 'It is time for your scheduled prayer. Take a moment to pray and stay accountable.', key)
        }
      } else if (currentTime === bibleTime) {
         const key = `in_app_bible_${today}_${bibleTime}`
         if (!localStorage.getItem(key)) {
           triggerAlert('bible_study', 'Bible Study Time', 'Your scheduled Bible study time has arrived. Time to dive into the Word.', key)
         }
      }
    }

    checkTime() // Check immediately
    const interval = setInterval(checkTime, 5000) // Check every 5 seconds! Low overhead.

    return () => clearInterval(interval)
  }, [schedule, activeAlert])

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let timeoutId: NodeJS.Timeout;

    if (activeAlert) {
      const audioFile = activeAlert.type === 'prayer' 
        ? '/audio/Theophilus_Sunday_-_Oh_Oh_Adullam_CeeNaija.com_.mp3'
        : '/audio/Michael_W_Smith_-_Ancient_Words_CeeNaija.com_.mp3'
      
      audio = new Audio(audioFile)
      audio.loop = true
      
      // Attempt to play audio (browsers may block this without prior user interaction)
      audio.play().catch(e => console.log('Audio autoplay blocked by browser:', e))

      // Force stop after 60 seconds as per PRD
      timeoutId = setTimeout(() => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      }, 60000)
    }

    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [activeAlert])

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
