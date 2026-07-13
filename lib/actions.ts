"use server";

import { revalidatePath } from "next/cache";
import { deleteDealFiles } from "./storage";
import { getSupabaseAdmin } from "./supabaseAdmin";
import {
  DEAL_STATUSES,
  type DealStatus,
  type RoundDetails,
  type TractionDetails,
} from "./types";

export type ActionResult = { ok: true } | { ok: false; message: string };

export type EditableDealFields = {
  company_name?: string | null;
  one_liner?: string | null;
  website?: string | null;
  sector?: string | null;
  stage?: string | null;
  location?: string | null;
  founded_year?: string | null;
  tam?: string | null;
  arr?: string | null;
  use_of_funds?: string | null;
  recommendation?: string | null;
  why_it_fits?: string | null;
  thesis_fit?: string | null;
  concerns?: string | null;
  round?: RoundDetails | null;
  traction?: TractionDetails | null;
  missing_fields?: string[] | null;
  red_flags?: string[] | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TEXT_FIELDS = [
  "company_name",
  "one_liner",
  "website",
  "sector",
  "stage",
  "location",
  "founded_year",
  "tam",
  "arr",
  "use_of_funds",
  "recommendation",
  "why_it_fits",
  "concerns",
] as const;

const PROVENANCE_FIELDS = new Set([
  ...TEXT_FIELDS,
  "raising_amount",
  "valuation",
  "prior_investors",
  "revenue",
  "customers",
  "growth_rate",
]);

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "string") return [];
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });
}

function cleanRound(value: EditableDealFields["round"]): RoundDetails | null {
  const round = {
    raising_amount: cleanText(value?.raising_amount),
    valuation: cleanText(value?.valuation),
    prior_investors: cleanText(value?.prior_investors),
  };
  return Object.values(round).some(Boolean) ? round : null;
}

function cleanTraction(
  value: EditableDealFields["traction"]
): TractionDetails | null {
  const traction = {
    revenue: cleanText(value?.revenue),
    customers: cleanText(value?.customers),
    growth_rate: cleanText(value?.growth_rate),
  };
  return Object.values(traction).some(Boolean) ? traction : null;
}

function fieldValueFor(
  field: string,
  patch: Record<string, unknown>
): string | null {
  if (field in patch) return cleanText(patch[field]);

  const round = patch.round as RoundDetails | null | undefined;
  if (field === "raising_amount") return cleanText(round?.raising_amount);
  if (field === "valuation") return cleanText(round?.valuation);
  if (field === "prior_investors") return cleanText(round?.prior_investors);

  const traction = patch.traction as TractionDetails | null | undefined;
  if (field === "revenue") return cleanText(traction?.revenue);
  if (field === "customers") return cleanText(traction?.customers);
  if (field === "growth_rate") return cleanText(traction?.growth_rate);

  return null;
}

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

export async function updateDealFields(
  dealId: string,
  fields: EditableDealFields,
  dirtyFields: string[]
): Promise<ActionResult> {
  if (typeof dealId !== "string" || !UUID.test(dealId)) {
    return { ok: false, message: "Invalid deal id." };
  }

  try {
    const patch: Record<string, unknown> = {};

    for (const field of TEXT_FIELDS) {
      if (Object.hasOwn(fields, field)) {
        patch[field] = cleanText(fields[field]);
      }
    }

    if (Object.hasOwn(fields, "round")) {
      patch.round = cleanRound(fields.round);
    }
    if (Object.hasOwn(fields, "traction")) {
      patch.traction = cleanTraction(fields.traction);
    }
    if (Object.hasOwn(fields, "missing_fields")) {
      patch.missing_fields = cleanList(fields.missing_fields);
    }
    if (Object.hasOwn(fields, "red_flags")) {
      patch.red_flags = cleanList(fields.red_flags);
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("deals")
      .update(patch)
      .eq("id", dealId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }
    if (!data) {
      return { ok: false, message: "Deal not found." };
    }

    const edited = [...new Set(dirtyFields)].filter((field) =>
      PROVENANCE_FIELDS.has(field)
    );
    if (edited.length > 0) {
      const rows = edited.map((field) => ({
        deal_id: dealId,
        field_name: field,
        value: fieldValueFor(field, patch),
        source: "submitted",
        confidence: null,
      }));

      const { error: provenanceError } = await db
        .from("extracted_fields")
        .upsert(rows, { onConflict: "deal_id,field_name" });

      if (provenanceError) {
        return { ok: false, message: provenanceError.message };
      }
    }

    revalidatePath("/");
    revalidatePath(`/deal/${dealId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Update failed.",
    };
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
