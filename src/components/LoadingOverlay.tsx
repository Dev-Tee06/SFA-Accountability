'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingOverlay() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Hide overlay after 6 seconds
    const timer = setTimeout(() => {
      setShow(false)
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white heartbeat">
      <Image
        src="/SFA.jpg"
        alt="SFA Logo"
        width={150}
        height={150}
        priority
      />
    </div>
  )
}
