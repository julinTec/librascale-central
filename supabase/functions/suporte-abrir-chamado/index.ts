// Edge function: abre chamado local e replica no Monitor externo (Fluxor)
import { createClient } from "npm:@supabase/supabase-js@2";

const MONITOR_BASE_URL = "https://monitor-manager-fluxor.lovable.app";
const MONITOR_API_KEY = "106862964ddb91bc72b50a00c83e68b8e1bb2c1c9fa33be4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string | undefined) ?? userId;

    const body = await req.json();
    const titulo = String(body?.titulo ?? "").trim();
    const descricao = String(body?.descricao ?? "").trim();
    const prioridade = ["baixa", "media", "alta", "urgente"].includes(body?.prioridade)
      ? body.prioridade
      : "media";

    if (titulo.length < 3 || descricao.length < 5) {
      return new Response(JSON.stringify({ error: "Título ou descrição inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) grava local
    const { data: local, error: insErr } = await supabase
      .from("suporte_chamados")
      .insert({ user_id: userId, titulo, descricao, prioridade })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    // 2) envia ao Monitor (com service role para gravar monitor_id)
    let monitorId: string | null = null;
    try {
      const res = await fetch(`${MONITOR_BASE_URL}/api/public/monitor/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": MONITOR_API_KEY },
        body: JSON.stringify({
          titulo, descricao, prioridade,
          solicitante: email,
          metadata: { suporte_local_id: local.id, user_id: userId },
        }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json?.id) {
        monitorId = String(json.id);
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await admin.from("suporte_chamados").update({ monitor_id: monitorId }).eq("id", local.id);
      }
    } catch (e) {
      console.error("Falha ao enviar ao Monitor:", e);
    }

    return new Response(JSON.stringify({ id: local.id, monitor_id: monitorId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
