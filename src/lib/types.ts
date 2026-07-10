export interface SnagProject {
  id: string
  name: string
  location: string | null
  created_by: string
  created_at: string
}

export interface Snag {
  id: string
  project_id: string
  photo_url: string | null
  photo_storage_path: string | null
  snag_title: string | null
  description: string | null
  possible_cause: string | null
  rectification_a: string | null
  rectification_b: string | null
  trade: string | null
  severity: 'COSMETIC' | 'FUNCTIONAL' | 'STRUCTURAL' | 'LIFE-SAFETY' | null
  regulations: RegulatoryReference[] | null
  tradesman_hack: string | null
  health_safety_notes: string | null
  weather_impact: string | null
  ai_raw_response: any
  status: 'open' | 'in-progress' | 'closed' | 'disputed'
  created_by: string
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface RegulatoryReference {
  code: string
  title: string
  relevance: string
}

export interface AiSnagResult {
  snag_title: string
  description: string
  possible_cause: string
  rectification_option_a: string
  rectification_option_b: string
  tradesman_hack: string
  trade_responsible: string
  severity: string | null
  regulatory_references: RegulatoryReference[]
  health_safety_notes: string
  weather_impact: string | null
  _meta?: { model: string; analyzedAt: string }
}
