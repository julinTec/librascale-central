// Envia sinal de vida (heartbeat) e métricas do sistema para o OmniView (Fluxor)
import { createClient } from "npm:@supabase/supabase-js@2";

const OMNIVIEW_BASE_URL = "https://monitor-manager-fluxor.lovable.app";
// Mesma API key usada na abertura de chamados; pode ser sobrescrita pelo secret.
const FALLBACK_API_KEY = "106862964ddb91bc72b50a00c83e68b8e1bb2c1c9fa33be4";
const APP_VERSION = "1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const apiKey = () => Deno.env.get("OMNIVIEW_API_KEY") || FALLBACK_API_KEY;

async function post(path: string, body: unknown) {
  try {
    const res = await fetch(`${OMNIVIEW_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey() },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) console.error(`[OmniView] ${path} falhou:`, res.status, text);
    return { ok: res.ok, status: res.status, body: text };
  } catch (err) {
    console.error(`[OmniView] ${path} erro:`, err);
    return { ok: false, status: 0, body: String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);
  let metricas: { nome: string; valor: number; unidade?: string }[] = [];
  let dbOk = true;

  try {
    const count = (q: any) => q.then((r: any) => r.count ?? 0);
    const [eventosAtivos, sessoesHoje, chamadosAbertos, recebiveisVencidos, clientesAtivos] =
      await Promise.all([
        count(admin.from("events").select("id", { count: "exact", head: true })
          .in("status", ["planejado", "confirmado", "em_execucao"])),
        count(admin.from("event_sessions").select("id", { count: "exact", head: true })
          .eq("session_date", today).neq("status", "cancelada")),
        count(admin.from("suporte_chamados").select("id", { count: "exact", head: true })
          .neq("status", "fechado")),
        count(admin.from("event_receivables").select("id", { count: "exact", head: true })
          .lt("due_date", today).in("status", ["pendente", "vencido"])),
        count(admin.from("clients").select("id", { count: "exact", head: true }).eq("is_active", true)),
      ]);

    metricas = [
      { nome: "eventos_ativos", valor: eventosAtivos, unidade: "count" },
      { nome: "sessoes_hoje", valor: sessoesHoje, unidade: "count" },
      { nome: "chamados_abertos", valor: chamadosAbertos, unidade: "count" },
      { nome: "recebiveis_vencidos", valor: recebiveisVencidos, unidade: "count" },
      { nome: "clientes_ativos", valor: clientesAtivos, unidade: "count" },
    ];
  } catch (e) {
    dbOk = false;
    console.error("[OmniView] erro ao coletar métricas:", e);
  }

  const tempoResposta = Date.now() - startedAt;
  metricas.push({ nome: "tempo_resposta_api_ms", valor: tempoResposta, unidade: "ms" });

  const hb = await post("/api/public/monitor/heartbeat", {
    status: dbOk ? "ok" : "degraded",
    versao: APP_VERSION,
    detalhes: {
      ambiente: "production",
      sistema: "Nosso Mundo - Gestão de Eventos",
      source: "edge-function",
      banco: dbOk ? "ok" : "erro",
      tempo_coleta_ms: tempoResposta,
    },
  });

  const mt = await post("/api/public/monitor/metrics", { metricas });

  return new Response(
    JSON.stringify({ ok: hb.ok, heartbeat: hb.status, metrics: mt.status, metricas }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
