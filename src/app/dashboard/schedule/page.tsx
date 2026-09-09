import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ScheduleForm from './ScheduleForm'

export default async function SchedulePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: schedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your Schedule</h1>
        <p className="text-gray-500 mt-1">Manage your daily commitment times.</p>
      </header>

      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <ScheduleForm initialSchedule={schedule} userId={user.id} />
      </section>
    </div>
  )
}
