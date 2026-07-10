import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="sticky top-0 z-50 glass border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <Link to="/projects" className="flex items-baseline gap-1">
              <span className="text-lg font-semibold tracking-tight">instruct</span>
              <span className="text-lg font-bold text-[#e8751a]">Snag</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/projects" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Projects
              </Link>
              <button onClick={handleSignOut} className="btn-outline text-sm py-1.5 px-3">
                Sign out
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
