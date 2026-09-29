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
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch some basic accountability stats to show on the profile (Total Prayers/Bible Studies)
  const { count: prayerCount } = await supabase
    .from('prayer_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')

  const { count: studyCount } = await supabase
    .from('bible_study_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')

  const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  
  const { count: thisMonthPrayers } = await supabase
    .from('prayer_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .gte('date', startOfMonthStr)

  const { count: thisMonthStudies } = await supabase
    .from('bible_study_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed')
    .gte('date', startOfMonthStr)

  const prayerDuration = schedule?.prayer_duration || 60
  const studyDuration = schedule?.bible_study_duration || 60

  const formatHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const monthlyPrayerHours = formatHours(prayerDuration * (thisMonthPrayers || 0))
  const monthlyStudyHours = formatHours(studyDuration * (thisMonthStudies || 0))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your account information and preferences.</p>
      </header>

      <ProfileForm 
        initialName={user.user_metadata?.full_name || profile?.full_name || ''} 
        email={user.email || profile?.email || ''}
        userId={user.id}
        avatarUrl={profile?.avatar_url || ''}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Total Prayers</h3>
          <div className="text-2xl md:text-3xl font-black text-gray-900">{prayerCount || 0}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Total Study</h3>
          <div className="text-2xl md:text-3xl font-black text-gray-900">{studyCount || 0}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Monthly Prayer</h3>
          <div className="text-2xl md:text-3xl font-black text-sfa-red truncate">{monthlyPrayerHours}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center col-span-2 md:col-span-1">
          <h3 className="text-gray-500 font-medium text-[10px] md:text-sm mb-1 uppercase tracking-wider">Monthly Study</h3>
          <div className="text-2xl md:text-3xl font-black text-sfa-red truncate">{monthlyStudyHours}</div>
        </div>
      </div>
    </div>
  )
}

