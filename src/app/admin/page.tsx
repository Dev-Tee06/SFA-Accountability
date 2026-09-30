import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import Image from 'next/image'
import { User, Trophy, Flame, BookOpen, Clock, CheckCircle2, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const startMonthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const endMonthStr = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  // Fetch all profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      created_at,
      avatar_url,
      schedules (
        prayer_time,
        bible_study_time,
        prayer_duration,
        bible_study_duration
      )
    `)
    .order('created_at', { ascending: false })

  const profiles = allProfiles || []
  
  // Admins
  const adminAccounts = profiles.filter(p => p.role === 'admin' || p.email === 'babayodetestimony0318@gmail.com')
  const adminCount = adminAccounts.length

  // Members
  const members = profiles.filter(p => p.role !== 'admin' && p.email !== 'babayodetestimony0318@gmail.com')
  const memberCount = members.length

  // Fetch all completed records for streak & monthly stats
  const [
    { data: allPrayers },
    { data: allStudies },
    { data: todayTasks },
    { data: todayBooks }
  ] = await Promise.all([
    supabase.from('prayer_records').select('user_id, date').eq('status', 'Completed'),
    supabase.from('bible_study_records').select('user_id, date, chapter, verses').eq('status', 'Completed'),
    supabase.from('optional_tasks').select('*').eq('task_date', today),
    supabase.from('book_reading_records').select('*').eq('date', today)
  ])

  // Calculate streaks and monthly hours per member
  const memberStats = members.map(member => {
    const memberPrayers = (allPrayers || []).filter(p => p.user_id === member.id)
    const memberStudies = (allStudies || []).filter(s => s.user_id === member.id)
    
    // Streak Logic
    const prayerDates = new Set(memberPrayers.map(r => r.date))
    const studyDates = new Set(memberStudies.map(r => r.date))
    const completedDates = new Set([...prayerDates].filter(d => studyDates.has(d)))

    const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
    const todayStr = formatDate(new Date())
    
    let streak = 0
    let checkDate = new Date()
    checkDate.setDate(checkDate.getDate() - 1)
    let consecutiveMisses = 0

    while (true) {
      let ds = formatDate(checkDate)
      if (completedDates.has(ds)) {
        streak++
        consecutiveMisses = 0
      } else {
        consecutiveMisses++
        if (consecutiveMisses >= 2) break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    if (completedDates.has(todayStr)) streak++

    // Monthly Logic
    const monthlyPrayers = memberPrayers.filter(p => p.date >= startMonthStr && p.date <= endMonthStr)
    const monthlyStudies = memberStudies.filter(s => s.date >= startMonthStr && s.date <= endMonthStr)
    
    const monthlyCompletedActivities = monthlyPrayers.length + monthlyStudies.length

    const pDuration = Array.isArray(member.schedules) ? member.schedules[0]?.prayer_duration : (member.schedules as any)?.prayer_duration || 60
    const sDuration = Array.isArray(member.schedules) ? member.schedules[0]?.bible_study_duration : (member.schedules as any)?.bible_study_duration || 60

    const monthlyPrayerHours = (monthlyPrayers.length * pDuration) / 60
    const monthlyStudyHours = (monthlyStudies.length * sDuration) / 60

    // Today's specific data
    const todayPrayer = memberPrayers.find(p => p.date === today)
    const todayStudy = memberStudies.find(s => s.date === today)
    const mTasks = (todayTasks || []).filter(t => t.user_id === member.id)
    const mBooks = (todayBooks || []).filter(b => b.user_id === member.id)

    const prayerTime = Array.isArray(member.schedules) ? member.schedules[0]?.prayer_time?.substring(0, 5) : (member.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
    const studyTime = Array.isArray(member.schedules) ? member.schedules[0]?.bible_study_time?.substring(0, 5) : (member.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

    return {
      ...member,
      streak,
      monthlyCompletedActivities,
      monthlyPrayerHours,
      monthlyStudyHours,
      todayPrayer,
      todayStudy,
      mTasks,
      mBooks,
      prayerTime,
      studyTime
    }
  })

  // Sort members for Leaderboard: highest streak first, then highest monthly completed
  const leaderboard = [...memberStats].sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak
    return b.monthlyCompletedActivities - a.monthlyCompletedActivities
  })

  // Calculate top level stats
  const activitiesToday = memberStats.filter(m => m.todayPrayer).length + memberStats.filter(m => m.todayStudy).length
  const totalActivities = (allPrayers?.length || 0) + (allStudies?.length || 0)
  const maxPossibleToday = memberCount * 2
  const avgProgress = maxPossibleToday > 0 ? Math.round((activitiesToday / maxPossibleToday) * 100) : 0

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform statistics, leaderboards, and detailed member insights.</p>
        </div>
      </header>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Members</div>
          <div className="text-3xl font-black text-gray-900">{memberCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Activities Today</div>
          <div className="text-3xl font-black text-gray-900">{activitiesToday}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Completed</div>
          <div className="text-3xl font-black text-gray-900">{totalActivities}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Daily Progress</div>
          <div className="text-3xl font-black text-sfa-red">{avgProgress}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Section */}
        <section className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sfa-red/10 rounded-full blur-[80px] pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Leaderboard
          </h2>
          <div className="space-y-3 relative z-10">
            {leaderboard.slice(0, 5).map((member, index) => (
              <div key={member.id} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-8 font-black text-xl text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                    #{index + 1}
                  </div>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 shrink-0">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.full_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white"><User size={20} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{member.full_name}</h3>
                    <div className="text-xs text-gray-400 mt-0.5">Month: {member.monthlyCompletedActivities} activities</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-orange-400 font-bold">
                    <Flame size={16} /> {member.streak}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-gray-400 text-center py-4">No active members yet.</div>
            )}
          </div>
        </section>

        {/* Admin Accounts Section */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="text-blue-500" /> Admin Accounts
          </h2>
          <div className="space-y-4">
            {adminAccounts.map(admin => (
              <div key={admin.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {admin.avatar_url ? (
                    <Image src={admin.avatar_url} alt={admin.full_name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 truncate">{admin.full_name}</h3>
                  <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Admin</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Members Detailed Grid Section */}
      <section className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Member Analytics</h2>
            <p className="text-sm text-gray-500 mt-0.5">Detailed breakdown of individual member progress.</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full w-fit">
            Date: {format(new Date(), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {memberStats.map(member => {
            const isPrayerDone = !!member.todayPrayer
            const isStudyDone = !!member.todayStudy
            const completedCount = (isPrayerDone ? 1 : 0) + (isStudyDone ? 1 : 0)

            return (
              <div 
                key={member.id} 
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.full_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={28} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate leading-tight">{member.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Flame size={12} /> {member.streak}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                {/* Core Activities */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Prayer</div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {isPrayerDone ? 'Completed Today' : `Scheduled: ${member.prayerTime}`}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isPrayerDone ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {isPrayerDone ? 'Done' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Bible Study</div>
                      <div className="text-[11px] text-gray-500 font-medium truncate">
                        {isStudyDone && member.todayStudy?.chapter ? (
                          <span className="text-blue-600 font-bold">Read: {member.todayStudy.chapter}{member.todayStudy.verses ? `:${member.todayStudy.verses}` : ''}</span>
                        ) : (
                          `Scheduled: ${member.studyTime}`
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isStudyDone ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {isStudyDone ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Optional & Books Section */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="border border-gray-100 rounded-xl p-3 bg-white">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Today's Tasks</div>
                    {member.mTasks.length > 0 ? (
                      <ul className="space-y-1.5">
                        {member.mTasks.map(t => (
                          <li key={t.id} className="text-xs font-medium text-gray-700 flex items-start gap-1">
                            <CheckCircle2 size={12} className="text-sfa-red mt-0.5 shrink-0" />
                            <span className="truncate">{t.title} {t.duration_minutes ? `(${t.duration_minutes}m)` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No tasks today</div>
                    )}
                  </div>
                  <div className="border border-gray-100 rounded-xl p-3 bg-white">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Books Read</div>
                    {member.mBooks.length > 0 ? (
                      <ul className="space-y-1.5">
                        {member.mBooks.map(b => (
                          <li key={b.id} className="text-xs font-medium text-gray-700 flex flex-col">
                            <span className="truncate font-bold text-gray-900">{b.book_name}</span>
                            <span className="truncate text-[10px] text-gray-500">{b.author_name} &bull; {b.duration_hours}h</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No books today</div>
                    )}
                  </div>
                </div>

                {/* Monthly Stats Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-900 mb-2">
                    <span>Monthly Progress</span>
                    <span className="text-sfa-red bg-red-50 px-2 py-0.5 rounded-full">{member.monthlyCompletedActivities} Acts</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                    <span>{member.monthlyPrayerHours.toFixed(1)}h Prayer</span>
                    <span>{member.monthlyStudyHours.toFixed(1)}h Study</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!members?.length && (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center text-gray-500 font-medium">
            No active members found.
          </div>
        )}
      </section>
    </div>
  )
}
