import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ActivityCard from '@/components/ActivityCard'
import BookReadingCard from '@/components/BookReadingCard'
import { format, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardHome() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (user.email === 'babayodetestimony0318@gmail.com' || profile?.role === 'admin') {
    redirect('/admin')
  }

  // Fetch Schedule
  const { data: schedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch Today's Records
  const { data: prayerRecord } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  const { data: studyRecord } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  const startOfWeekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const endOfWeekStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { count: bookSessionsCount } = await supabase
    .from('book_reading_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('date', startOfWeekStr)
    .lte('date', endOfWeekStr)

  const { data: bookRecordToday } = await supabase
    .from('book_reading_records')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .limit(1)

  const hasReadToday = Boolean(bookRecordToday && bookRecordToday.length > 0)

  // Determine the display name by checking user_metadata first, then profile, defaulting to Member
  const fullName = user.user_metadata?.full_name || profile?.full_name || 'Member'
  const firstName = fullName.split(' ')[0]

  // Daily Progress Logic
  const completedPrayersToday = prayerRecord?.status === 'Completed' ? 1 : 0
  const completedStudiesToday = studyRecord?.status === 'Completed' ? 1 : 0
  const totalCompletedToday = completedPrayersToday + completedStudiesToday
  const maxActivities = 2
  const dailyPercentage = Math.round((totalCompletedToday / maxActivities) * 100)

  // Streak Logic
  const { data: allPrayers } = await supabase
    .from('prayer_records')
    .select('date')
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  const { data: allStudies } = await supabase
    .from('bible_study_records')
    .select('date')
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  const prayerDates = new Set(allPrayers?.map(r => r.date) || [])
  const studyDates = new Set(allStudies?.map(r => r.date) || [])
  const completedDates = new Set([...prayerDates].filter(d => studyDates.has(d)))

  // To avoid timezone issues, format dates strictly as YYYY-MM-DD
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
  const todayStr = formatDate(new Date())
  const yesterdayStr = formatDate(new Date(new Date().setDate(new Date().getDate() - 1)))

  // Calculate streak as of yesterday, allowing 1 missed day without breaking
  let streakAsOfYesterday = 0;
  let checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1);
  let consecutiveMisses = 0;

  while (true) {
    let ds = formatDate(checkDate);
    if (completedDates.has(ds)) {
      streakAsOfYesterday++;
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
      if (consecutiveMisses >= 2) {
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentStreak = streakAsOfYesterday;
  if (completedDates.has(todayStr)) {
    currentStreak++;
  }

  const isStreakInDanger = !completedDates.has(todayStr) && !completedDates.has(yesterdayStr) && streakAsOfYesterday > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      {isStreakInDanger && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-pulse">
          <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-bold text-lg">Streak in Danger!</h3>
            <p className="text-red-600 text-sm mt-1">
              You haven't completed your tasks for 2 days. Complete your activities today to save your {streakAsOfYesterday}-day streak before it resets to 0!
            </p>
          </div>
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Welcome, {firstName}
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Here is your accountability for today.</p>
      </header>

      <section className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Today's Activities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityCard
            type="prayer"
            title="Prayer"
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
        </div>
      </section>

      <section className="space-y-5 mt-8">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Weekly Goals</h2>
        <BookReadingCard 
          userId={user.id} 
          completedSessions={bookSessionsCount || 0} 
          hasReadToday={hasReadToday}
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </div>
          <h3 className="text-gray-500 font-semibold mb-2 relative z-10">Daily Progress</h3>
          <div className="text-5xl font-black tracking-tighter text-gray-900 relative z-10">{dailyPercentage}%</div>
          <div className="text-sm text-gray-400 mt-2 font-medium relative z-10">
            {totalCompletedToday} of {maxActivities} activities completed today
          </div>
          
          <div className="w-full bg-gray-50 h-3 rounded-full mt-5 overflow-hidden relative z-10 border border-gray-100">
            <div 
              className="bg-gradient-to-r from-sfa-red to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <h3 className="text-gray-500 font-semibold mb-2 relative z-10">Current Streak</h3>
          <div className="text-5xl font-black tracking-tighter text-gray-900 relative z-10">
            {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
          </div>
          <div className="text-sm text-gray-400 mt-2 font-medium relative z-10">
            {currentStreak > 0 ? 'Keep the momentum going!' : 'Start your streak today.'}
          </div>
        </section>
      </div>
    </div>
  )
}
