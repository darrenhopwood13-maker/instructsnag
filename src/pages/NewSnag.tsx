import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { AiSnagResult } from '../lib/types'

export default function NewSnag() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AiSnagResult | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhoto(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAnalyse = async () => {
    if (!photoFile || !projectId) return
    setAnalyzing(true)
    setError('')
    setResult(null)

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(photoFile)
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Call the Vercel serverless function
      const res = await fetch(
        '/api/instruct-snag',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoBase64: base64,
            photoMime: photoFile.type,
            projectName: '',
            projectId,
            note: note || undefined,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
    setAnalyzing(false)
  }

  const handleSave = async () => {
    if (!result || !projectId || !photoFile) return
    setSaving(true)

    try {
      // Upload photo to storage
      const fileExt = photoFile.name.split('.').pop() || 'jpg'
      const storagePath = `${projectId}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('snag-photos')
        .upload(storagePath, photoFile)
      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('snag-photos')
        .getPublicUrl(storagePath)

      // Save snag to database
      const { error: insertError } = await supabase.from('snags').insert({
        project_id: projectId,
        photo_url: publicUrl,
        photo_storage_path: storagePath,
        snag_title: result.snag_title,
        description: result.description,
        possible_cause: result.possible_cause,
        rectification_a: result.rectification_option_a,
        rectification_b: result.rectification_option_b,
        trade: result.trade_responsible,
        severity: result.severity,
        regulations: result.regulatory_references,
        tradesman_hack: result.tradesman_hack,
        health_safety_notes: result.health_safety_notes,
        weather_impact: result.weather_impact,
        ai_raw_response: result,
      })

      if (insertError) throw insertError

      setSaved(true)
      setTimeout(() => navigate(`/projects/${projectId}`), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save snag')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">✅</span>
        <h2 className="text-xl font-bold mb-2">Snag saved!</h2>
        <p className="text-gray-500">Redirecting to project...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(`/projects/${projectId}`)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
        ← Back to Project
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-8">New Snag</h1>

      {/* Photo upload */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">📸 Site Photo</h2>
        {photo ? (
          <div className="relative">
            <img src={photo} alt="Site photo" className="w-full rounded-lg max-h-96 object-contain bg-gray-100" />
            <button
              onClick={() => { setPhoto(null); setPhotoFile(null); setResult(null) }}
              className="absolute top-2 right-2 bg-gray-900/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-900/80"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center cursor-pointer hover:border-[#e8751a] hover:bg-orange-50/30 transition-colors"
          >
            <span className="text-3xl block mb-2">📷</span>
            <p className="text-sm text-gray-500">Tap to take a photo or upload from gallery</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or HEIC · Max 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Note */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">📝 Site Manager's Note (optional)</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8751a]/20 resize-none"
          rows={3}
          placeholder="Any context for the foreman? Location, trade, specific concern..."
        />
      </div>

      {/* Analyse button */}
      {!result && (
        <button
          onClick={handleAnalyse}
          disabled={!photo || analyzing}
          className="btn-primary w-full text-base py-3"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              The Foreman is inspecting...
            </span>
          ) : (
            '🔍 Analyse with The Foreman'
          )}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">The Foreman's Report</h2>
            {result.severity && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                result.severity === 'COSMETIC' ? 'bg-gray-200 text-gray-700' :
                result.severity === 'FUNCTIONAL' ? 'bg-amber-100 text-amber-800' :
                result.severity === 'STRUCTURAL' ? 'bg-red-100 text-red-800' :
                'bg-red-600 text-white'
              }`}>
                {result.severity}
              </span>
            )}
          </div>

          <div className="glass rounded-xl p-6 space-y-4">
            {result.snag_title && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Snag</p>
                <p className="font-semibold">{result.snag_title}</p>
              </div>
            )}

            {result.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.description}</p>
              </div>
            )}

            {result.possible_cause && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Possible Cause</p>
                <p className="text-sm text-gray-700">{result.possible_cause}</p>
              </div>
            )}

            {result.trade_responsible && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Trade Responsible</p>
                <p className="text-sm font-medium">{result.trade_responsible}</p>
              </div>
            )}

            {result.rectification_option_a && (
              <div className="border-l-4 border-[#e8751a] pl-4">
                <p className="text-xs font-medium text-[#e8751a] uppercase tracking-wider mb-1">Option A — By the book</p>
                <p className="text-sm text-gray-700">{result.rectification_option_a}</p>
              </div>
            )}

            {result.rectification_option_b && (
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Option B — Pragmatic fix</p>
                <p className="text-sm text-gray-700">{result.rectification_option_b}</p>
              </div>
            )}

            {result.tradesman_hack && (
              <div className="bg-[#fdf4e8] rounded-lg p-4 border border-[#e8751a]/20">
                <p className="text-xs font-medium text-[#e8751a] uppercase tracking-wider mb-1">💡 Tradesman's Hack</p>
                <p className="text-sm text-gray-800">{result.tradesman_hack}</p>
              </div>
            )}

            {result.regulatory_references && result.regulatory_references.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Regulatory References</p>
                <div className="space-y-2">
                  {result.regulatory_references.map((ref, i) => (
                    <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{ref.code}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{ref.title}</p>
                      {ref.relevance && <p className="text-gray-500 text-xs mt-0.5">{ref.relevance}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.health_safety_notes && result.health_safety_notes !== 'None identified.' && (
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">⚠️ Health & Safety</p>
                <p className="text-sm text-gray-700">{result.health_safety_notes}</p>
              </div>
            )}

            {result.weather_impact && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">🌤 Weather Impact</p>
                <p className="text-sm text-gray-700">{result.weather_impact}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-3">
              {saving ? 'Saving...' : '✅ Save Snag'}
            </button>
            <button onClick={() => { setResult(null); setPhoto(null); setPhotoFile(null); setNote('') }} className="btn-outline text-sm">
              New Photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
