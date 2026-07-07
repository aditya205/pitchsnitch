import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key. Never import into a client component.

let client: SupabaseClient | null = null;

const isPlaceholder = (value: string | undefined) =>
  !value || value.startsWith("your-");

export function isSupabaseConfigured(): boolean {
  return (
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

// Lazy so the app can boot (and render a setup notice) before env is configured.
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return client;
}
