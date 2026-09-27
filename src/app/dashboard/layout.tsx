'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Home, CalendarDays, Clock, User, LogOut, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email === 'babayodetestimony0318@gmail.com') {
          router.replace('/admin')
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') {
          router.replace('/admin')
        }
      }
    }
    checkAdmin()
  }, [router, supabase])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Records', href: '/dashboard/records', icon: CalendarDays },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Clock },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-sfa-gray flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4">
          <Image src="/SFA.jpg" alt="SFA Logo" width={40} height={40} className="rounded-xl shadow-sm" />
          <span className="font-bold text-lg tracking-tight">Accountability</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-sfa-red font-semibold' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active"
                    className="absolute inset-0 bg-red-50 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon size={20} className={isActive ? 'text-sfa-red' : ''} />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-50 m-4">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full text-center text-gray-500 hover:text-sfa-red hover:bg-red-50 rounded-xl transition-all font-medium disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-sfa-red/30 border-t-sfa-red rounded-full animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <Image src="/SFA.jpg" alt="SFA Logo" width={32} height={32} className="rounded-lg shadow-sm" />
            <span className="font-bold tracking-tight text-gray-900">SFA</span>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-gray-500 hover:text-sfa-red transition-colors p-2 rounded-full hover:bg-red-50"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-sfa-red/30 border-t-sfa-red rounded-full animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${
                isActive ? 'text-sfa-red' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon size={22} className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
