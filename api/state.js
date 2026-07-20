export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (req.method === 'POST') {
    const body = req.body
    const data = JSON.stringify({ ...body, updated_at: Date.now() })
    const r = await fetch(`${url}/set/toy:state/${encodeURIComponent(data)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json()
    return res.status(200).json({ ok: true, redis: j })
  }

  if (req.method === 'GET') {
    const r = await fetch(`${url}/get/toy:state`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await r.json()
    const state = json.result ? JSON.parse(decodeURIComponent(json.result)) : { cmd: 'stop', mode: 0, intensity: 0, updated_at: 0 }
    return res.status(200).json(state)
  }
}

