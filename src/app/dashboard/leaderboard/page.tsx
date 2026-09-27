import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Trophy, Medal, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Calculate the current week (Monday to Sunday)
  const now = new Date()
  const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  // Call the secure RPC function to get leaderboard data
  const { data: leaderboardData, error } = await supabase.rpc('get_weekly_leaderboard', {
    start_date: start,
    end_date: end
  })

  // Max tasks per week: 7 prayers + 7 bible studies = 14
  const MAX_WEEKLY_TASKS = 14

  // Fetch admins to filter them out
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  const adminIds = new Set(adminProfiles?.map(p => p.id) || [])

  // Process and sort the data, filtering out admins
  let rankedUsers = []
  if (leaderboardData) {
    rankedUsers = leaderboardData
      .filter((row: any) => !adminIds.has(row.user_id))
      .map((row: any) => ({
        id: row.user_id,
        name: row.full_name,
        completedCount: Number(row.completed_count),
        percentage: Math.round((Number(row.completed_count) / MAX_WEEKLY_TASKS) * 100)
      }))
      .sort((a: any, b: any) => b.completedCount - a.completedCount)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center md:justify-start gap-3">
          <Trophy className="text-yellow-500" size={36} />
          Weekly Leaderboard
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          See who is staying most consistent this week ({format(new Date(start), 'MMM d')} - {format(new Date(end), 'MMM d')}).
        </p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          Error loading leaderboard: {error.message}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Rankings</h2>
          <span className="text-sm font-medium text-gray-400">Based on 14 weekly tasks</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {rankedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No data available for this week yet.</div>
          ) : (
            rankedUsers.map((person: any, index: number) => {
              const isCurrentUser = person.id === user.id
              
              return (
                <div 
                  key={person.id} 
                  className={`p-5 md:p-6 flex items-center justify-between transition-colors ${
                    isCurrentUser ? 'bg-red-50/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                      {index === 0 ? <Trophy className="text-yellow-500" size={28} /> :
                       index === 1 ? <Medal className="text-gray-400" size={28} /> :
                       index === 2 ? <Medal className="text-amber-600" size={28} /> :
                       <span className="text-xl font-bold text-gray-400">#{index + 1}</span>}
                    </div>
                    
                    <div className="min-w-0 flex-1 pr-4">
                      <h3 className={`font-bold text-lg truncate ${isCurrentUser ? 'text-sfa-red' : 'text-gray-900'}`}>
                        {person.name} {isCurrentUser && <span className="text-xs font-normal bg-sfa-red text-white px-2 py-0.5 rounded-full ml-2 align-middle">You</span>}
                      </h3>
                      <div className="text-sm font-medium text-gray-500 mt-0.5">
                        {person.completedCount} / {MAX_WEEKLY_TASKS} tasks completed
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900">
                      {person.percentage}%
                    </div>
                    
                    <div className="w-24 md:w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
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
    </div>
  )
}
