import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Trophy, Medal, History, CalendarDays, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; weekId?: string; month?: string; year?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams;
  const tab = params.tab || 'current'

  // Fetch profiles to get avatars and filter out admins
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, role, avatar_url, full_name')

  const adminIds = new Set(allProfiles?.filter(p => p.role === 'admin').map(p => p.id) || [])
  const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || [])

  const MAX_WEEKLY_TASKS = 14
  let rankedUsers = []
  let title = 'Weekly Leaderboard'
  let subtitle = 'See who is staying most consistent this week.'
  let maxTasks = MAX_WEEKLY_TASKS
  let errorMsg = null

  // 1. CURRENT TAB
  if (tab === 'current') {
    const now = new Date()
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    subtitle = `Current Week: ${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d')}`

    const { data: leaderboardData, error } = await supabase.rpc('get_weekly_leaderboard', {
      start_date: start,
      end_date: end
    })

    if (error) {
      errorMsg = error.message
    } else if (leaderboardData) {
      rankedUsers = leaderboardData
        .filter((row: any) => !adminIds.has(row.user_id))
        .map((row: any) => ({
          id: row.user_id,
          name: row.full_name || profileMap.get(row.user_id)?.full_name,
          avatarUrl: profileMap.get(row.user_id)?.avatar_url,
          completedCount: Number(row.completed_count),
          percentage: Math.min(100, Math.round((Number(row.completed_count) / MAX_WEEKLY_TASKS) * 100))
        }))
        .sort((a: any, b: any) => b.completedCount - a.completedCount)
    }
  }

  // 2. HISTORY TAB
  if (tab === 'history') {
    title = 'Weekly History'
    subtitle = 'View past performance records.'
    
    // Get all completed weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('leaderboard_weeks')
      .select('id, start_date, end_date')
      .eq('status', 'completed')
      .order('end_date', { ascending: false })

    if (weeksError) errorMsg = weeksError.message

    const selectedWeekId = params.weekId || (weeks && weeks.length > 0 ? weeks[0].id : null)

    if (selectedWeekId) {
      const selectedWeek = weeks?.find(w => w.id === selectedWeekId)
      if (selectedWeek) {
        subtitle = `Week of ${format(new Date(selectedWeek.start_date), 'MMM d')} - ${format(new Date(selectedWeek.end_date), 'MMM d, yyyy')}`
      }

      const { data: historyData, error } = await supabase
        .from('weekly_leaderboards')
        .select(`
          completed_count,
          rank,
          profiles(id, full_name, avatar_url)
        `)
        .eq('week_id', selectedWeekId)
        .order('completed_count', { ascending: false })

      if (error) {
        errorMsg = error.message
      } else if (historyData) {
        rankedUsers = historyData
          .filter((row: any) => row.profiles && !adminIds.has(row.profiles.id))
          .map((row: any) => ({
            id: row.profiles.id,
            name: row.profiles.full_name,
            avatarUrl: row.profiles.avatar_url || profileMap.get(row.profiles.id)?.avatar_url,
            completedCount: Number(row.completed_count),
            percentage: Math.min(100, Math.round((Number(row.completed_count) / MAX_WEEKLY_TASKS) * 100))
          }))
      }
    }

    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
        <Header tab={tab} title={title} subtitle={subtitle} errorMsg={errorMsg} />
        <Tabs currentTab={tab} />
        
        {weeks && weeks.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {weeks.map(week => (
              <Link 
                key={week.id} 
                href={`/dashboard/leaderboard?tab=history&weekId=${week.id}`}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  week.id === selectedWeekId ? 'bg-sfa-red text-white' : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                {format(new Date(week.start_date), 'MMM d')} - {format(new Date(week.end_date), 'MMM d')}
              </Link>
            ))}
          </div>
        )}

        <LeaderboardList users={rankedUsers} currentUserId={user.id} maxTasks={maxTasks} emptyMessage="No history found for this week." />
      </div>
    )
  }

  // 3. MONTHLY TAB
  if (tab === 'monthly') {
    title = 'Monthly Leaderboard'
    subtitle = 'Aggregate performance across all completed weeks.'
    
    // Get unique months from leaderboard_weeks to build the selector
    const { data: weeks } = await supabase
      .from('leaderboard_weeks')
      .select('month, year')
      .eq('status', 'completed')
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    // Unique months
    const monthSet = new Set()
    const availableMonths: {month: string, year: number}[] = []
    weeks?.forEach(w => {
      const key = `${w.month}-${w.year}`
      if (!monthSet.has(key)) {
        monthSet.add(key)
        availableMonths.push({ month: w.month.trim(), year: w.year })
      }
    })

    const selectedMonth = params.month || (availableMonths.length > 0 ? availableMonths[0].month : format(new Date(), 'MMMM'))
    const selectedYear = params.year ? parseInt(params.year) : (availableMonths.length > 0 ? availableMonths[0].year : new Date().getFullYear())
    
    subtitle = `Performance for ${selectedMonth} ${selectedYear}`
    
    // Estimate max tasks for a month (approx 4 weeks * 14 = 56)
    maxTasks = 56

    const { data: monthlyData, error } = await supabase
      .from('monthly_leaderboards')
      .select(`
        completed_count,
        rank,
        profiles(id, full_name, avatar_url)
      `)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .order('completed_count', { ascending: false })

    if (error) {
      errorMsg = error.message
    } else if (monthlyData) {
      rankedUsers = monthlyData
        .filter((row: any) => row.profiles && !adminIds.has(row.profiles.id))
        .map((row: any) => ({
          id: row.profiles.id,
          name: row.profiles.full_name,
          avatarUrl: row.profiles.avatar_url || profileMap.get(row.profiles.id)?.avatar_url,
          completedCount: Number(row.completed_count),
          percentage: Math.min(100, Math.round((Number(row.completed_count) / maxTasks) * 100))
        }))
    }

    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
        <Header tab={tab} title={title} subtitle={subtitle} errorMsg={errorMsg} />
        <Tabs currentTab={tab} />
        
        {availableMonths.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {availableMonths.map(m => (
              <Link 
                key={`${m.month}-${m.year}`} 
                href={`/dashboard/leaderboard?tab=monthly&month=${m.month}&year=${m.year}`}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  m.month === selectedMonth && m.year === selectedYear ? 'bg-sfa-red text-white' : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                {m.month} {m.year}
              </Link>
            ))}
          </div>
        )}

        <LeaderboardList users={rankedUsers} currentUserId={user.id} maxTasks={maxTasks} emptyMessage="No monthly data found yet." />
      </div>
    )
  }

  // DEFAULT CURRENT VIEW
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <Header tab={tab} title={title} subtitle={subtitle} errorMsg={errorMsg} />
      <Tabs currentTab={tab} />
      <LeaderboardList users={rankedUsers} currentUserId={user.id} maxTasks={maxTasks} emptyMessage="No data available for this week yet." />
    </div>
  )
}

function Header({ tab, title, subtitle, errorMsg }: any) {
  return (
    <header className="mb-4 text-center md:text-left">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
        {tab === 'monthly' ? <CalendarDays className="text-blue-500" size={36} /> :
         tab === 'history' ? <History className="text-purple-500" size={36} /> :
         <Trophy className="text-yellow-500" size={36} />}
        {title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">{subtitle}</p>
      
      {errorMsg && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          Error loading leaderboard: {errorMsg}
        </div>
      )}
    </header>
  )
}

function Tabs({ currentTab }: { currentTab: string }) {
  return (
    <div className="flex bg-white dark:bg-black rounded-xl p-1 border border-gray-100 dark:border-white/10 shadow-sm w-full md:w-auto overflow-hidden">
      <Link 
        href="/dashboard/leaderboard?tab=current" 
        className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'current' ? 'bg-sfa-red text-white shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
      >
        This Week
      </Link>
      <Link 
        href="/dashboard/leaderboard?tab=monthly" 
        className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'monthly' ? 'bg-sfa-red text-white shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
      >
        Monthly
      </Link>
      <Link 
        href="/dashboard/leaderboard?tab=history" 
        className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'history' ? 'bg-sfa-red text-white shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
      >
        History
      </Link>
    </div>
  )
}

function LeaderboardList({ users, currentUserId, maxTasks, emptyMessage }: any) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-black/50 flex justify-between items-center">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300">Rankings</h2>
        <span className="text-sm font-medium text-gray-400">Target tasks: {maxTasks}</span>
      </div>
      
      <div className="divide-y divide-gray-50 dark:divide-white/5">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{emptyMessage}</div>
        ) : (
          users.map((person: any, index: number) => {
            const isCurrentUser = person.id === currentUserId
            
            return (
              <div 
                key={person.id} 
                className={`p-5 md:p-6 flex items-center justify-between transition-colors ${
                  isCurrentUser ? 'bg-red-50/30 dark:bg-sfa-red/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                    {index === 0 ? <Trophy className="text-yellow-500" size={28} /> :
                     index === 1 ? <Medal className="text-gray-400" size={28} /> :
                     index === 2 ? <Medal className="text-amber-600" size={28} /> :
                     <span className="text-xl font-bold text-gray-400">#{index + 1}</span>}
                  </div>
                  
                  <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-black flex items-center justify-center flex-shrink-0">
                    {person.avatarUrl ? (
                      <Image src={person.avatarUrl} alt={person.name} fill className="object-cover" />
                    ) : (
                      <User size={18} className="text-gray-400" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 pr-4 ml-1 md:ml-2">
                    <h3 className={`font-bold text-lg truncate ${isCurrentUser ? 'text-sfa-red' : 'text-gray-900 dark:text-white'}`}>
                      {person.name} {isCurrentUser && <span className="text-xs font-normal bg-sfa-red text-white px-2 py-0.5 rounded-full ml-2 align-middle">You</span>}
                    </h3>
                    <div className="text-sm font-medium text-gray-500 mt-0.5">
                      {person.completedCount} / {maxTasks} tasks completed
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
                    {person.percentage}%
                  </div>
                  
                  <div className="w-24 md:w-32 bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        person.percentage >= 80 ? 'bg-green-500' :
                        person.percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${person.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
