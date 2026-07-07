"use server";

import { getSupabaseAdmin } from "./supabaseAdmin";
import { DEAL_STATUSES, type DealStatus } from "./types";

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function updateDealStatus(
  dealId: string,
  status: DealStatus
): Promise<ActionResult> {
  if (!DEAL_STATUSES.some((s) => s.value === status)) {
    return { ok: false, message: "Unknown deal status." };
  }
  if (typeof dealId !== "string" || dealId.length === 0) {
    return { ok: false, message: "Missing deal id." };
  }
  try {
    const { error } = await getSupabaseAdmin()
      .from("deals")
      .update({ status })
      .eq("id", dealId);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Update failed." };
  }
}
