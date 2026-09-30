'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { BookOpen, Plus, Clock, BookMarked } from 'lucide-react'

export default function BooksList({ initialBooks, userId }: { initialBooks: any[], userId: string }) {
  const [books, setBooks] = useState(initialBooks)
  const [showForm, setShowForm] = useState(false)
  
  const [bookName, setBookName] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [durationHours, setDurationHours] = useState('1')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newBook = {
      user_id: userId,
      book_name: bookName,
      author_name: authorName,
      date: date,
      duration_hours: parseFloat(durationHours) || 0,
    }

    const { data, error } = await supabase
      .from('book_reading_records')
      .insert(newBook)
      .select()
      .single()

    if (!error && data) {
      setBooks([data, ...books])
      setShowForm(false)
      // reset form
      setBookName('')
      setAuthorName('')
      setDurationHours('1')
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-black text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={20} /> Log a Book
        </button>
      ) : (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-gray-400 dark:text-white hover:text-gray-600 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Log Reading</h2>
          
          <form onSubmit={handleAddBook} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Book Title</label>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="e.g. Purpose Driven Life"
                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Rick Warren"
                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Hours Spent</label>
                <input
                  type="number"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                  min="0.1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sfa-red text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Book'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Reading History</h3>
        
        {books.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/10 border-dashed">
            <BookMarked className="mx-auto text-gray-300 dark:text-white/50 mb-2" size={32} />
            <p className="text-gray-500 dark:text-white font-medium">No books logged yet.</p>
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mt-1 sm:mt-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{book.book_name}</h4>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">by {book.author_name}</div>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span>{format(new Date(book.date), 'MMM d, yyyy')}</span>
                    <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> 
                      {book.duration_hours} {book.duration_hours === 1 ? 'hour' : 'hours'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
