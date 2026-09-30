'use client'

import { useState, useEffect } from 'react'

interface TimePickerProps {
  value: string // Format: "HH:mm" (24-hour)
  onChange: (value: string) => void
  id?: string
}

export default function TimePicker({ value, onChange, id }: TimePickerProps) {
  // Parse initial 24-hour value into 12-hour components
  const getInitialState = () => {
    if (!value) return { hour: '12', minute: '00', period: 'AM' }
    const [h, m] = value.split(':')
    const hourNum = parseInt(h, 10)
    
    let period = 'AM'
    let hour12 = hourNum
    
    if (hourNum >= 12) {
      period = 'PM'
      if (hourNum > 12) hour12 = hourNum - 12
    }
    if (hourNum === 0) {
      hour12 = 12
    }
    
    return {
      hour: hour12.toString(),
      minute: m || '00',
      period
    }
  }

  const [time, setTime] = useState(getInitialState())

  useEffect(() => {
    // Only update internal state if external value completely diverges to prevent focus loss
    const currentState = getInitialState()
    if (!value) {
      setTime(currentState)
    }
  }, [value])

  const updateTime = (newTime: { hour: string, minute: string, period: string }) => {
    setTime(newTime)
    
    // Convert back to 24-hour format for the onChange handler
    let hour24 = parseInt(newTime.hour, 10)
    if (newTime.period === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (newTime.period === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    
    const h = hour24.toString().padStart(2, '0')
    const m = newTime.minute.padStart(2, '0')
    onChange(`${h}:${m}`)
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTime({ ...time, hour: e.target.value })
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTime({ ...time, minute: e.target.value })
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTime({ ...time, period: e.target.value })
  }

  // Generate options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  return (
    <div className="flex items-center gap-2" id={id}>
      <div className="relative">
        <select
          value={time.hour}
          onChange={handleHourChange}
          className="appearance-none bg-white dark:bg-black border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-md py-2.5 pl-4 pr-8 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg font-medium shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          {hours.map(h => (
            <option key={h} value={h} className="dark:bg-black dark:text-white">{h}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-white">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
      
      <span className="text-xl font-bold text-gray-400 dark:text-white">:</span>
      
      <div className="relative">
        <select
          value={time.minute}
          onChange={handleMinuteChange}
          className="appearance-none bg-white dark:bg-black border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-md py-2.5 pl-4 pr-8 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg font-medium shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          {minutes.map(m => (
            <option key={m} value={m} className="dark:bg-black dark:text-white">{m}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-white">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
      
      <div className="relative ml-2">
        <select
          value={time.period}
          onChange={handlePeriodChange}
          className="appearance-none bg-white dark:bg-black border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-md py-2.5 pl-4 pr-8 outline-none focus:border-sfa-red focus:ring-1 focus:ring-sfa-red text-lg font-medium shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          <option value="AM" className="dark:bg-black dark:text-white">AM</option>
          <option value="PM" className="dark:bg-black dark:text-white">PM</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-white">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  )
}
