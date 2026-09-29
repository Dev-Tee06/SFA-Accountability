'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Activity, BarChart3, LogOut, Menu, X, BellRing } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Accountability', href: '/admin/accountability', icon: Activity },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Broadcast', href: '/admin/notifications', icon: BellRing },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sfa-red text-white flex items-center justify-center font-bold rounded">
            SFA
          </div>
          <span className="font-bold text-white">Admin</span>
        </div>
        <button className="md:hidden text-gray-400" onClick={() => setMobileMenuOpen(false)}>
          <X size={24} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-sfa-red text-white font-semibold' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold">
          <div className="w-6 h-6 bg-sfa-red text-white flex items-center justify-center rounded text-xs">
            SFA
          </div>
          Admin
        </div>
        <button onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <aside className="flex flex-col w-64 bg-gray-900 text-white h-full max-w-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
