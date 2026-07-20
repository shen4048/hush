export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const SUPA = 'https://njqobyflbawwkypbvhfs.supabase.co/rest/v1/state'
    const KEY = 'sb_publishable__QXhe9vqEIr5-lZjUXF75w_q-g-c-SK'
    const headers = {
      'apikey': KEY,
      'Authorization': 'Bearer ' + KEY,
      'Content-Type': 'application/json'
    }

    if (request.method === 'POST') {
      const body = await request.json()
      const data = { ...body, updated_at: Date.now() }
      
      await fetch(SUPA + '?id=eq.1', { method: 'DELETE', headers })
      await fetch(SUPA, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: 1, data: JSON.stringify(data) })
      })
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (request.method === 'GET') {
      const r = await fetch(SUPA + '?id=eq.1&select=data', { headers })
      const j = await r.json()
      const state = j[0] ? JSON.parse(j[0].data) : { cmd: 'stop', mode: 0, intensity: 0, updated_at: 0 }
      return new Response(JSON.stringify(state), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('not found', { status: 404, headers: corsHeaders })
  }
}
