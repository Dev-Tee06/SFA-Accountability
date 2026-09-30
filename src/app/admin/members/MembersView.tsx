'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { MemberRecord } from './page'

export default function MembersView({ initialMembers }: { initialMembers: MemberRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All')

  // Filter members
  const filteredMembers = initialMembers.filter((member) => {
    const matchesSearch = 
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())

    const isAllDone = member.isPrayerDone && member.isStudyDone
    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Completed' && isAllDone) ||
      (statusFilter === 'Pending' && !isAllDone)

    return matchesSearch && matchesStatus
  })

  const fullyCompletedCount = initialMembers.filter(m => m.isPrayerDone && m.isStudyDone).length
  const pendingCount = initialMembers.length - fullyCompletedCount

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      alert('No members available to export.')
      return
    }

    const headers = [
      'Member Name',
      'Email',
      'Joined Date',
      'Prayer Schedule',
      'Bible Study Schedule',
      'Prayer Done Today',
      'Study Done Today',
      'Lifetime Completions'
    ]

    const csvRows = filteredMembers.map(m => {
      return [
        `"${m.fullName.replace(/"/g, '""')}"`,
        `"${m.email.replace(/"/g, '""')}"`,
        `"${m.createdAt ? format(new Date(m.createdAt), 'yyyy-MM-dd') : 'N/A'}"`,
        `"${m.prayerTime}"`,
        `"${m.studyTime}"`,
        `"${m.isPrayerDone ? 'Yes' : 'No'}"`,
        `"${m.isStudyDone ? 'Yes' : 'No'}"`,
        `"${m.totalAllTime}"`
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SFA_Members_Directory_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Actions & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-black transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">100% Completed Today</option>
            <option value="Pending">Pending Activities Today</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg flex-shrink-0"
        >
          <Download size={16} />
          Export CSV ({filteredMembers.length})
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Members</span>
          <div className="text-3xl font-black text-gray-900 mt-1">{initialMembers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Fully Completed Today</span>
          <div className="text-3xl font-black text-green-700 mt-1 flex items-center gap-2">
            {fullyCompletedCount} <CheckCircle2 size={24} className="opacity-50" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm bg-gradient-to-br from-white to-amber-50 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Pending Today</span>
          <div className="text-3xl font-black text-amber-700 mt-1 flex items-center gap-2">
            {pendingCount} <AlertCircle size={24} className="opacity-50" />
          </div>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Member Details</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Schedules</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Today's Progress</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Lifetime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map(member => {
                const completedToday: string[] = []
                if (member.isPrayerDone) completedToday.push(`Prayer (${member.prayerCompletedAt ? format(new Date(member.prayerCompletedAt), 'h:mm a') : 'Done'})`)
                if (member.isStudyDone) completedToday.push(`Study (${member.studyCompletedAt ? format(new Date(member.studyCompletedAt), 'h:mm a') : 'Done'})`)

                const pendingToday: string[] = []
                if (!member.isPrayerDone) pendingToday.push(`Prayer (${member.prayerTime})`)
                if (!member.isStudyDone) pendingToday.push(`Study (${member.studyTime})`)

                return (
                  <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 text-base">{member.fullName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                        Joined {member.createdAt ? format(new Date(member.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-gray-400 font-bold uppercase">Prayer</span>
                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">{member.prayerTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5">
                        <span className="text-xs text-gray-400 font-bold uppercase">Study</span>
                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">{member.studyTime}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {pendingToday.length === 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 size={14} /> 100% Completed
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {completedToday.map((act, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 mr-1.5 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {act}
                            </div>
                          ))}
                          {pendingToday.map((act, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mr-1.5 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {act}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gray-100 border border-gray-200 text-gray-900 font-black text-lg shadow-sm">
                        {member.totalAllTime}
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 font-medium">
                    No members found matching your filters.
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
