import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminAccountability() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch today's records with profiles
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select(`
      *,
      profiles(full_name, email)
    `)
    .eq('date', today)

  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select(`
      *,
      profiles(full_name, email)
    `)
    .eq('date', today)

  // Merge records for display
  const userMap: Record<string, any> = {}
  
  prayerRecords?.forEach(r => {
    if (r.profiles?.email === 'babayodetestimony0318@gmail.com') return
    if (!userMap[r.user_id]) userMap[r.user_id] = { id: r.user_id, profile: r.profiles, prayer: r, study: null }
    else userMap[r.user_id].prayer = r
  })
  
  studyRecords?.forEach(r => {
    if (r.profiles?.email === 'babayodetestimony0318@gmail.com') return
    if (!userMap[r.user_id]) userMap[r.user_id] = { id: r.user_id, profile: r.profiles, prayer: null, study: r }
    else userMap[r.user_id].study = r
  })

  const mergedRecords = Object.values(userMap)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Accountability</h1>
        <p className="text-gray-500 mt-1">View all member records for today.</p>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-sfa-red">
            <option>Today ({format(new Date(), 'MMM d, yyyy')})</option>
            <option>Yesterday</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-4 font-medium text-sm text-gray-500">Member</th>
                <th className="p-4 font-medium text-sm text-gray-500">Prayer</th>
                <th className="p-4 font-medium text-sm text-gray-500">Bible Study</th>
              </tr>
            </thead>
            <tbody>
              {mergedRecords.map((record: any) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{record.profile?.full_name || 'Unknown'}</div>
                  </td>
                  <td className="p-4 text-sm">
                    {record.prayer ? (
                      <span className={`font-medium ${record.prayer.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>
                        {record.prayer.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">No record</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {record.study ? (
                      <span className={`font-medium ${record.study.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>
                        {record.study.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">No record</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {mergedRecords.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No accountability records for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
