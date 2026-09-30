'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { CheckCircle2, Plus, Clock, FileText } from 'lucide-react'
import TimePicker from '@/components/TimePicker'

export default function TasksList({ initialTasks, userId }: { initialTasks: any[], userId: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [showForm, setShowForm] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskDate, setTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('09:30')
  const [duration, setDuration] = useState('30')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newTask = {
      user_id: userId,
      title,
      description,
      task_date: taskDate,
      start_time: `${startTime}:00`,
      end_time: endTime ? `${endTime}:00` : null,
      duration_minutes: duration ? parseInt(duration, 10) : null,
      status: 'Completed'
    }

    const { data, error } = await supabase
      .from('optional_tasks')
      .insert(newTask)
      .select()
      .single()

    if (!error && data) {
      setTasks([data, ...tasks])
      setShowForm(false)
      // reset form
      setTitle('')
      setDescription('')
    }
    
    setLoading(false)
  }

  const commonTasks = ['Stretch Prayers', 'Personal Bible Reflection', 'Thanksgiving', 'Evangelism', 'Meditation']

  const formatTime12h = (time24: string) => {
    if (!time24) return ''
    const [h, m] = time24.split(':')
    const hour = parseInt(h, 10)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${period}`
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-black text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={20} /> Add Optional Task
        </button>
      ) : (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-gray-400 dark:text-white hover:text-gray-600 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">New Task</h2>
          
          <form onSubmit={handleAddTask} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Task Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Evangelism"
                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                required
                list="task-suggestions"
              />
              <datalist id="task-suggestions">
                {commonTasks.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Date</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Start Time</label>
                <TimePicker value={startTime} onChange={setStartTime} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">End Time (Optional)</label>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this activity..."
                className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red min-h-[100px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sfa-red text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Completed Task'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Task History</h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/10 border-dashed">
            <FileText className="mx-auto text-gray-300 dark:text-white/50 mb-2" size={32} />
            <p className="text-gray-500 dark:text-white font-medium">No optional tasks logged yet.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="bg-green-100 text-green-600 p-3 rounded-full mt-1 sm:mt-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{task.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-white mt-1">
                    <span>{format(new Date(task.task_date), 'MMM d, yyyy')}</span>
                    <span className="text-gray-300 dark:text-white">&bull;</span>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-white">
                      <Clock size={14} /> 
                      {formatTime12h(task.start_time)} 
                      {task.end_time && ` - ${formatTime12h(task.end_time)}`}
                    </span>
                    {task.duration_minutes && (
                      <>
                        <span className="text-gray-300 dark:text-white">&bull;</span>
                        <span className="text-gray-500 dark:text-white">{task.duration_minutes} mins</span>
                      </>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-white bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
