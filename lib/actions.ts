"use server";

import { revalidatePath } from "next/cache";
import { deleteDealFiles } from "./storage";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { DEAL_STATUSES, type DealStatus } from "./types";

export type ActionResult = { ok: true } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function deleteDeal(dealId: string): Promise<ActionResult> {
  if (typeof dealId !== "string" || !UUID.test(dealId)) {
    return { ok: false, message: "Invalid deal id." };
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("deals")
      .delete()
      .eq("id", dealId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }
    if (!data) {
      return { ok: false, message: "Deal not found." };
    }

    // Database relations cascade from deals. Storage is separate, so remove
    // private uploads after the authoritative row has been deleted.
    try {
      await deleteDealFiles(dealId);
    } catch (error) {
      console.error(
        `[deals/delete] deal ${dealId} deleted, but storage cleanup failed:`,
        error instanceof Error ? error.message : error
      );
    }

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}
