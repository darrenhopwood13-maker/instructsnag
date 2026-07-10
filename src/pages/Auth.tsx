import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Invalid email or password.' : err.message)
    } else {
      navigate('/projects')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold tracking-tight">instruct</span>
            <span className="text-lg font-bold text-[#e8751a]">Snag</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">Secure Sign In</span>
          </div>
        </nav>
      </div>

      <div className="max-w-md mx-auto px-4 pt-24">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Enter the portal</h2>
        <p className="text-sm text-gray-500 mb-8">Sign in with your workspace credentials.</p>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20 focus:border-[#e8751a]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20 focus:border-[#e8751a]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          7-day free trial · No card · <a href="mailto:info@instructsnag.com" className="text-[#e8751a] underline">info@instructsnag.com</a>
        </p>
      </div>
    </div>
  )
}
