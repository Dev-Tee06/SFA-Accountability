import Image from 'next/image'
import Link from 'next/link'
import { Download, Apple, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Download SFA App',
  description: 'Get the SFA Accountability app for Android or iPhone.',
}

export default function DownloadPage() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || '/sfa-app.apk'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/SFA.jpg" alt="SFA Logo" width={40} height={40} className="rounded-lg shadow-sm" />
          <span className="font-bold text-xl tracking-tight text-gray-900">SFA Accountability</span>
        </Link>
        <Link href="/login" className="text-gray-500 hover:text-gray-900 font-medium">
          Login
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 py-12 md:py-24">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-red-100 text-sfa-red font-semibold text-sm rounded-full">
              Version 2.0 Available
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              Take accountability wherever you go.
            </h1>
            <p className="text-lg text-gray-500">
              Download the official SFA app to get daily reminders, track your progress, and stay connected with your accountability partners.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href={apkUrl} 
                className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-semibold transition shadow-md"
              >
                <Download size={22} />
                <div className="text-left leading-tight">
                  <div className="text-xs text-gray-300 font-normal">Download for</div>
                  <div>Android APK</div>
                </div>
              </a>
            </div>
            
            <div className="text-sm text-gray-400 mt-4">
              Requires Android 8.0 or later.
            </div>
          </div>

          {/* iPhone Instructions Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Apple size={120} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 mb-6 relative z-10">
              <Apple size={28} />
              Use SFA on iPhone
            </h2>
            
            <ol className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-900">1</div>
                <div>
                  <div className="font-semibold text-gray-900">Open Safari</div>
                  <div className="text-sm text-gray-500">Visit this website in the Safari browser on your iPhone.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-900">2</div>
                <div>
                  <div className="font-semibold text-gray-900">Tap Share</div>
                  <div className="text-sm text-gray-500">Tap the share icon at the bottom of the screen (the square with an arrow pointing up).</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-900">3</div>
                <div>
                  <div className="font-semibold text-gray-900">Add to Home Screen</div>
                  <div className="text-sm text-gray-500">Scroll down and tap "Add to Home Screen", then tap "Add" in the top right.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-sfa-red rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <div className="font-semibold text-sfa-red">Enable Notifications</div>
                  <div className="text-sm text-gray-500">Open the SFA app from your home screen, log in, and enable push notifications!</div>
                </div>
              </li>
            </ol>
          </div>

        </div>
      </main>
    </div>
  )
}
