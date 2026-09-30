import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: schedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: allPrayers } = await supabase
    .from('prayer_records')
    .select('id, date, status')
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  const { data: allStudies } = await supabase
    .from('bible_study_records')
    .select('id, date, status')
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  
  const { count: thisMonthPrayers } = await supabase
    .from('prayer_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .gte('date', startOfMonthStr)

  const { count: thisMonthStudies } = await supabase
    .from('bible_study_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .gte('date', startOfMonthStr)

  const prayerDuration = schedule?.prayer_duration || 60
  const studyDuration = schedule?.bible_study_duration || 60

  const formatHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const monthlyPrayerHours = formatHours(prayerDuration * (thisMonthPrayers || 0))
  const monthlyStudyHours = formatHours(studyDuration * (thisMonthStudies || 0))

  // Streak Logic
  const prayerDates = new Set(allPrayers?.map(r => r.date) || [])
  const studyDates = new Set(allStudies?.map(r => r.date) || [])
  const completedDates = new Set([...prayerDates].filter(d => studyDates.has(d)))

  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
  const todayStr = formatDate(new Date())

  let streakAsOfYesterday = 0
  let checkDate = new Date()
  checkDate.setDate(checkDate.getDate() - 1)
  let consecutiveMisses = 0

  while (true) {
    let ds = formatDate(checkDate)
    if (completedDates.has(ds)) {
      streakAsOfYesterday++
      consecutiveMisses = 0
    } else {
      consecutiveMisses++
      if (consecutiveMisses >= 2) break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }

  let currentStreak = streakAsOfYesterday
  if (completedDates.has(todayStr)) currentStreak++
  
  const joinDate = user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown'

  // Recent Activity
  const recentActivity = [
    ...(allPrayers || []).map(p => ({ ...p, type: 'Prayer' })),
    ...(allStudies || []).map(s => ({ ...s, type: 'Bible Study' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage your account information and preferences.</p>
      </header>

      <ProfileForm 
        initialName={user.user_metadata?.full_name || profile?.full_name || ''} 
        email={user.email || profile?.email || ''}
        userId={user.id}
        avatarUrl={profile?.avatar_url || ''}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Current Streak</h3>
          <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-1">
            <span className="text-orange-500">🔥</span>{currentStreak}
          </div>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Member Since</h3>
          <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{joinDate}</div>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Total Monthly Prayer Hour</h3>
          <div className="text-2xl md:text-3xl font-black text-sfa-red truncate">{monthlyPrayerHours}</div>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Total Monthly Study Hour</h3>
          <div className="text-2xl md:text-3xl font-black text-sfa-red truncate">{monthlyStudyHours}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-black/40">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/10">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">No recent activity found.</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={`${activity.id}-${index}`} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-sfa-red/10 text-sfa-red flex items-center justify-center font-bold">
                    {activity.type === 'Prayer' ? '🙏' : '📖'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{activity.type}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(activity.date), 'MMMM d, yyyy')}</div>
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Completed
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

