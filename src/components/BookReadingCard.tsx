'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type BookReadingCardProps = {
  userId: string
  completedSessions: number
  targetSessions?: number
  hasReadToday?: boolean
}

export default function BookReadingCard({ userId, completedSessions: initialCompletedSessions, targetSessions = 2, hasReadToday: initialHasReadToday = false }: BookReadingCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookName, setBookName] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [completedSessions, setCompletedSessions] = useState(initialCompletedSessions)
  const [hasReadToday, setHasReadToday] = useState(initialHasReadToday)
  
  const router = useRouter()
  const supabase = createClient()
  
  const isPassed = completedSessions >= targetSessions

  const handleSave = async () => {
    if (!bookName || !authorName) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error: insertError } = await supabase
        .from('book_reading_records')
        .insert({
          user_id: userId,
          book_name: bookName,
          author_name: authorName
        })

      if (insertError) throw insertError
      
      setBookName('')
      setAuthorName('')
      setCompletedSessions(prev => prev + 1)
      setHasReadToday(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save book reading session.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-4 rounded-full flex-shrink-0 ${
            isPassed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {isPassed ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-gray-900 truncate">Weekly Book Reading</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 mt-1 leading-snug">
              <span>Goal: {targetSessions} times a week</span>
              <span className="hidden lg:inline text-gray-300">&bull;</span>
              <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-blue-600'}`}>
                {completedSessions} / {targetSessions} Completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch lg:items-end w-full lg:w-auto flex-shrink-0">
          <div className="text-2xl font-black tracking-tighter text-gray-900">
            {isPassed ? 'Passed!' : hasReadToday ? 'Completed' : 'Pending'}
          </div>
        </div>
      </div>
      
      {hasReadToday ? (
        <div className="pt-4 border-t border-gray-100 mt-2">
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
            <CheckCircle2 size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">You've logged a reading session today. Great job! Check back tomorrow.</p>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-100 space-y-3 mt-2">
          <p className="text-sm font-medium text-gray-700">Log a new reading session</p>
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="Book Name"
                className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm"
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author"
                className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm"
                required
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading || !bookName || !authorName}
              className="sm:w-auto w-full bg-blue-600 text-white px-5 py-2.5 text-sm rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              {loading ? 'Saving...' : 'Log Session'}
            </button>
          </div>
          {error && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded-md border border-red-100 w-full text-center">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
