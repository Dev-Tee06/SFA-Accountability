import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ReportsView, { ReportRecord } from './ReportsView'

export const dynamic = 'force-dynamic'

export default async function AdminReports() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // 1. Fetch only regular member profiles with schedules (excluding admins)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      schedules (
        prayer_time,
        bible_study_time
      )
    `)

  const memberProfiles = (allProfiles || []).filter(
    (p) => p.role !== 'admin' && p.email !== 'babayodetestimony0318@gmail.com'
  )

  const profileMap = new Map(memberProfiles.map(p => [p.id, p]))

  // 2. Fetch all completed prayer records
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  // 3. Fetch all completed bible study records
  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('status', 'Completed')
    .order('date', { ascending: false })

  // 4. Collate records date-by-date (only for members)
  const allRecords: ReportRecord[] = []

  prayerRecords?.forEach((r) => {
    const profile = profileMap.get(r.user_id)
    if (!profile) return // Exclude non-members / admins
    const prayerTime = Array.isArray(profile?.schedules) 
      ? profile?.schedules[0]?.prayer_time?.substring(0, 5) 
      : (profile?.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
    const studyTime = Array.isArray(profile?.schedules) 
      ? profile?.schedules[0]?.bible_study_time?.substring(0, 5) 
      : (profile?.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

    allRecords.push({
      id: `prayer-${r.id}`,
      date: r.date,
      memberName: profile?.full_name || 'Unknown Member',
      memberEmail: profile?.email || 'N/A',
      chosenPrayerTime: prayerTime,
      chosenStudyTime: studyTime,
      activityName: 'Morning Prayer',
      activityType: 'Prayer',
      scheduledTime: r.scheduled_time?.substring(0, 5) || prayerTime,
      completedAt: r.completed_at,
      status: r.status,
    })
  })

  studyRecords?.forEach((r) => {
    const profile = profileMap.get(r.user_id)
    if (!profile) return // Exclude non-members / admins
    const prayerTime = Array.isArray(profile?.schedules) 
      ? profile?.schedules[0]?.prayer_time?.substring(0, 5) 
      : (profile?.schedules as any)?.prayer_time?.substring(0, 5) || '06:00'
    const studyTime = Array.isArray(profile?.schedules) 
      ? profile?.schedules[0]?.bible_study_time?.substring(0, 5) 
      : (profile?.schedules as any)?.bible_study_time?.substring(0, 5) || '20:00'

    allRecords.push({
      id: `study-${r.id}`,
      date: r.date,
      memberName: profile?.full_name || 'Unknown Member',
      memberEmail: profile?.email || 'N/A',
      chosenPrayerTime: prayerTime,
      chosenStudyTime: studyTime,
      activityName: 'Daily Bible Study',
      activityType: 'Bible Study',
      scheduledTime: r.scheduled_time?.substring(0, 5) || studyTime,
      completedAt: r.completed_at,
      status: r.status,
    })
  })

  // Sort descending by date, then by completed_at
  allRecords.sort((a, b) => {
    const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateComp !== 0) return dateComp
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0
    return timeB - timeA
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Reports</h1>
        <p className="text-gray-500 mt-1">
          Historical date-by-date log of member completed activities and chosen schedule times. Exportable to CSV.
        </p>
      </header>

      <ReportsView initialRecords={allRecords} />
    </div>
  )
}
