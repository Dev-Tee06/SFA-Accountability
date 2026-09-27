import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: schedule } = await supabase
    .from('schedules')
    .select('prayer_time, prayer_duration')
    .eq('user_id', user.id)
    .single()

  // Format time strictly to HH:MM for the input
  const formattedPrayerTime = schedule?.prayer_time ? schedule.prayer_time.substring(0, 5) : ''
  const initialPrayerDuration = schedule?.prayer_duration || 60

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your account information and preferences.</p>
      </header>

      <ProfileForm 
        initialName={user.user_metadata?.full_name || profile?.full_name || ''} 
        email={user.email || profile?.email || ''}
        initialPrayerTime={formattedPrayerTime}
        initialPrayerDuration={initialPrayerDuration}
      />
    </div>
  )
}
