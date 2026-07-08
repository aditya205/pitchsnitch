import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import {
  isAcceptedVideoType,
  MAX_VIDEO_BYTES,
  uploadDealVideo,
} from "@/lib/videoStorage";
import { RAW_INPUT_VIDEO_SOURCE } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Attach a pitch video to an existing deal.
 *
 * Deliberately a separate endpoint from /api/deals/create, which is
 * mid-development and must not be modified. The Add Deal form creates the deal
 * first, then posts the video here. The transcription step is not built yet —
 * we only store the file and record a raw_inputs row pointing at it.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const dealId = (form.get("deal_id") as string | null)?.trim();
  const video = form.get("video");

  if (!dealId || !UUID.test(dealId)) {
    return NextResponse.json({ error: "Missing or invalid deal_id." }, { status: 400 });
  }
  if (!(video instanceof File) || video.size === 0) {
    return NextResponse.json({ error: "No video file provided." }, { status: 400 });
  }
  if (!isAcceptedVideoType(video)) {
    return NextResponse.json(
      { error: "Unsupported video type. Upload an MP4 or MOV." },
      { status: 400 }
    );
  }
  if (video.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: `Video is too large (max ${MAX_VIDEO_BYTES / 1024 / 1024}MB).` },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Don't create orphaned storage objects for a deal that doesn't exist.
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
    ({ signedUrl } = await uploadDealVideo(dealId, video));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Video upload failed." },
      { status: 502 }
    );
  }

  // The pipeline will pick this row up and transcribe file_url later.
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
