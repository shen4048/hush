export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPA = 'https://njqobyflbawwkypbvhfs.supabase.co/rest/v1/state';
  const KEY = 'sb_publishable__QXhe9vqEIr5-lZjUXF75w_q-g-c-SK';
  const sh = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('event: endpoint\ndata: /api/mcp\n\n');
    const t = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => clearInterval(t));
    return;
  }

  if (req.method === 'POST') {
    const body = req.body;
    const id = body.id;

    if (body.method === 'initialize') {
      return res.json({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:'hush', version:'1.0' } } });
    }

    if (body.method === 'notifications/initialized') return res.status(200).end();

    if (body.method === 'tools/list') {
      return res.json({ jsonrpc:'2.0', id, result:{ tools:[
        { name:'toy_set', description:'开启玩具吮吸', inputSchema:{ type:'object', properties:{ intensity:{ type:'number', description:'强度1-5' } }, required:['intensity'] } },
        { name:'toy_stop', description:'停止玩具', inputSchema:{ type:'object', properties:{} } }
      ]}});
    }

    if (body.method === 'tools/call') {
      const name = body.params.name;
      const args = body.params.arguments || {};
      let data;
      if (name === 'toy_set') {
        data = { cmd:'set', mode:1, intensity: args.intensity||3, updated_at: Date.now() };
      } else {
        data = { cmd:'stop', mode:0, intensity:0, updated_at: Date.now() };
      }
      await fetch(SUPA+'?id=eq.1', { method:'DELETE', headers:sh });
      await fetch(SUPA, { method:'POST', headers:sh, body: JSON.stringify({ id:1, data: JSON.stringify(data) }) });
      return res.json({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text:'执行成功: '+name }] } });
    }

    return res.json({ jsonrpc:'2.0', id, error:{ code:-32601, message:'not found' } });
  }
}
