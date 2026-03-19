// schema-drift-proxy — Cloudflare Worker
// Proxies requests to Groq API with CORS handling
// Deploy via Cloudflare Dashboard > Workers > Edit Code > Paste > Deploy

const ALLOWED_ORIGINS = [
  'https://neha-rani-r.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      // Validate model — only allow Groq models
      const allowedModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
      if (!allowedModels.includes(body.model)) {
        return new Response(
          JSON.stringify({ error: 'Model not allowed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model,
          messages: body.messages,
          temperature: body.temperature ?? 0.1,
          max_tokens: body.max_tokens ?? 4096,
        }),
      });

      const data = await groqResponse.json();

      if (!groqResponse.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message || 'Groq API error' }),
          { status: groqResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Worker error: ' + err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
