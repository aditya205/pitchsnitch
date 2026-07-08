import { cache } from "react";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";
import type { Deal, DealDetail } from "./types";

// SERVER-ONLY: reads go through the service-role client.

export type DealsResult =
  | { ok: true; deals: Deal[] }
  | { ok: false; reason: "unconfigured" | "error"; message: string };

export async function getDeals(): Promise<DealsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "Supabase credentials are placeholders. Fill in .env.local, then run the migration and seed in supabase/.",
    };
  }
  const { data, error } = await getSupabaseAdmin()
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, reason: "error", message: error.message };
  }
  return { ok: true, deals: (data ?? []) as Deal[] };
}

export type DealDetailResult =
  | { ok: true; deal: DealDetail }
  | { ok: false; reason: "unconfigured" | "error" | "not_found"; message: string };

// React.cache dedupes the fetch between generateMetadata and the page render.
export const getDealDetail = cache(async function getDealDetail(
  id: string
): Promise<DealDetailResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "Supabase credentials are placeholders. Fill in .env.local, then run the migrations and seed in supabase/.",
    };
  }
  const { data, error } = await getSupabaseAdmin()
    .from("deals")
    .select("*, founders(*), extracted_fields(*), external_signals(*), scores(*)")
    .eq("id", id)
    .order("id", { referencedTable: "founders", ascending: true })
    .order("signal_date", { referencedTable: "external_signals", ascending: false })
    .maybeSingle();

  if (error) {
    // 22P02: id isn't a valid uuid — treat a malformed link as not found.
    if (error.code === "22P02") {
      return { ok: false, reason: "not_found", message: "Deal not found." };
    }
    return { ok: false, reason: "error", message: error.message };
  }
  if (!data) {
    return { ok: false, reason: "not_found", message: "Deal not found." };
  }
  return { ok: true, deal: data as DealDetail };
});
