import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AccountabilityView from './AccountabilityView'

export const dynamic = 'force-dynamic'

export type AccountabilityMember = {
  id: string
  fullName: string
  email: string
}

export type AccountabilityRecord = {
  id: string
  userId: string
  date: string
  type: 'Prayer' | 'Bible Study'
  status: string
  completedAt: string | null
}

export default async function AdminAccountability() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Fetch all members
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')

  const members = (allProfiles || [])
    .filter(p => p.role !== 'admin' && p.email !== 'babayodetestimony0318@gmail.com')
    .map(p => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email
    }))

  // Fetch all records
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select('id, user_id, date, status, completed_at')
    
  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select('id, user_id, date, status, completed_at')

  const allRecords: AccountabilityRecord[] = []
  
  prayerRecords?.forEach(r => {
    allRecords.push({
      id: `p-${r.id}`,
      userId: r.user_id,
      date: r.date,
      type: 'Prayer',
      status: r.status,
      completedAt: r.completed_at
    })
  })

  studyRecords?.forEach(r => {
    allRecords.push({
      id: `s-${r.id}`,
      userId: r.user_id,
      date: r.date,
      type: 'Bible Study',
      status: r.status,
      completedAt: r.completed_at
    })
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accountability</h1>
        <p className="text-gray-500 mt-1">Daily accountability tracker for all members with advanced filtering.</p>
      </header>

      <AccountabilityView members={members} records={allRecords} />
    </div>
  )
}
