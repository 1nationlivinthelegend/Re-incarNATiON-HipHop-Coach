/**
 * config.mts
 * Returns PUBLIC (browser-safe) environment variables to the frontend.
 * NEVER expose service role key, JWT secret, or any server-only secret here.
 */
import type { Context, Config } from "@netlify/functions";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    // Cache for 5 minutes — these values never change per deploy
    "Cache-Control": "public, max-age=300",
  };
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Only SUPABASE_URL and SUPABASE_ANON_KEY are safe for browser exposure
  const supabase_url = process.env.SUPABASE_URL ?? "";
  const supabase_anon_key = process.env.SUPABASE_ANON_KEY ?? "";

  return new Response(
    JSON.stringify({ supabase_url, supabase_anon_key }),
    { status: 200, headers: corsHeaders() }
  );
};

export const config: Config = {
  path: "/api/config",
};
