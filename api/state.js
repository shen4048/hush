const SUPABASE_URL = 'https://njqobyflbawwkypbvhfs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__QXhe9vqEIr5-lZjUXF75w_q-g-c-SK'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  if (req.method === 'POST') {
    const body = req.body
    const data = { ...body, updated_at: Date.now() }
    
    // 先删旧数据，再插入新数据
    await fetch(`${SUPABASE_URL}/rest/v1/state?id=eq.1`, {
      method: 'DELETE',
      headers
    })
    
    const r = await fetch(`${SUPABASE_URL}/rest/v1/state`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 1, data: JSON.stringify(data) })
    })
    const j = await r.json()
    return res.status(200).json({ ok: true, result: j })
  }

  if (req.method === 'GET') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/state?id=eq.1&select=data`, {
      headers
    })
    const j = await r.json()
    const state = j[0] ? JSON.parse(j[0].data) : { cmd: 'stop', mode: 0, intensity: 0, updated_at: 0 }
    return res.status(200).json(state)
  }
}

