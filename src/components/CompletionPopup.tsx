'use client'

import { useEffect, useState } from 'react'
import { PartyPopper, X, Flame } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'

export default function CompletionPopup({ isPrayerDone, isStudyDone }: { isPrayerDone: boolean, isStudyDone: boolean }) {
  const [show, setShow] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
    
    if (isPrayerDone && isStudyDone) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const shownDate = localStorage.getItem('sfa_streak_popup_date')
      
      if (shownDate !== today) {
        // slight delay to let the page load
        const timer = setTimeout(() => {
          setShow(true)
          localStorage.setItem('sfa_streak_popup_date', today)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [isPrayerDone, isStudyDone])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShow(false)}
          />
          
          <Confetti 
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
          />

          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100 dark:border-white/10 text-center flex flex-col items-center"
          >
            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-5">
              <Flame size={32} />
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Amazing Work! 🎉</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              You've completed your daily tasks. Keep your streak going by participating tomorrow!
            </p>

            <button
              onClick={() => setShow(false)}
              className="w-full bg-sfa-red text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-red-700 hover:shadow-lg transition-all"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
