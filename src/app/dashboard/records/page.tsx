import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'

export default async function RecordsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all records (not just last 14 days, user requested complete history)
  const { data: prayerRecords } = await supabase
    .from('prayer_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const { data: studyRecords } = await supabase
    .from('bible_study_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const allRecords = [
    ...(prayerRecords || []).map(r => ({ ...r, activityName: 'Morning Prayer', activityType: 'Prayer' })),
    ...(studyRecords || []).map(r => ({ ...r, activityName: 'Daily Bible Study', activityType: 'Bible Study' }))
  ]

  // Sort by date descending
  allRecords.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA === dateB) {
      return a.activityType.localeCompare(b.activityType)
    }
    return dateB - dateA
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
        <p className="text-gray-500 mt-1">Your complete accountability records.</p>
      </header>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {allRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No accountability records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-medium text-sm text-gray-600">Date</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Activity</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Type</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((record, idx) => {
                  const formattedDate = format(new Date(record.date), 'MMM d, yyyy')
                  return (
                    <tr key={`${record.id}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-sm">{formattedDate}</td>
                      <td className="p-4 text-sm text-gray-800">{record.activityName}</td>
                      <td className="p-4 text-sm text-gray-500">{record.activityType}</td>
                      <td className="p-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          record.status === 'Missed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
