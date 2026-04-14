import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TABLES = [
  "clients",
  "interpreters",
  "events",
  "event_sessions",
  "event_assignments",
  "event_services",
  "event_quotes",
  "budget_items",
  "event_receivables",
  "event_payables",
  "event_expenses",
  "schedules",
  "execution_logs",
  "incidents",
  "contract_hours",
  "period_closings",
  "tax_settings",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const table = url.searchParams.get("table");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // If no table specified, return list of available tables
    if (!table) {
      return new Response(
        JSON.stringify({
          available_tables: ALLOWED_TABLES,
          usage: "Add ?table=<table_name> to fetch data. Optional: &limit=100&offset=0",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Table '${table}' is not available. Use GET without ?table to see available tables.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase.from(table).select("*", { count: "exact" });

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      const offset = parseInt(offsetParam || "0", 10);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ table, total: count, rows_returned: data?.length ?? 0, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
