import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function RecordsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all records (not just last 14 days, user requested complete history)
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const allRecords = [
    ...(prayerRecords || []).map(r => ({ ...r, activityName: 'Morning Prayer', activityType: 'Prayer' })),
    ...(studyRecords || []).map(r => ({ ...r, activityName: 'Daily Bible Study', activityType: 'Bible Study' }))
  ]

  // Sort by date descending
  allRecords.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA === dateB) {
      return a.activityType.localeCompare(b.activityType)
    }
    return dateB - dateA
  })

  // Calculate current week's score
  const now = new Date()
  const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: leaderboardData } = await supabase.rpc('get_weekly_leaderboard', {
    start_date: start,
    end_date: end
  })

  let myWeeklyPercentage = 0
  let myWeeklyCompleted = 0
  const MAX_WEEKLY_TASKS = 14

  if (leaderboardData) {
    const myData = leaderboardData.find((row: any) => row.user_id === user.id)
    if (myData) {
      myWeeklyCompleted = Number(myData.completed_count)
      myWeeklyPercentage = Math.round((myWeeklyCompleted / MAX_WEEKLY_TASKS) * 100)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
          <p className="text-gray-500 mt-1">Your complete accountability records.</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-[200px]">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Week's Score</div>
            <div className="text-sm font-medium text-gray-900">{myWeeklyCompleted} / {MAX_WEEKLY_TASKS} Tasks</div>
          </div>
          <div className="flex-1 flex justify-end">
            <div className={`text-2xl font-black ${myWeeklyPercentage >= 80 ? 'text-green-500' : myWeeklyPercentage >= 50 ? 'text-yellow-500' : 'text-sfa-red'}`}>
              {myWeeklyPercentage}%
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {allRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No accountability records yet.
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
                {allRecords.map((record, idx) => {
                  const formattedDate = format(new Date(record.date), 'MMM d, yyyy')
                  return (
                    <tr key={`${record.id}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-sm">{formattedDate}</td>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
