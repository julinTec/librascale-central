import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    if (!isUuid(token)) {
      return new Response(JSON.stringify({ state: 'invalid' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('quote_intakes')
      .select('status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ state: 'invalid' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = new Date();
    const expired = new Date(data.expires_at) < now;

    if (expired) return new Response(JSON.stringify({ state: 'expired' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (data.status === 'recebido' || data.status === 'convertido') return new Response(JSON.stringify({ state: 'submitted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (data.status === 'descartado') return new Response(JSON.stringify({ state: 'invalid' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ state: 'ready' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ state: 'invalid' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
