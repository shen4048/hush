const CLIENT_ID = 'Ov23liS91WQniZq8oU1b';
const CLIENT_SECRET = '896970953d0a2ef5ac8bd26250e92a73d4edd9d4';
const REDIRECT_URI = 'https://hush-shenzhishu12-3368s-projects.vercel.app/api/mcp/callback';

const SUPA = 'https://njqobyflbawwkypbvhfs.supabase.co/rest/v1/state';
const KEY = 'sb_publishable__QXhe9vqEIr5-lZjUXF75w_q-g-c-SK';
const sh = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // OAuth metadata
  if (path === '/.well-known/oauth-authorization-server') {
    return res.json({
      issuer: `https://${req.headers.host}`,
      authorization_endpoint: `https://${req.headers.host}/api/mcp/authorize`,
      token_endpoint: `https://${req.headers.host}/api/mcp/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
    });
  }

  // Authorization redirect to GitHub
  if (path === '/api/mcp/authorize') {
    const state = url.searchParams.get('state') || '';
    const codeChallenge = url.searchParams.get('code_challenge') || '';
    const ghUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state + '|' + codeChallenge)}&scope=read:user`;
    res.setHeader('Location', ghUrl);
    return res.status(302).end();
  }

  // OAuth callback from GitHub
  if (path === '/api/mcp/callback') {
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state') || '';
    const [originalState] = stateParam.split('|');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: REDIRECT_URI })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const redirectBack = url.searchParams.get('redirect_uri') || `https://claude.ai`;
    res.setHeader('Location', `${redirectBack}?code=${accessToken}&state=${originalState}`);
    return res.status(302).end();
  }

  // Token exchange
  if (path === '/api/mcp/token') {
    const body = req.body;
    return res.json({
      access_token: body.code || 'dummy_token',
      token_type: 'bearer',
      expires_in: 86400
    });
  }

  // MCP SSE
  if (req.method === 'GET' && path === '/api/mcp') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: endpoint\ndata: /api/mcp\n\n`);
    const t = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => clearInterval(t));
    return;
  }

  // MCP POST
  if (req.method === 'POST' && path === '/api/mcp') {
    const body = req.body;
    const id = body.id;

    if (body.method === 'initialize') {
      return res.json({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:'hush', version:'1.0' } } });
    }
    if (body.method === 'notifications/initialized') return res.status(200).end();
    if (body.method === 'tools/list') {
      return res.json({ jsonrpc:'2.0', id, result:{ tools:[
        { name:'toy_set', description:'开启玩具吮吸模式', inputSchema:{ type:'object', properties:{ intensity:{ type:'number', description:'强度1-5' } }, required:['intensity'] } },
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

  return res.status(404).json({ error: 'not found' });
}
