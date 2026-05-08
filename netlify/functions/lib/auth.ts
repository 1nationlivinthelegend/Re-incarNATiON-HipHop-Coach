/**
 * auth.ts
 * JWT verification helper using Supabase's auth.getUser() API.
 * No local JWT_SECRET needed — Supabase validates the token server-side.
 */

import { createAnonClient } from "./supabase-server.js";

export interface VerifiedUser {
  id: string;
  email: string | undefined;
}

export interface AuthResult {
  user: VerifiedUser | null;
  error: string | null;
}

/**
 * Verify a Supabase JWT from an Authorization header.
 * Returns the verified user or an error string.
 *
 * @param authHeader - The raw "Authorization" header value, e.g. "Bearer eyJ..."
 */
export async function verifyAuth(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or malformed Authorization header" };
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { user: null, error: error?.message ?? "Invalid or expired token" };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Auth verification failed";
    return { user: null, error: msg };
  }
}

/**
 * Check if this is a valid anonymous session (Supabase anon users have is_anonymous: true).
 * We allow anonymous sessions for Plan 1 — full auth gates come in Plan 2.
 */
export function isAnonymousUser(userId: string): boolean {
  // Supabase anonymous users are real UUIDs — we can't distinguish by UUID alone.
  // This helper is a placeholder; in Plan 2 we'll query profiles.subscription_status.
  return false; // conservative: treat all users as registered
}
