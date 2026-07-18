import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const body = req.body
    await redis.set('toy:state', JSON.stringify({
      ...body,
      updated_at: Date.now()
    }))
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'GET') {
    const state = await redis.get('toy:state')
    return res.status(200).json(state || { cmd: 'stop', mode: 0, intensity: 0, updated_at: 0 })
  }
}
