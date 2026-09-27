import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Fetch Admin accounts count & list
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, role')
    .or(`role.eq.admin,email.eq.babayodetestimony0318@gmail.com`)

  const adminAccounts = adminProfiles || []
  // Ensure babayodetestimony0318@gmail.com is included in the admin count
  const uniqueAdminEmails = new Set(adminAccounts.map(a => a.email))
  uniqueAdminEmails.add('babayodetestimony0318@gmail.com')
  const adminCount = uniqueAdminEmails.size

  const today = format(new Date(), 'yyyy-MM-dd')

  const { count: todayPrayers } = await supabase
    .from('prayer_records')
    .select('*', { count: 'exact', head: true })
    .eq('date', today)
    .eq('status', 'Completed')

  const { count: todayStudies } = await supabase
    .from('bible_study_records')
    .select('*', { count: 'exact', head: true })
    .eq('date', today)
    .eq('status', 'Completed')

  const { count: totalPrayers } = await supabase
    .from('prayer_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completed')

  const { count: totalStudies } = await supabase
    .from('bible_study_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completed')

  // Fetch only non-admin members with their schedules
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

  // Strictly filter out admins so babayodetestimony0318@gmail.com and other admins NEVER reflect as members
  const members = (allProfiles || []).filter(
    (m) => m.role !== 'admin' && m.email !== 'babayodetestimony0318@gmail.com'
  )

  const { data: todayPrayerRecords } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('date', today)

  const { data: todayStudyRecords } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('date', today)

  const prayerMap = new Map((todayPrayerRecords || []).map(r => [r.user_id, r]))
  const studyMap = new Map((todayStudyRecords || []).map(r => [r.user_id, r]))

  // Calculate stats based exclusively on real members
  const memberCount = members.length
  const activitiesToday = (todayPrayers || 0) + (todayStudies || 0)
  const totalActivities = (totalPrayers || 0) + (totalStudies || 0)
  
  // Calculate average progress for today (each user has 2 activities)
  const maxPossibleToday = memberCount * 2
  const avgProgress = maxPossibleToday > 0 ? Math.round((activitiesToday / maxPossibleToday) * 100) : 0

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Overview</h1>
          <p className="text-gray-500 mt-1">Platform statistics, administrator status, and today's member activities.</p>
        </div>
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-medium tracking-wide shadow-sm border border-gray-800 whitespace-nowrap self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-gray-100">
            {adminCount} Admin {adminCount === 1 ? 'Account' : 'Accounts'} Active
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Total Members</h3>
          <div className="text-3xl font-extrabold text-gray-900">{memberCount}</div>
          <div className="text-xs text-gray-400 mt-2 font-medium">Regular platform users</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider">Admin Accounts</h3>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm leading-none whitespace-nowrap">
              System
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{adminCount}</div>
          <div className="text-xs text-blue-600 mt-2 font-medium truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span>{adminCount === 1 ? '1 admin available' : `${adminCount} admins available`}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Activities Today</h3>
          <div className="text-3xl font-extrabold text-gray-900">{activitiesToday}</div>
          <div className="text-xs text-green-600 mt-2 font-medium">Across all members</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Total Completed</h3>
          <div className="text-3xl font-extrabold text-gray-900">{totalActivities}</div>
          <div className="text-xs text-green-600 mt-2 font-medium">All time activities</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Avg Daily Progress</h3>
          <div className="text-3xl font-extrabold text-gray-900">{avgProgress}%</div>
          <div className="text-xs text-gray-400 mt-2">Overall completion rate</div>
        </div>
      </div>

      {/* Members & Activities Section */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Members & Today's Activities</h2>
            <p className="text-sm text-gray-500 mt-0.5">Real-time status of members' daily prayer and bible study.</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full w-fit">
            Date: {format(new Date(), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Member</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Prayer Activity</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Bible Study Activity</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Today's Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map(member => {
                const prayer = prayerMap.get(member.id)
                const study = studyMap.get(member.id)
                const prayerTime = Array.isArray(member.schedules) ? member.schedules[0]?.prayer_time?.substring(0, 5) : (member.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
                const studyTime = Array.isArray(member.schedules) ? member.schedules[0]?.bible_study_time?.substring(0, 5) : (member.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

                const isPrayerDone = prayer?.status === 'Completed'
                const isStudyDone = study?.status === 'Completed'
                const completedCount = (isPrayerDone ? 1 : 0) + (isStudyDone ? 1 : 0)

                return (
                  <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{member.full_name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPrayerDone 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPrayerDone ? 'Completed ✓' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {isPrayerDone && prayer?.completed_at 
                            ? `at ${format(new Date(prayer.completed_at), 'h:mm a')}` 
                            : `(Sch: ${prayerTime})`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isStudyDone 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isStudyDone ? 'Completed ✓' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {isStudyDone && study?.completed_at 
                            ? `at ${format(new Date(study.completed_at), 'h:mm a')}` 
                            : `(Sch: ${studyTime})`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              completedCount === 2 ? 'bg-green-500' : completedCount === 1 ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${(completedCount / 2) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {completedCount}/2
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {!members?.length && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
