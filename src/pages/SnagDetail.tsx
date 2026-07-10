import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Snag } from '../lib/types'

export default function SnagDetail() {
  const { projectId, snagId } = useParams()
  const navigate = useNavigate()
  const [snag, setSnag] = useState<Snag | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<any[]>([])

  useEffect(() => {
    if (!snagId) return
    supabase.from('snags').select('*').eq('id', snagId).single().then(({ data }) => {
      if (data) {
        setSnag(data)
        setStatus(data.status)
      }
      setLoading(false)
    })
    supabase.from('snag_comments').select('*').eq('snag_id', snagId).order('created_at').then(({ data }) => {
      if (data) setComments(data)
    })
  }, [snagId])

  const updateStatus = async (newStatus: string) => {
    if (!snagId) return
    setStatus(newStatus)
    await supabase.from('snags').update({
      status: newStatus,
      closed_at: newStatus === 'closed' ? new Date().toISOString() : null,
    }).eq('id', snagId)
  }

  const addComment = async () => {
    if (!snagId || !comment.trim()) return
    const { data } = await supabase.from('snag_comments').insert({
      snag_id: snagId,
      body: comment,
    }).select().single()
    if (data) {
      setComments([...comments, data])
      setComment('')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>
  if (!snag) return <div className="text-center py-12 text-gray-400">Snag not found</div>

  const severityColors: Record<string, string> = {
    COSMETIC: 'bg-gray-200 text-gray-700', FUNCTIONAL: 'bg-amber-100 text-amber-800',
    STRUCTURAL: 'bg-red-100 text-red-800', 'LIFE-SAFETY': 'bg-red-600 text-white',
  }

  return (
    <div>
      <button onClick={() => navigate(`/projects/${projectId}`)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
        ← Back to Project
      </button>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold mb-2">{snag.snag_title || 'Snag Report'}</h1>
              <div className="flex items-center gap-2">
                {snag.severity && (
                  <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${severityColors[snag.severity] || ''}`}>
                    {snag.severity}
                  </span>
                )}
                {snag.trade && <span className="text-xs text-gray-500">{snag.trade}</span>}
                <span className="text-xs text-gray-400">
                  {new Date(snag.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            {/* Status changer */}
            <select
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 bg-white"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          {snag.photo_url && (
            <img src={snag.photo_url} alt="Snag photo" className="w-full rounded-lg max-h-96 object-contain bg-gray-100 mb-4" />
          )}
        </div>

        {/* Report body */}
        <div className="glass rounded-xl p-6 space-y-5">
          {snag.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-700">{snag.description}</p>
            </div>
          )}
          {snag.possible_cause && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Possible Cause</p>
              <p className="text-sm text-gray-700">{snag.possible_cause}</p>
            </div>
          )}
          {snag.rectification_a && (
            <div className="border-l-4 border-[#e8751a] pl-4">
              <p className="text-xs font-medium text-[#e8751a] uppercase tracking-wider mb-1">Option A — By the book</p>
              <p className="text-sm text-gray-700">{snag.rectification_a}</p>
            </div>
          )}
          {snag.rectification_b && (
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Option B — Pragmatic fix</p>
              <p className="text-sm text-gray-700">{snag.rectification_b}</p>
            </div>
          )}
          {snag.tradesman_hack && (
            <div className="bg-[#fdf4e8] rounded-lg p-4 border border-[#e8751a]/20">
              <p className="text-xs font-medium text-[#e8751a] uppercase tracking-wider mb-1">💡 Tradesman's Hack</p>
              <p className="text-sm text-gray-800">{snag.tradesman_hack}</p>
            </div>
          )}
          {snag.regulations && snag.regulations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Regulatory References</p>
              <div className="space-y-2">
                {(snag.regulations as any[]).map((ref, i) => (
                  <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">{ref.code}</p>
                    <p className="text-gray-600 text-xs">{ref.title}</p>
                    {ref.relevance && <p className="text-gray-500 text-xs mt-0.5">{ref.relevance}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {snag.health_safety_notes && snag.health_safety_notes !== 'None identified.' && (
            <div>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">⚠️ Health & Safety</p>
              <p className="text-sm text-gray-700">{snag.health_safety_notes}</p>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="glass rounded-xl p-6 mt-6">
          <h2 className="font-semibold mb-4">Site Manager's Log</h2>
          {comments.length === 0 && <p className="text-sm text-gray-400 mb-4">No comments yet.</p>}
          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="text-sm bg-gray-50 rounded-lg p-3">
                <p>{c.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20"
              placeholder="Add a note to the log..."
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <button onClick={addComment} disabled={!comment.trim()} className="btn-primary text-sm py-2">Post</button>
          </div>
        </div>
      </div>
    </div>
  )
}
