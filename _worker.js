export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user');

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/state') {
      if (!userId) {
        return new Response('Missing user parameter', { status: 400, headers: corsHeaders });
      }

      if (request.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT state FROM user_state WHERE user_id = ?'
        ).bind(userId).first();

        if (!row) {
          return new Response(JSON.stringify({ state: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ state: row.state }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const stateJson = JSON.stringify(body.state);
        const updatedAt = Date.now();

        await env.DB.prepare(
          `INSERT INTO user_state (user_id, state, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET state = ?, updated_at = ?`
        ).bind(userId, stateJson, updatedAt, stateJson, updatedAt).run();

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // If it's not an API request, serve your index.html file
    return env.ASSETS.fetch(request);
  },
};
