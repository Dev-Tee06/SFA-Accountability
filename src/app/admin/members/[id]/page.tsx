import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MemberDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { id } = params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    return <div>User not found</div>
  }

  // Fetch all records
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('user_id', id)
    .order('date', { ascending: false })

  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('user_id', id)
    .order('date', { ascending: false })

  const allRecords = [
    ...(prayerRecords || []).map(r => ({ ...r, activityName: 'Morning Prayer', activityType: 'Prayer' })),
    ...(studyRecords || []).map(r => ({ ...r, activityName: 'Daily Bible Study', activityType: 'Bible Study' }))
  ]

  allRecords.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA === dateB) {
      return a.activityType.localeCompare(b.activityType)
    }
    return dateB - dateA
  })

  // Calculate Streak
  const prayerDates = new Set((prayerRecords || []).filter(r => r.status === 'Completed').map(r => r.date))
  const studyDates = new Set((studyRecords || []).filter(r => r.status === 'Completed').map(r => r.date))
  const completedDates = new Set([...prayerDates].filter(d => studyDates.has(d)))

  let currentStreak = 0
  let currentDate = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
  const todayStr = formatDate(currentDate)

  if (completedDates.has(todayStr)) {
    currentStreak++
    currentDate.setDate(currentDate.getDate() - 1)
  } else {
    const yesterday = new Date(currentDate)
    yesterday.setDate(yesterday.getDate() - 1)
    if (completedDates.has(formatDate(yesterday))) {
      currentDate.setDate(currentDate.getDate() - 1)
    }
  }

  while (completedDates.has(formatDate(currentDate))) {
    currentStreak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  // Calculate Longest Streak
  // We can just iterate over all sorted completed dates and find the longest consecutive sequence
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  const sortedCompletedDates = Array.from(completedDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  if (sortedCompletedDates.length > 0) {
    tempStreak = 1
    longestStreak = 1
    lastDate = new Date(sortedCompletedDates[0])
    
    for (let i = 1; i < sortedCompletedDates.length; i++) {
      const prevDate = new Date(sortedCompletedDates[i])
      const diffTime = Math.abs(lastDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
      lastDate = prevDate
    }
  }

  // Today's Progress
  const completedPrayersToday = prayerRecords?.find(r => r.date === todayStr)?.status === 'Completed' ? 1 : 0
  const completedStudiesToday = studyRecords?.find(r => r.date === todayStr)?.status === 'Completed' ? 1 : 0
  const todayProgress = completedPrayersToday + completedStudiesToday

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <Link href="/admin/members" className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center gap-2">
        &larr; Back to Members
      </Link>
      
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
        <p className="text-gray-500 mt-1">{profile.email}</p>
        <p className="text-sm text-gray-400 mt-1">Joined: {format(new Date(profile.created_at), 'MMMM d, yyyy')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Current Streak</h3>
          <div className="text-4xl font-extrabold">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Longest Streak</h3>
          <div className="text-4xl font-extrabold">{longestStreak} {longestStreak === 1 ? 'Day' : 'Days'}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Today's Progress</h3>
          <div className="text-4xl font-extrabold">{todayProgress}/2</div>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold tracking-tight">Activity History</h3>
        </div>
        {allRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No activity records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-medium text-sm text-gray-600">Date</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Activity</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Type</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((record, idx) => (
                  <tr key={`${record.id}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-sm">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                    <td className="p-4 text-sm text-gray-800">{record.activityName}</td>
                    <td className="p-4 text-sm text-gray-500">{record.activityType}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        record.status === 'Missed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
