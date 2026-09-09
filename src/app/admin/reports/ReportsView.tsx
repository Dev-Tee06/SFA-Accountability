'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, Search, Calendar, CheckCircle2 } from 'lucide-react'

export type ReportRecord = {
  id: string
  date: string
  memberName: string
  memberEmail: string
  chosenPrayerTime: string
  chosenStudyTime: string
  activityName: string
  activityType: 'Prayer' | 'Bible Study'
  scheduledTime: string
  completedAt: string | null
  status: string
}

type ReportsViewProps = {
  initialRecords: ReportRecord[]
}

export default function ReportsView({ initialRecords }: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<'All' | 'Prayer' | 'Bible Study'>('All')
  const [dateFilter, setDateFilter] = useState('')

  // Filter records
  const filteredRecords = initialRecords.filter((record) => {
    const matchesSearch = 
      record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.activityName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesActivity = 
      selectedActivity === 'All' || record.activityType === selectedActivity

    const matchesDate = !dateFilter || record.date === dateFilter

    return matchesSearch && matchesActivity && matchesDate
  })

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export.')
      return
    }

    const headers = [
      'Date',
      'Member Name',
      'Member Email',
      'Chosen Prayer Time',
      'Chosen Bible Study Time',
      'Activity',
      'Scheduled Time',
      'Completed At',
      'Status'
    ]

    const csvRows = filteredRecords.map(r => {
      const formattedCompletedAt = r.completedAt 
        ? format(new Date(r.completedAt), 'yyyy-MM-dd HH:mm:ss')
        : 'N/A'

      return [
        `"${r.date}"`,
        `"${r.memberName.replace(/"/g, '""')}"`,
        `"${r.memberEmail.replace(/"/g, '""')}"`,
        `"${r.chosenPrayerTime}"`,
        `"${r.chosenStudyTime}"`,
        `"${r.activityName}"`,
        `"${r.scheduledTime}"`,
        `"${formattedCompletedAt}"`,
        `"${r.status}"`
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SFA_Member_Activity_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Actions & Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by member name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Activity Filter */}
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-black"
          >
            <option value="All">All Activities</option>
            <option value="Prayer">Morning Prayer</option>
            <option value="Bible Study">Bible Study</option>
          </select>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-black"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-red-600 hover:underline font-medium"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm flex-shrink-0"
        >
          <Download size={16} />
          Export CSV ({filteredRecords.length})
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Completed Records</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{initialRecords.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered Records</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{filteredRecords.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unique Members Active</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(filteredRecords.map(r => r.memberEmail)).size}
          </div>
        </div>
      </div>

      {/* Date-by-Date Activity Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Date-by-Date Completed Activities</h2>
          <span className="text-xs text-gray-500">Sorted by most recent</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Member Details</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Times Chosen</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Completed Activity</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Completion Timestamp</th>
                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(record.date), 'EEEE')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{record.memberName}</div>
                    <div className="text-sm text-gray-500">{record.memberEmail}</div>
                  </td>
                  <td className="p-4 text-xs text-gray-700 whitespace-nowrap">
                    <div>
                      <span className="text-gray-400 font-medium">Prayer:</span> {record.chosenPrayerTime}
                    </div>
                    <div className="mt-0.5">
                      <span className="text-gray-400 font-medium">Bible Study:</span> {record.chosenStudyTime}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      record.activityType === 'Prayer' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {record.activityName}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                    {record.completedAt 
                      ? format(new Date(record.completedAt), 'h:mm a')
                      : 'Completed'}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 size={12} />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    No completed activity records found matching your filters.
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
