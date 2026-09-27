import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminMembers() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch all profiles with their schedules
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select(`
      id, 
      full_name, 
      email,
      role,
      created_at,
      schedules (
        prayer_time,
        bible_study_time
      )
    `)
    .order('created_at', { ascending: false })

  // Exclude any admin accounts so they do not appear as members
  const members = (allProfiles || []).filter(
    (m) => m.role !== 'admin' && m.email !== 'babayodetestimony0318@gmail.com'
  )

  // Fetch today's records
  const { data: todayPrayers } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('date', today)

  const { data: todayStudies } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('date', today)

  // Fetch all-time completed counts
  const { data: allCompletedPrayers } = await supabase
    .from('prayer_records')
    .select('user_id')
    .eq('status', 'Completed')

  const { data: allCompletedStudies } = await supabase
    .from('bible_study_records')
    .select('user_id')
    .eq('status', 'Completed')

  // Build maps
  const todayPrayerMap = new Map((todayPrayers || []).map(r => [r.user_id, r]))
  const todayStudyMap = new Map((todayStudies || []).map(r => [r.user_id, r]))

  const allTimeCountMap = new Map<string, number>()
  allCompletedPrayers?.forEach(r => {
    allTimeCountMap.set(r.user_id, (allTimeCountMap.get(r.user_id) || 0) + 1)
  })
  allCompletedStudies?.forEach(r => {
    allTimeCountMap.set(r.user_id, (allTimeCountMap.get(r.user_id) || 0) + 1)
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">Detailed list of member schedules, completed activities, and pending tasks.</p>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-700">
            Total Members: {members?.length || 0}
          </div>
          <div className="text-xs text-gray-500">
            Current Date: <span className="font-semibold text-gray-700">{format(new Date(), 'MMMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Member Details</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Scheduled Times</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Completed Activities</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Yet to be Completed</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map(member => {
                const prayerTime = Array.isArray(member.schedules) ? member.schedules[0]?.prayer_time?.substring(0, 5) : (member.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
                const studyTime = Array.isArray(member.schedules) ? member.schedules[0]?.bible_study_time?.substring(0, 5) : (member.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

                const todayPrayer = todayPrayerMap.get(member.id)
                const todayStudy = todayStudyMap.get(member.id)

                const isPrayerDone = todayPrayer?.status === 'Completed'
                const isStudyDone = todayStudy?.status === 'Completed'
                const totalAllTime = allTimeCountMap.get(member.id) || 0

                const completedToday: string[] = []
                if (isPrayerDone) completedToday.push(`Morning Prayer (${format(new Date(todayPrayer.completed_at || Date.now()), 'h:mm a')})`)
                if (isStudyDone) completedToday.push(`Bible Study (${format(new Date(todayStudy.completed_at || Date.now()), 'h:mm a')})`)

                const pendingToday: string[] = []
                if (!isPrayerDone) pendingToday.push(`Morning Prayer (Sch: ${prayerTime})`)
                if (!isStudyDone) pendingToday.push(`Bible Study (Sch: ${studyTime})`)

                return (
                  <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{member.full_name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Joined: {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <div><span className="text-xs text-gray-400 font-medium">Prayer:</span> {prayerTime}</div>
                      <div className="mt-1"><span className="text-xs text-gray-400 font-medium">Bible Study:</span> {studyTime}</div>
                    </td>
                    <td className="p-4">
                      {completedToday.length > 0 ? (
                        <div className="space-y-1.5">
                          {completedToday.map((act, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200 mr-1.5 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              {act}
                            </div>
                          ))}
                          <div className="text-xs text-gray-400 font-medium mt-1">
                            Total all-time completed: <span className="text-gray-700 font-semibold">{totalAllTime}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-400 bg-gray-100">
                            No activities completed today
                          </span>
                          <div className="text-xs text-gray-400 font-medium mt-1">
                            Total all-time completed: <span className="text-gray-700 font-semibold">{totalAllTime}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {pendingToday.length > 0 ? (
                        <div className="space-y-1.5">
                          {pendingToday.map((act, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mr-1.5 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {act}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          All completed today 🎉
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                )
              })}
              
              {!members?.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
