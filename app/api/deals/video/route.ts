import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { createSignedDealFileReadUrl } from "@/lib/storage";
import { RAW_INPUT_VIDEO_SOURCE } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AttachVideoBody = {
  deal_id?: unknown;
  file_path?: unknown;
};

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validStoragePath(path: string, dealId: string): boolean {
  return (
    path.startsWith(`${dealId}/`) &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..")
  );
}

/**
 * Attach an already-uploaded pitch video to an existing deal.
 *
 * Large video bytes must be uploaded directly to Supabase Storage with a signed
 * upload URL. This route only receives JSON metadata, keeping it under Vercel's
 * function payload limits.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: AttachVideoBody;
  try {
    body = (await request.json()) as AttachVideoBody;
  } catch {
    return NextResponse.json(
      { error: "Expected JSON with deal_id and file_path." },
      { status: 400 }
    );
  }

  const dealId = cleanString(body.deal_id);
  const filePath = cleanString(body.file_path);

  if (!dealId || !UUID.test(dealId)) {
    return NextResponse.json({ error: "Missing or invalid deal_id." }, { status: 400 });
  }
  if (!filePath || !validStoragePath(filePath, dealId)) {
    return NextResponse.json(
      { error: "Missing or invalid file_path for this deal." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data: deal, error: lookupError } = await admin
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  let signedUrl: string;
  try {
    signedUrl = await createSignedDealFileReadUrl(filePath);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sign video URL." },
      { status: 502 }
    );
  }

  const { error: rawError } = await admin.from("raw_inputs").insert({
    deal_id: dealId,
    source: RAW_INPUT_VIDEO_SOURCE,
    raw_text: null,
    file_url: signedUrl,
  });

  if (rawError) {
    return NextResponse.json(
      { error: `Video stored but not linked to the deal: ${rawError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ deal_id: dealId, file_url: signedUrl }, { status: 201 });
}
