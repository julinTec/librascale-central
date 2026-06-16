// Webhook público: recebe respostas do Monitor (Fluxor) e atualiza a thread do chamado
import { createClient } from "npm:@supabase/supabase-js@2";

const WEBHOOK_SECRET = "844ffa995f24e166d7f65764eb6af349595dae6aae2d60c4";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.text();
  const signature = (req.headers.get("x-fluxor-signature") ?? "").trim();
  const expected = await hmacHex(WEBHOOK_SECRET, body);

  if (!signature || !timingSafeEqual(signature, expected)) {
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let payload: any;
  try { payload = JSON.parse(body); } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  if (payload?.event !== "chamado.respondido" || !payload?.chamado_id) {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: chamado } = await admin
    .from("suporte_chamados")
    .select("id, thread")
    .eq("monitor_id", String(payload.chamado_id))
    .maybeSingle();

  if (!chamado) return new Response("ok", { status: 200, headers: corsHeaders });

  const thread = Array.isArray(chamado.thread) ? chamado.thread : [];
  thread.push({
    de: payload.respondido_por ?? "Atendente",
    mensagem: String(payload.mensagem ?? ""),
    em: payload.respondido_em ?? new Date().toISOString(),
  });

  await admin
    .from("suporte_chamados")
    .update({
      thread,
      status: payload.status ?? "em_andamento",
      updated_at: new Date().toISOString(),
    })
    .eq("id", chamado.id);

  return new Response("ok", { status: 200, headers: corsHeaders });
});
