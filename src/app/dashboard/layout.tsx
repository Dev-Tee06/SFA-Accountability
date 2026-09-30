'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Home, CalendarDays, Clock, User, LogOut, Trophy, Bell, BookOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null)

  useEffect(() => {
    async function checkAdminAndProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email === 'babayodetestimony0318@gmail.com') {
          router.replace('/admin')
          return
        }
        const { data: pData } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (pData) {
          if (pData.role === 'admin') {
            router.replace('/admin')
          } else {
            setProfile({
              full_name: pData.full_name || user.user_metadata?.full_name || 'Member',
              avatar_url: pData.avatar_url
            })
          }
        }
      }
    }
    checkAdminAndProfile()

    // Listen for real-time updates to the profile (like avatar upload/delete)
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...customEvent.detail
        };
      });
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
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
    { name: 'Books', href: '/dashboard/books', icon: BookOpen },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-sfa-gray dark:bg-[#0a0a0a] flex flex-col md:flex-row pb-20 md:pb-0 transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white dark:bg-black border-r border-gray-100 dark:border-white/10 shadow-sm z-10 sticky top-0 h-screen shrink-0 transition-colors duration-300">
        <div className="p-4 border-b border-gray-50 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/SFA.jpg" alt="SFA Logo" width={36} height={36} className="rounded-xl shadow-sm dark:ring-1 dark:ring-white/10 shrink-0" />
            <span className="font-bold text-[17px] tracking-tight dark:text-white truncate">Accountability</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link href="/dashboard/notifications" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full relative shrink-0">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-sfa-red rounded-full ring-2 ring-white"></span>
            </Link>
            <Link href="/dashboard/profile" className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:ring-2 hover:ring-sfa-red transition-all shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </Link>
          </div>
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
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active"
                    className="absolute inset-0 bg-red-50 dark:bg-sfa-red/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon size={20} className={isActive ? 'text-sfa-red' : ''} />
                  <span className={isActive ? 'dark:text-white' : ''}>{item.name}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-50 dark:border-white/10 m-4">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full text-center text-gray-500 hover:text-sfa-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-medium disabled:opacity-50"
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
        <div className="md:hidden sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 p-3 flex justify-between items-center z-40 shadow-sm overflow-hidden transition-colors duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/SFA.jpg" alt="SFA Logo" width={28} height={28} className="rounded-md shadow-sm shrink-0 dark:ring-1 dark:ring-white/10" />
            <span className="font-bold tracking-tight text-gray-900 dark:text-white truncate">SFA</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-sfa-red dark:hover:text-sfa-red transition-colors p-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 relative shrink-0"
              title="Logout"
            >
              {isLoggingOut ? (
                <div className="w-5 h-5 border-2 border-sfa-red/30 border-t-sfa-red rounded-full animate-spin" />
              ) : (
                <LogOut size={20} />
              )}
            </button>
            <ThemeToggle />
            <Link href="/dashboard/notifications" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 relative shrink-0">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-sfa-red rounded-full ring-2 ring-white"></span>
            </Link>
            <Link href="/dashboard/profile" className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:ring-2 hover:ring-sfa-red transition-all shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </Link>
          </div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 flex justify-between px-2 py-1 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] transition-colors duration-300 overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center p-1.5 rounded-xl transition-colors ${
                isActive ? 'text-sfa-red' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <item.icon size={20} className={`mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[9px] font-medium text-center leading-tight truncate w-full px-0.5 ${isActive ? 'font-bold dark:text-white' : ''}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
