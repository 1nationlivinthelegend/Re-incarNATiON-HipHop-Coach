/**
 * supabase-server.ts
 * Server-side Supabase client using the service role key.
 * NEVER import this file from browser-side code.
 * NEVER log or expose SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  // Netlify Functions expose env vars on process.env
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

/** Service-role client — bypasses RLS. Use only for server-side writes. */
export function createServiceClient() {
  return createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        // Disable auto session persistence on the server
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/** Anon client — used only to verify JWTs from the browser. */
export function createAnonClient() {
  return createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
