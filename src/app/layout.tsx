import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'] })


export const viewport: Viewport = {
  themeColor: '#dc2626',
}

export const metadata: Metadata = {
  title: 'SFA Accountability Structure',
  description: 'Build consistency in prayer and Bible study through simple daily accountability.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SFA Accountability',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={manrope.className}>{children}</body>
    </html>
  )
}
