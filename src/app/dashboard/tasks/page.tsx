import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TasksList from './TasksList'

export const dynamic = 'force-dynamic'

export default async function OptionalTasksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('optional_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Optional Tasks
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Log additional personal activities like Evangelism, Thanksgiving, or extra prayer sessions.
          These do not affect your core accountability score.
        </p>
      </header>

      <TasksList initialTasks={tasks || []} userId={user.id} />
    </div>
  )
}
