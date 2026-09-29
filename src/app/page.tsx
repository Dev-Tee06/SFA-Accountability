import Link from 'next/link'
import Image from 'next/image'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-sfa-red selection:text-white overflow-hidden relative">
      <LoadingOverlay />

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sfa-red/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-red-900/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-sfa-red/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between p-6 md:px-12 backdrop-blur-xl bg-black/40 border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/SFA.jpg" alt="SFA Logo" width={44} height={44} className="rounded-xl shadow-lg ring-1 ring-white/10" />
          <span className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">SFA</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold tracking-wide">
          <a href="#about" className="text-gray-400 hover:text-white transition-colors duration-300">About</a>
          <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-300">How It Works</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-300">
            Sign In
          </Link>
          <Link href="/register" className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Join Now
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 max-w-5xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-sfa-red animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-300 tracking-wide">SFA Accountability Structure V2.0</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
          Stay Accountable.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sfa-red via-red-500 to-orange-500">
            Stay Consistent.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
          Build unbreakable habits in prayer and Bible study through our beautifully designed daily accountability platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="group relative bg-sfa-red text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-red-600 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:-translate-y-1 w-full sm:w-auto overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <span className="relative z-10">Start Your Journey</span>
          </Link>
          <Link href="/download" className="bg-white/5 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 hover:-translate-y-1">
            📱 Get the App
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="about" className="py-24 px-6 relative z-10 border-t border-white/5 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need.</h2>
            <p className="text-gray-400 text-lg">Designed to keep you focused on what truly matters.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Prayer Tracking', desc: 'Log your daily prayer commitments with beautiful, intuitive cards.', icon: '🙏' },
              { title: 'Bible Study', desc: 'Keep track of chapters read and insights gained every single day.', icon: '📖' },
              { title: 'Smart Reminders', desc: 'Receive custom audio push notifications right when you need them.', icon: '🔔' },
              { title: 'Streak System', desc: 'Build momentum. Watch your daily streaks grow as you stay consistent.', icon: '🔥' },
              { title: 'Rich Analytics', desc: 'View your weekly score and monthly hours dedicated to your faith.', icon: '📊' },
              { title: 'Optional Tasks', desc: 'Log evangelism and personal milestones without affecting your core score.', icon: '✨' },
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{feature.icon}</div>
                <h3 className="font-bold text-xl mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/SFA.jpg" alt="SFA Logo" width={32} height={32} className="rounded-lg grayscale opacity-70" />
            <span className="font-bold text-gray-400">SFA Accountability</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/download" className="text-gray-500 hover:text-white transition-colors">Download</Link>
            <Link href="/login" className="text-gray-500 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="text-gray-500 hover:text-white transition-colors">Join</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
