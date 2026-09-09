'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type ActivityCardProps = {
  type: 'prayer' | 'study'
  title: string
  time: string
  record: any
  userId: string
}

export default function ActivityCard({ type, title, time, record, userId }: ActivityCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  
  const status = record?.status || 'Pending'
  
  const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  })

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    const today = format(new Date(), 'yyyy-MM-dd')
    const table = type === 'prayer' ? 'prayer_records' : 'bible_study_records'
    
    try {
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({
          user_id: userId,
          date: today,
          scheduled_time: time,
          status: 'Completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, date' })

      if (upsertError) throw upsertError
      
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to complete activity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative">
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
          <h3 className="font-bold text-lg text-gray-900 truncate">{title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
            <span className="whitespace-nowrap">Scheduled for {formattedTime}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className={`font-semibold whitespace-nowrap ${
              status === 'Completed' ? 'text-green-600' :
              status === 'Missed' ? 'text-red-600' :
              'text-orange-500'
            }`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto flex-shrink-0">
        {status === 'Pending' && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-900 text-white px-5 py-2.5 text-sm rounded-xl font-medium hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
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
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded-md border border-red-100 w-full sm:max-w-[220px] text-center sm:text-right">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
