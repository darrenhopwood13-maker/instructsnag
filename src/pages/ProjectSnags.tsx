import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Snag, SnagProject } from '../lib/types'

const severityColors: Record<string, string> = {
  COSMETIC: 'bg-gray-200 text-gray-700',
  FUNCTIONAL: 'bg-amber-100 text-amber-800',
  STRUCTURAL: 'bg-red-100 text-red-800',
  'LIFE-SAFETY': 'bg-red-600 text-white font-semibold',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-800',
  closed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-800',
}

export default function ProjectSnags() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<SnagProject | null>(null)
  const [snags, setSnags] = useState<Snag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!projectId) return
    supabase.from('snag_projects').select('*').eq('id', projectId).single().then(({ data }) => {
      if (data) setProject(data)
    })
    loadSnags()
  }, [projectId])

  const loadSnags = async () => {
    if (!projectId) return
    const { data } = await supabase
      .from('snags')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (data) setSnags(data)
    setLoading(false)
  }

  const filteredSnags = filter === 'all' ? snags : snags.filter(s => s.status === filter)

  const openCount = snags.filter(s => s.status === 'open' || s.status === 'in-progress').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-1 block">
            ← All Projects
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{project?.name || 'Loading...'}</h1>
          {project?.location && <p className="text-sm text-gray-500">{project.location}</p>}
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}/snag/new`)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <span className="text-lg">📸</span> New Snag
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-gray-500">{snags.length} total</span>
        <span className="text-amber-600 font-medium">{openCount} open</span>
        <span className="text-green-600">{snags.filter(s => s.status === 'closed').length} closed</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'open', 'in-progress', 'closed', 'disputed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading snags...</div>
      ) : filteredSnags.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl">
          <p className="text-gray-400 mb-4">No snags yet</p>
          <button onClick={() => navigate(`/projects/${projectId}/snag/new`)} className="btn-primary text-sm">
            📸 Create your first snag
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSnags.map((snag) => (
            <button
              key={snag.id}
              onClick={() => navigate(`/projects/${projectId}/snag/${snag.id}`)}
              className="w-full glass rounded-xl p-4 text-left hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {snag.photo_url && (
                  <img src={snag.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{snag.snag_title || 'Untitled snag'}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {snag.severity && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColors[snag.severity] || ''}`}>
                        {snag.severity}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[snag.status]}`}>
                      {snag.status}
                    </span>
                    {snag.trade && <span className="text-gray-400">{snag.trade}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(snag.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
