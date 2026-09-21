// Webhook público: recebe respostas do Monitor (Fluxor) e atualiza a thread do chamado
import { createClient } from "npm:@supabase/supabase-js@2";

// Segredo configurável; mantém o valor anterior como fallback para não quebrar a integração atual.
const FALLBACK_SECRET = "844ffa995f24e166d7f65764eb6af349595dae6aae2d60c4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-fluxor-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function mapStatus(status?: string): string {
  const s = String(status ?? "").toLowerCase();
  if (["aberto", "em_andamento", "respondido", "resolvido", "fechado"].includes(s)) {
    return s === "respondido" ? "em_andamento" : s;
  }
  return "em_andamento";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.text();
  const signature = (req.headers.get("x-fluxor-signature") ?? "").trim();

  const secrets = [Deno.env.get("FLUXOR_WEBHOOK_SECRET"), FALLBACK_SECRET].filter(Boolean) as string[];
  let valid = false;
  for (const s of secrets) {
    if (signature && timingSafeEqual(signature, await hmacHex(s, body))) { valid = true; break; }
  }
  if (!valid) {
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let payload: any;
  try { payload = JSON.parse(body); } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const evento = payload?.evento ?? payload?.event;
  // Formato novo (Fluxor): { evento, chamado: { id, status, resposta: {...} } }
  // Formato antigo: { event, chamado_id, mensagem, respondido_por, status }
  const chamado = payload?.chamado;
  const chamadoId = chamado?.id ?? payload?.chamado_id;
  const resposta = chamado?.resposta;

  if (evento !== "chamado.respondido" || !chamadoId) {
    // Ping de teste do Monitor — responde 200
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: local } = await admin
    .from("suporte_chamados")
    .select("id, thread")
    .eq("monitor_id", String(chamadoId))
    .maybeSingle();

  if (!local) return new Response("ok", { status: 200, headers: corsHeaders });

  const thread = Array.isArray(local.thread) ? local.thread : [];
  thread.push({
    de: resposta?.autor_nome ?? payload?.respondido_por ?? "Atendente",
    mensagem: String(resposta?.mensagem ?? payload?.mensagem ?? ""),
    em: resposta?.created_at ?? payload?.respondido_em ?? new Date().toISOString(),
  });

  await admin
    .from("suporte_chamados")
    .update({
      thread,
      status: mapStatus(chamado?.status ?? payload?.status),
      updated_at: new Date().toISOString(),
    })
    .eq("id", local.id);

  return new Response("ok", { status: 200, headers: corsHeaders });
});
