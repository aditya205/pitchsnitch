import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key. Never import into a client component.

let client: SupabaseClient | null = null;

const isPlaceholder = (value: string | undefined) =>
  !value || value.startsWith("your-");

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  return !isPlaceholder(url) && !isPlaceholder(secretKey);
}

// Lazy so the app can boot (and render a setup notice) before env is configured.
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local."
    );
  }
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey!,
    { auth: { persistSession: false } }
  );
  return client;
}
