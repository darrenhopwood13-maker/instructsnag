import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { SnagProject } from '../lib/types'

export default function Projects() {
  const [projects, setProjects] = useState<SnagProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const loadProjects = async () => {
    const { data } = await supabase
      .from('snag_projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  useEffect(() => { loadProjects() }, [])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await supabase
      .from('snag_projects')
      .insert({ name, location: location || null })
      .select()
      .single()
    if (data) {
      setShowNew(false)
      setName('')
      setLocation('')
      navigate(`/projects/${data.id}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Portfolio</p>
          <h1 className="text-2xl font-bold tracking-tight">Active Projects</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary text-sm">
          + New Project
        </button>
      </div>

      {showNew && (
        <form onSubmit={createProject} className="glass rounded-xl p-6 mb-8 max-w-lg">
          <h3 className="font-semibold mb-4">New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20"
                placeholder="e.g. 26 Stanley Road"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20"
                placeholder="e.g. SW19 8RF"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm">Create Project</button>
              <button type="button" onClick={() => setShowNew(false)} className="btn-outline text-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No projects yet</p>
          <button onClick={() => setShowNew(true)} className="btn-primary text-sm">Create your first project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="glass rounded-xl p-6 text-left hover:shadow-md transition-all cursor-pointer"
            >
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              {p.location && <p className="text-sm text-gray-500">{p.location}</p>}
              <p className="text-xs text-gray-400 mt-3">
                Created {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
