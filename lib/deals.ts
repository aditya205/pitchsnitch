import { cache } from "react";
import { DEAL_FILES_BUCKET } from "./storage";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseAdmin";
import type { Deal, DealDetail, RawInput } from "./types";

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
        "Supabase credentials are placeholders. Fill in .env.local, then run the migrations in supabase/migrations.",
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
        "Supabase credentials are placeholders. Fill in .env.local, then run the migrations in supabase/migrations.",
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

/**
 * Stored file_urls are signed and expire after 7 days, so a deal's source
 * material would eventually 400 when a partner clicked through. Recover the
 * object path from the stored URL and mint a fresh signature at read time.
 * Falls back to the stored URL if the path can't be recovered.
 */
async function refreshSignedUrl(fileUrl: string): Promise<string> {
  const marker = `/object/sign/${DEAL_FILES_BUCKET}/`;
  const start = fileUrl.indexOf(marker);
  if (start === -1) return fileUrl;

  const path = fileUrl.slice(start + marker.length).split("?")[0];
  if (!path) return fileUrl;

  const { data } = await getSupabaseAdmin()
    .storage.from(DEAL_FILES_BUCKET)
    .createSignedUrl(decodeURIComponent(path), 60 * 60); // one hour is plenty

  return data?.signedUrl ?? fileUrl;
}

/** The untouched source material a deal was built from, newest first. */
export const getRawInputs = cache(async function getRawInputs(
  dealId: string
): Promise<RawInput[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("raw_inputs")
    .select("id, source, raw_text, file_url, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return Promise.all(
    (data as RawInput[]).map(async (input) => ({
      ...input,
      file_url: input.file_url ? await refreshSignedUrl(input.file_url) : null,
    }))
  );
});
