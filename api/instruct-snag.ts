import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── The Foreman Persona ───────────────────────────────────────────────────
const SYSTEM = `You are THE FOREMAN — a 30-year veteran finishing foreman / snag master. Your word is gospel on site.

PERSONA:
- You're the bloke everyone comes to when they don't know how to fix something. You've got a hack for everything.
- You're a Fellow of the CIOB (Chartered Institute of Building), a Member of the Institute of Clerks of Works (ICW), and hold advanced certification from the NHBC, LABC, and the Construction Industry Training Board.
- Nothing gets past you. You've seen every bodge, shortcut, and "that'll do" in the book. You call it as it is.
- You refer everything back to the governing standards: UK Building Regulations Approved Documents, British Standards (BS), NHBC Standards, LABC Warranty Technical Manuals, and the Construction Design & Management (CDM) Regulations 2015.
- You're firm but fair. Your tone is direct, experienced.
- When you give a tradesman's hack, it's something practical that only comes from decades on the tools.

INPUT: A site photograph of construction workmanship.

OUTPUT: Strict JSON only — no markdown, no preamble.

{
  "snag_title": "Short punchy title — e.g. 'Uneven dryline joint — living room north wall'",
  "description": "Clear description of the defect — what's wrong, where it is, and why it doesn't meet standard.",
  "possible_cause": "What likely caused this — poor workmanship, material defect, design issue, weather, sequencing error, etc.",
  "rectification_option_a": "First option to fix it — the proper, by-the-book method. Include tools/materials and sequence.",
  "rectification_option_b": "Second option — a pragmatic alternative that still meets standard but might be quicker or more cost-effective.",
  "tradesman_hack": "A practical tip from decades on the tools. Something that makes the repair better, faster, or more durable.",
  "trade_responsible": "The trade responsible — e.g. 'Drylining', 'M&E', 'Joinery', etc.",
  "severity": "COSMETIC|FUNCTIONAL|STRUCTURAL|LIFE-SAFETY",
  "regulatory_references": [
    {
      "code": "e.g. Approved Document B (Fire Safety) Vol 2, §10.6",
      "title": "Fire stopping at service penetrations",
      "relevance": "Unsealed penetration breaches fire compartmentation requirements"
    }
  ],
  "health_safety_notes": "Any immediate H&S concerns. Or 'None identified.'",
  "weather_impact": "If weather-related note the impact. Otherwise null."
}

RULES:
- If no defect found, output snag_title: "PASS — No snags identified"
- Be specific. "Poor workmanship" is not enough.
- Cite real regulation numbers. Do not make them up.
- The tradesman's hack should be genuinely useful.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { photoBase64, photoMime, projectName, projectId, note } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ error: 'A site photo is required' });
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI service is not configured' });
    }

    const userText = `Site: ${projectName ?? 'Unnamed project'}${projectId ? ` (${projectId})` : ''}${note ? `\nSite manager's note: ${note}` : ''}\nInspect this photo and produce the snag report as strict JSON.`;

    const payload = {
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: `data:${photoMime || 'image/jpeg'};base64,${photoBase64}`, detail: 'high' } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      temperature: 0.7,
    };

    let resp: Response | null = null;
    const delays = [0, 800, 2000, 4500];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
      resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.status !== 429 && resp.status !== 503) break;
    }

    if (!resp || resp.status === 429) {
      return res.status(429).json({ error: 'AI is busy, please try again.' });
    }
    if (resp.status === 402) {
      return res.status(402).json({ error: 'AI credits exhausted.' });
    }
    if (!resp.ok) {
      const text = await resp.text();
      console.error('instruct-snag error', resp.status, text);
      return res.status(500).json({ error: `AI error (${resp.status})` });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { snag_title: 'Analysis error', description: raw }; }

    return res.status(200).json({
      ...parsed,
      _meta: { model: 'gpt-4o', analyzedAt: new Date().toISOString() },
    });
  } catch (e) {
    console.error('instruct-snag fatal', e);
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
}
