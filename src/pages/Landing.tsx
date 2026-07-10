import { Link } from 'react-router-dom'

const features = [
  { emoji: '📸', title: 'Photo Snagging', desc: 'Snap any workmanship issue on site. One photo, instant analysis.' },
  { emoji: '🧠', title: 'AI Foreman Analysis', desc: '30-year veteran finishing foreman in your pocket. Nothing gets past him.' },
  { emoji: '🔧', title: 'Two Rectification Options', desc: 'By-the-book fix + pragmatic alternative. Always compliant.' },
  { emoji: '📜', title: 'Regulatory Citations', desc: 'Building Regs, British Standards, NHBC — every snag referenced.' },
  { emoji: '💡', title: "Tradesman's Hack", desc: 'The kind of practical tip only a grey-beard foreman knows.' },
  { emoji: '📊', title: 'Snag Dashboard', desc: 'Track open, in-progress, closed, and disputed snags across projects.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Nav */}
      <header className="border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-baseline gap-1">
              <span className="text-lg font-semibold tracking-tight">instruct</span>
              <span className="text-lg font-bold text-[#e8751a]">Snag</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="glass-orange rounded-lg px-4 py-2 text-sm font-medium text-gray-800 hover:bg-orange-50 transition-colors">
                Sign in
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 rounded-full bg-[#fdf4e8] text-[#e8751a] text-xs font-medium mb-6">
            AI · Snagging & Quality
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            The Foreman's
            <span className="block text-[#e8751a]"> Eye</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Snap a photo of any subcontractor's work. The AI foreman — a 30-year veteran finishing foreman — tells you what's wrong, why it happened, how to fix it, and what regulation it breaches.
          </p>
          <div className="flex gap-4">
            <Link to="/auth" className="btn-primary text-base">
              Start snagging →
            </Link>
            <Link to="/auth" className="btn-outline text-base">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl p-6 hover:shadow-md transition-shadow">
              <span className="text-2xl mb-3 block">{f.emoji}</span>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 py-8 text-center text-sm text-gray-400">
        instructSnag — part of the instruct ecosystem
      </footer>
    </div>
  )
}
