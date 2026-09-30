'use client'

import { useState, useEffect } from 'react'

export default function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState('Hello')

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting('Good Morning')
      else if (hour < 18) setGreeting('Good Afternoon')
      else setGreeting('Good Evening')
    }
    
    updateGreeting()
    
    // Optional: Update periodically in case they leave the tab open across a boundary
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight flex flex-col md:block">
      <span>{greeting},</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sfa-red to-red-600 truncate">
        {' '}{firstName}
      </span>
    </h1>
  )
}
