import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import MembersView from './MembersView'

export const dynamic = 'force-dynamic'

export type MemberRecord = {
  id: string
  fullName: string
  email: string
  createdAt: string | null
  prayerTime: string
  studyTime: string
  isPrayerDone: boolean
  isStudyDone: boolean
  prayerCompletedAt: string | null
  studyCompletedAt: string | null
  totalAllTime: number
}

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

  // Exclude any admin accounts
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

  // Format data for the client view
  const formattedMembers: MemberRecord[] = members.map(member => {
    const prayerTime = Array.isArray(member.schedules) ? member.schedules[0]?.prayer_time?.substring(0, 5) : (member.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
    const studyTime = Array.isArray(member.schedules) ? member.schedules[0]?.bible_study_time?.substring(0, 5) : (member.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

    const todayPrayer = todayPrayerMap.get(member.id)
    const todayStudy = todayStudyMap.get(member.id)

    return {
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      createdAt: member.created_at,
      prayerTime,
      studyTime,
      isPrayerDone: todayPrayer?.status === 'Completed',
      isStudyDone: todayStudy?.status === 'Completed',
      prayerCompletedAt: todayPrayer?.completed_at || null,
      studyCompletedAt: todayStudy?.completed_at || null,
      totalAllTime: allTimeCountMap.get(member.id) || 0
    }
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Members Directory</h1>
        <p className="text-gray-500 mt-1">Detailed directory of all platform members, their schedules, and lifetime statistics.</p>
      </header>

      <MembersView initialMembers={formattedMembers} />
    </div>
  )
}
