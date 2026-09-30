import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BooksList from './BooksList'

export const dynamic = 'force-dynamic'

export default async function BooksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: books } = await supabase
    .from('book_reading_records')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Books Read
        </h1>
        <p className="text-gray-500 dark:text-white mt-2 text-lg">
          Log external books you've read, including the title, author, and how many hours you spent reading.
        </p>
      </header>

      <BooksList initialBooks={books || []} userId={user.id} />
    </div>
  )
}
