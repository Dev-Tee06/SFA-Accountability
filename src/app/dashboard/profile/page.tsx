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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your account information and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <h3 className="text-gray-500 font-medium mb-2">Total Prayers Completed</h3>
          <div className="text-4xl font-black text-sfa-red">{prayerCount || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <h3 className="text-gray-500 font-medium mb-2">Total Bible Studies Completed</h3>
          <div className="text-4xl font-black text-sfa-red">{studyCount || 0}</div>
        </div>
      </div>

      <ProfileForm 
        initialName={user.user_metadata?.full_name || profile?.full_name || ''} 
        email={user.email || profile?.email || ''}
      />
    </div>
  )
}

