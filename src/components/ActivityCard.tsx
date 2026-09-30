'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { bibleBooks } from '@/lib/bibleData'

type ActivityCardProps = {
  type: 'prayer' | 'study'
  title: string
  time: string
  duration?: number
  record: any
  userId: string
}

export default function ActivityCard({ type, title, time, duration = 60, record, userId }: ActivityCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState(record?.instructions || '')
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapterNum, setSelectedChapterNum] = useState('1')
  const [selectedVerse, setSelectedVerse] = useState('1')
  
  const router = useRouter()
  const supabase = createClient()
  
  const status = record?.status || 'Pending'
  
  const formattedTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  }) : 'Not set'

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`
    const hrs = mins / 60
    return `${hrs} hour${hrs > 1 ? 's' : ''}`
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    const today = format(new Date(), 'yyyy-MM-dd')
    const table = type === 'prayer' ? 'prayer_records' : 'bible_study_records'
    
    try {
      const payload: any = {
        user_id: userId,
        date: today,
        scheduled_time: time,
        status: 'Completed',
        instructions: instructions,
        completed_at: new Date().toISOString()
      }

      if (type === 'study') {
        payload.chapter = `${selectedBook} ${selectedChapterNum}`
        payload.verses = `1-${selectedVerse}`
      }

      const { error: upsertError } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'user_id, date' })

      if (upsertError) throw upsertError
      
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to complete activity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col gap-4 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-4 rounded-full flex-shrink-0 ${
            status === 'Completed' ? 'bg-green-100 text-green-600' :
            status === 'Missed' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {status === 'Completed' ? <CheckCircle2 size={24} /> :
             status === 'Missed' ? <XCircle size={24} /> :
             <Clock size={24} />}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              <span>Scheduled for {formattedTime} ({formatDuration(duration)})</span>
              <span className="hidden lg:inline text-gray-300">&bull;</span>
              <span className={`font-semibold ${
                status === 'Completed' ? 'text-green-600' :
                status === 'Missed' ? 'text-red-600' :
                'text-orange-500'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto flex-shrink-0">
          {status === 'Pending' && (
            <button
              onClick={handleComplete}
              disabled={loading || !time}
              className="w-full lg:w-auto bg-gray-900 text-white px-5 py-2.5 text-sm rounded-xl font-medium hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Mark Complete'}
            </button>
          )}
          {error && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded-md border border-red-100 w-full lg:max-w-[220px] text-center lg:text-right">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Side Note / Instructions Section */}
      {status === 'Pending' && (
        <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-3">
          {type === 'study' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book</label>
                <select
                  value={selectedBook}
                  onChange={(e) => {
                    setSelectedBook(e.target.value)
                    setSelectedChapterNum('1')
                    setSelectedVerse('1')
                  }}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-gray-900 dark:text-white rounded-xl p-2.5 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm"
                >
                  {bibleBooks.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter</label>
                <select
                  value={selectedChapterNum}
                  onChange={(e) => {
                    setSelectedChapterNum(e.target.value)
                    setSelectedVerse('1')
                  }}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-gray-900 dark:text-white rounded-xl p-2.5 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm"
                >
                  {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters || 1 }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verses (1 to ...)</label>
                <select
                  value={selectedVerse}
                  onChange={(e) => setSelectedVerse(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-gray-900 dark:text-white rounded-xl p-2.5 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm"
                >
                  {Array.from(
                    { length: bibleBooks.find(b => b.name === selectedBook)?.versesPerChapter?.[parseInt(selectedChapterNum) - 1] || 1 },
                    (_, i) => i + 1
                  ).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <MessageSquare size={16} /> Did you receive any instructions today? (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Write down any notes or instructions received..."
              className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-sm min-h-[80px] resize-y placeholder:text-gray-400"
            />
          </div>
        </div>
      )}
      
      {status === 'Completed' && (
        <div className="mt-2 space-y-2">
          {type === 'study' && (record?.chapter || record?.verses) && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800 flex gap-2">
              <strong>Read:</strong> {record.chapter} {record.verses ? `:${record.verses}` : ''}
            </div>
          )}
          {record?.instructions && (
            <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/10">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <MessageSquare size={16} /> Instructions Received
              </div>
              <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">{record.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

