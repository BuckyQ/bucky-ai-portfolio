import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

function getSupabaseProjectUrl(): string | undefined {
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  if (!configuredUrl) return undefined;

  const url = new URL(configuredUrl);
  url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "/");
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseProjectUrl();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error("Supabase unanswered-question logging is not configured.");
  }

  adminClient ??= createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return adminClient;
}
