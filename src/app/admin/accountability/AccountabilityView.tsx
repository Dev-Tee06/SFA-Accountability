'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { Download, Search, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { AccountabilityMember, AccountabilityRecord } from './page'

type AccountabilityViewProps = {
  members: AccountabilityMember[]
  records: AccountabilityRecord[]
}

export default function AccountabilityView({ members, records }: AccountabilityViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All')

  // Merge records for the selected date
  const mergedData = useMemo(() => {
    const dataMap = new Map<string, any>()
    
    // Initialize map with all members
    members.forEach(m => {
      dataMap.set(m.id, {
        member: m,
        prayer: null,
        study: null
      })
    })

    // Populate records for the selected date
    const dateRecords = records.filter(r => r.date === dateFilter)
    
    dateRecords.forEach(r => {
      const entry = dataMap.get(r.userId)
      if (entry) {
        if (r.type === 'Prayer') entry.prayer = r
        if (r.type === 'Bible Study') entry.study = r
      }
    })

    return Array.from(dataMap.values())
  }, [members, records, dateFilter])

  // Filter merged data
  const filteredData = mergedData.filter((data) => {
    const matchesSearch = 
      data.member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.member.email.toLowerCase().includes(searchTerm.toLowerCase())

    const isPrayerDone = data.prayer?.status === 'Completed'
    const isStudyDone = data.study?.status === 'Completed'
    const isFullyDone = isPrayerDone && isStudyDone

    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Completed' && isFullyDone) ||
      (statusFilter === 'Pending' && !isFullyDone)

    return matchesSearch && matchesStatus
  })

  // Calculate stats for the selected date
  const fullyCompletedCount = mergedData.filter(d => d.prayer?.status === 'Completed' && d.study?.status === 'Completed').length
  const pendingCount = mergedData.length - fullyCompletedCount
  const totalPrayerDone = mergedData.filter(d => d.prayer?.status === 'Completed').length
  const totalStudyDone = mergedData.filter(d => d.study?.status === 'Completed').length

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No records available to export.')
      return
    }

    const headers = [
      'Date',
      'Member Name',
      'Member Email',
      'Prayer Status',
      'Prayer Completed At',
      'Bible Study Status',
      'Bible Study Completed At'
    ]

    const csvRows = filteredData.map(d => {
      const pDone = d.prayer?.status === 'Completed'
      const sDone = d.study?.status === 'Completed'
      
      return [
        `"${dateFilter}"`,
        `"${d.member.fullName.replace(/"/g, '""')}"`,
        `"${d.member.email.replace(/"/g, '""')}"`,
        `"${pDone ? 'Completed' : 'Pending'}"`,
        `"${d.prayer?.completedAt ? format(new Date(d.prayer.completedAt), 'h:mm a') : 'N/A'}"`,
        `"${sDone ? 'Completed' : 'Pending'}"`,
        `"${d.study?.completedAt ? format(new Date(d.study.completedAt), 'h:mm a') : 'N/A'}"`
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SFA_Accountability_${dateFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Pre-defined quick dates
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

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
              placeholder="Search by member name or email..."
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
            <option value="Completed">Fully Completed</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Date Quick Select */}
          <select
            value={dateFilter === todayStr ? 'today' : dateFilter === yesterdayStr ? 'yesterday' : 'custom'}
            onChange={(e) => {
              if (e.target.value === 'today') setDateFilter(todayStr)
              else if (e.target.value === 'yesterday') setDateFilter(yesterdayStr)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-black transition-colors"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="custom">Custom Date...</option>
          </select>

          {/* Custom Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              max={todayStr}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg flex-shrink-0"
        >
          <Download size={16} />
          Export CSV ({filteredData.length})
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Date</span>
          <div className="text-xl md:text-2xl font-black text-gray-900 mt-1 truncate">
            {format(new Date(dateFilter), 'MMM d')}
          </div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Fully Completed</span>
          <div className="text-xl md:text-2xl font-black text-green-600 mt-1 flex items-center gap-2">
            {fullyCompletedCount} <span className="text-xs font-semibold text-gray-400">/ {mergedData.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Prayer Done</span>
          <div className="text-xl md:text-2xl font-black text-blue-600 mt-1">{totalPrayerDone}</div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Study Done</span>
          <div className="text-xl md:text-2xl font-black text-purple-600 mt-1">{totalStudyDone}</div>
        </div>
      </div>

      {/* Accountability Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Member Details</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Prayer Status</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Bible Study Status</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map(({ member, prayer, study }) => {
                const isPrayerDone = prayer?.status === 'Completed'
                const isStudyDone = study?.status === 'Completed'
                const isFullyDone = isPrayerDone && isStudyDone

                return (
                  <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 text-base">{member.fullName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="p-4">
                      {isPrayerDone ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1 ml-1">
                            {prayer?.completedAt ? format(new Date(prayer.completedAt), 'h:mm a') : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          <AlertCircle size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isStudyDone ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1 ml-1">
                            {study?.completedAt ? format(new Date(study.completedAt), 'h:mm a') : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          <AlertCircle size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isFullyDone ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200 shadow-sm">
                          <CheckCircle2 size={20} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200 shadow-sm">
                          <AlertCircle size={20} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 font-medium">
                    No accountability records found matching your filters.
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
