import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const VALID_SERVICE_TYPES = ['interprete_libras','audiodescritor','consultor','locutor','assistente','outro'];
const VALID_MODALITIES = ['presencial','remoto','hibrido'];

const rateLimit = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
function rateLimited(token: string) {
  const now = Date.now();
  const arr = (rateLimit.get(token) || []).filter(t => now - t < RATE_WINDOW_MS);
  arr.push(now);
  rateLimit.set(token, arr);
  return arr.length > RATE_MAX;
}

const trim = (v: any, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    const { token, payload } = body || {};

    if (!isUuid(token || '')) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (rateLimited(token)) {
      return new Response(JSON.stringify({ error: 'Muitas tentativas. Aguarde um instante.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Payload inválido.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // Honeypot
    if (payload.website && String(payload.website).trim() !== '') {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const requester_name = trim(payload.requester_name, 200);
    const requester_email = trim(payload.requester_email, 200);
    const requester_phone = trim(payload.requester_phone, 50);
    const company_name = trim(payload.company_name, 200);
    const event_name = trim(payload.event_name, 250);
    const modality = trim(payload.modality, 30);
    const venue = trim(payload.venue, 500);
    const description = trim(payload.description, 4000);
    const observations = trim(payload.observations, 4000);
    const referral_source = trim(payload.referral_source, 200);
    const start_date = payload.start_date ? String(payload.start_date).slice(0, 10) : null;
    const end_date = payload.end_date ? String(payload.end_date).slice(0, 10) : null;
    const sessions_count = Math.max(1, Math.min(999, Number(payload.sessions_count) || 1));
    let service_types: string[] = Array.isArray(payload.service_types) ? payload.service_types.filter((s: any) => VALID_SERVICE_TYPES.includes(s)) : [];

    const errors: string[] = [];
    if (!requester_name) errors.push('Nome é obrigatório.');
    if (!isEmail(requester_email)) errors.push('E-mail inválido.');
    if (!requester_phone) errors.push('Telefone é obrigatório.');
    if (!event_name) errors.push('Nome do evento é obrigatório.');
    if (!VALID_MODALITIES.includes(modality)) errors.push('Modalidade inválida.');
    if (service_types.length === 0) errors.push('Selecione ao menos um tipo de serviço.');
    if (!start_date) errors.push('Data de início é obrigatória.');
    if ((modality === 'presencial' || modality === 'hibrido') && !venue) errors.push('Local é obrigatório para eventos presenciais ou híbridos.');
    if (start_date && end_date && end_date < start_date) errors.push('Data fim não pode ser anterior à data de início.');

    if (errors.length) {
      return new Response(JSON.stringify({ error: errors.join(' ') }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: intake, error: fetchErr } = await supabase
      .from('quote_intakes')
      .select('id, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (fetchErr || !intake) {
      return new Response(JSON.stringify({ error: 'Link inválido ou expirado.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (new Date(intake.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link expirado.' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (intake.status !== 'aguardando') {
      return new Response(JSON.stringify({ error: 'Este link já foi utilizado.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: updErr } = await supabase
      .from('quote_intakes')
      .update({
        status: 'recebido',
        submitted_at: new Date().toISOString(),
        requester_name, requester_email, requester_phone, company_name,
        event_name, service_types, modality, venue,
        start_date, end_date, sessions_count,
        description, observations, referral_source,
      })
      .eq('id', intake.id)
      .eq('status', 'aguardando');

    if (updErr) {
      return new Response(JSON.stringify({ error: 'Não foi possível salvar.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro inesperado.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
