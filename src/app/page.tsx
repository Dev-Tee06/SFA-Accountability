import Link from 'next/link'
import Image from 'next/image'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <LoadingOverlay />

      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/SFA.jpg" alt="SFA Logo" width={40} height={40} />
          <span className="font-bold text-xl tracking-tight">SFA</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <a href="#about" className="hover:text-sfa-red transition-colors">About</a>
          <a href="#how-it-works" className="hover:text-sfa-red transition-colors">How It Works</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-sfa-red transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Stay Accountable.<br />Stay Consistent.
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl">
          Build consistency in prayer and Bible study through simple daily accountability.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="bg-sfa-red text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-red-700 transition-colors">
            Get Started
          </Link>
          <Link href="/login" className="border border-gray-200 bg-white text-black px-8 py-3 rounded-md font-semibold text-lg hover:bg-gray-50 transition-colors">
            Login
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-sfa-gray py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">What is SFA?</h2>
          <p className="text-lg text-gray-700">
            SFA is a simple accountability structure that helps members stay consistent in prayer and Bible study by tracking daily commitments and personal progress.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-200 mb-4">01</div>
              <h3 className="font-bold text-lg mb-2">Create an Account</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-200 mb-4">02</div>
              <h3 className="font-bold text-lg mb-2">Set Your Times</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-200 mb-4">03</div>
              <h3 className="font-bold text-lg mb-2">Complete Your Activities</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-200 mb-4">04</div>
              <h3 className="font-bold text-lg mb-2">Track Your Progress</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black text-white py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <h3 className="font-bold text-xl mb-2 text-sfa-red">Prayer</h3>
            <p className="text-gray-400">Track your daily prayer commitment.</p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2 text-sfa-red">Bible Study</h3>
            <p className="text-gray-400">Track your daily Bible study commitment.</p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2 text-sfa-red">Reminders</h3>
            <p className="text-gray-400">Receive reminders at your selected times.</p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2 text-sfa-red">Accountability</h3>
            <p className="text-gray-400">See your daily and weekly progress.</p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-2 text-sfa-red">Leadership</h3>
            <p className="text-gray-400">Allow authorized leadership to monitor group accountability.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Start Your Accountability Journey</h2>
        <Link href="/register" className="bg-sfa-red text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-red-700 transition-colors">
          Create Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/SFA.jpg" alt="SFA Logo" width={30} height={30} />
            <span className="font-bold">SFA Accountability</span>
          </div>
          <p className="text-sm text-gray-500">Simple daily accountability.</p>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/login" className="hover:text-sfa-red transition-colors">Login</Link>
            <Link href="/register" className="hover:text-sfa-red transition-colors">Create Account</Link>
          </div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SFA Accountability. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
