import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ActivityCard from '@/components/ActivityCard'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardHome() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (user.email === 'babayodetestimony0318@gmail.com' || profile?.role === 'admin') {
    redirect('/admin')
  }

  const todayDate = new Date()
  const today = format(todayDate, 'yyyy-MM-dd')
  const startOfWeekStr = format(startOfWeek(todayDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const endOfWeekStr = format(endOfWeek(todayDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const startOfMonthStr = format(startOfMonth(todayDate), 'yyyy-MM-dd')
  const endOfMonthStr = format(endOfMonth(todayDate), 'yyyy-MM-dd')

  const [
    { data: schedule },
    { data: prayerRecord },
    { data: studyRecord },
    { data: allPrayers },
    { data: allStudies },
    { data: thisWeekPrayers },
    { data: thisWeekStudies },
    { data: thisMonthPrayers },
    { data: thisMonthStudies }
  ] = await Promise.all([
    supabase.from('schedules').select('*').eq('user_id', user.id).single(),
    supabase.from('prayer_records').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('bible_study_records').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('prayer_records').select('date').eq('user_id', user.id).eq('status', 'Completed').order('date', { ascending: false }),
    supabase.from('bible_study_records').select('date').eq('user_id', user.id).eq('status', 'Completed').order('date', { ascending: false }),
    supabase.from('prayer_records').select('status').eq('user_id', user.id).gte('date', startOfWeekStr).lte('date', endOfWeekStr),
    supabase.from('bible_study_records').select('status').eq('user_id', user.id).gte('date', startOfWeekStr).lte('date', endOfWeekStr),
    supabase.from('prayer_records').select('status').eq('user_id', user.id).gte('date', startOfMonthStr).lte('date', endOfMonthStr).eq('status', 'Completed'),
    supabase.from('bible_study_records').select('status').eq('user_id', user.id).gte('date', startOfMonthStr).lte('date', endOfMonthStr).eq('status', 'Completed')
  ])

  // Name formatting
  const fullName = user.user_metadata?.full_name || profile?.full_name || 'Member'
  const firstName = fullName.split(' ')[0]

  // Time based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  // Streak Logic
  const prayerDates = new Set(allPrayers?.map(r => r.date) || [])
  const studyDates = new Set(allStudies?.map(r => r.date) || [])
  const completedDates = new Set([...prayerDates].filter(d => studyDates.has(d)))

  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
  const todayStr = formatDate(new Date())
  const yesterdayStr = formatDate(new Date(new Date().setDate(new Date().getDate() - 1)))

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

  // Weekly Accountability (14 opportunities)
  const completedThisWeek = 
    (thisWeekPrayers?.filter(r => r.status === 'Completed').length || 0) + 
    (thisWeekStudies?.filter(r => r.status === 'Completed').length || 0)
  
  const weeklyPercentage = Math.round((completedThisWeek / 14) * 100)

  // Monthly Progress (Actual Logged Hours)
  const prayerDuration = schedule?.prayer_duration || 60
  const studyDuration = schedule?.bible_study_duration || 60

  const formatHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const completedPrayersThisMonth = thisMonthPrayers?.length || 0
  const completedStudiesThisMonth = thisMonthStudies?.length || 0

  const monthlyPrayerHours = formatHours(prayerDuration * completedPrayersThisMonth)
  const monthlyStudyHours = formatHours(studyDuration * completedStudiesThisMonth)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none" />

      <header className="pt-2 md:pt-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight flex flex-col md:block">
          <span>{greeting},</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sfa-red to-red-600 truncate">
            {' '}{firstName}
          </span>
        </h1>
        <p className="text-gray-500 mt-2 text-base md:text-lg font-medium">Here is your accountability for today.</p>
      </header>

      <section className="space-y-6">
        <ActivityCard
          type="prayer"
          title="Prayers"
          time={schedule?.prayer_time}
          duration={schedule?.prayer_duration || 60}
          record={prayerRecord}
          userId={user.id}
        />
        <ActivityCard
          type="study"
          title="Bible Study"
          time={schedule?.bible_study_time}
          duration={schedule?.bible_study_duration || 60}
          record={studyRecord}
          userId={user.id}
        />
      </section>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1">
          <div className="text-[10px] md:text-base text-gray-500 font-bold mb-1 md:mb-2 uppercase tracking-wider md:tracking-widest">Current Streak</div>
          <div className="text-2xl md:text-5xl font-black text-gray-900 flex items-center">
            <span className="text-orange-500 mr-1 md:mr-2">🔥</span>{currentStreak}
          </div>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1">
          <div className="text-[10px] md:text-base text-gray-500 font-bold mb-1 md:mb-2 uppercase tracking-wider md:tracking-widest">Weekly Score</div>
          <div className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">
            {weeklyPercentage}%
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-4 md:px-8 py-4 md:py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base md:text-lg">Monthly Progress</h2>
          <span className="text-[10px] md:text-xs font-bold bg-red-50 text-sfa-red px-2 md:px-3 py-1 rounded-full uppercase tracking-wider">Current Month</span>
        </div>
        <div className="p-4 md:p-8 grid grid-cols-2 gap-3 md:gap-6 divide-x divide-gray-100">
          <div className="text-center">
            <div className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-wider md:tracking-widest mb-2 md:mb-3">Prayer Hours</div>
            <div className="text-xl md:text-4xl font-black text-gray-900 truncate">{monthlyPrayerHours}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-wider md:tracking-widest mb-2 md:mb-3">Study Hours</div>
            <div className="text-xl md:text-4xl font-black text-gray-900 truncate">{monthlyStudyHours}</div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-900 to-black p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sfa-red/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 w-full">
          <h2 className="font-bold text-white text-lg md:text-2xl mb-1 md:mb-2">Optional Tasks</h2>
          <p className="text-gray-400 text-xs md:text-base max-w-sm">Log additional activities like evangelism and community service.</p>
        </div>
        <Link 
          href="/dashboard/tasks"
          className="relative z-10 bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0 w-full md:w-auto text-center"
        >
          View Optional Tasks
        </Link>
      </section>
    </div>
  )
}
