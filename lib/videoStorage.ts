import { DEAL_FILES_BUCKET, ensureDealFilesBucket } from "./storage";
import { getSupabaseAdmin } from "./supabaseAdmin";

// SERVER-ONLY. Uploads run through the service-role client.
//
// Kept separate from lib/storage.ts (the document intake path), which is
// mid-development and must not be modified. This module only widens the shared
// bucket's constraints — additively — so it can also hold pitch videos.

export const ACCEPTED_VIDEO_MIME = ["video/mp4", "video/quicktime"] as const;

/**
 * Videos are an order of magnitude larger than decks. 50MB is the ceiling the
 * Supabase project itself enforces — a bucket cannot be raised above it, so
 * asking for more is rejected outright. Raise the project limit first if you
 * need longer videos.
 */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

let widened = false;

/**
 * The deal-files bucket was created for PDFs and DOCX: it rejects
 * `video/quicktime` and caps uploads at 20MB. Union in the video MIME types and
 * raise the size limit, leaving every existing allowance intact.
 */
export async function ensureVideoUploadsAllowed(): Promise<void> {
  if (widened) return;
  await ensureDealFilesBucket();
  const admin = getSupabaseAdmin();

  const { data: bucket } = await admin.storage.getBucket(DEAL_FILES_BUCKET);
  const existing = bucket?.allowed_mime_types ?? [];
  const missing = ACCEPTED_VIDEO_MIME.filter((m) => !existing.includes(m));
  const limitTooLow = (bucket?.file_size_limit ?? 0) < MAX_VIDEO_BYTES;

  if (missing.length === 0 && !limitTooLow) {
    widened = true;
    return;
  }

  const allowedMimeTypes = [...new Set([...existing, ...ACCEPTED_VIDEO_MIME])];

  const { error } = await admin.storage.updateBucket(DEAL_FILES_BUCKET, {
    public: false,
    allowedMimeTypes,
    fileSizeLimit: MAX_VIDEO_BYTES,
  });

  if (error) {
    // The project's global cap can sit below MAX_VIDEO_BYTES. Still allow the
    // video MIME types through; small videos will upload, large ones get a
    // clear size error from Supabase rather than a confusing MIME rejection.
    const { error: mimeOnlyError } = await admin.storage.updateBucket(
      DEAL_FILES_BUCKET,
      { public: false, allowedMimeTypes, fileSizeLimit: bucket?.file_size_limit ?? undefined }
    );
    if (mimeOnlyError) {
      throw new Error(`Could not enable video uploads: ${mimeOnlyError.message}`);
    }
  }
  widened = true;
}

export function isAcceptedVideoType(file: File): boolean {
  if ((ACCEPTED_VIDEO_MIME as readonly string[]).includes(file.type)) return true;
  // Some browsers send an empty type; fall back to the extension.
  return /\.(mp4|mov)$/i.test(file.name);
}

/**
 * Upload a pitch video under the deal's folder and return a signed URL the
 * transcription step can fetch. The bucket is private, so we sign it.
 */
export async function uploadDealVideo(
  dealId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  await ensureVideoUploadsAllowed();
  const admin = getSupabaseAdmin();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${dealId}/video/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(DEAL_FILES_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    throw new Error(`Video upload failed: ${uploadError.message}`);
  }

  // Signed URL valid for 7 days — long enough for the pipeline to transcribe.
  const { data, error: signError } = await admin.storage
    .from(DEAL_FILES_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signError || !data) {
    throw new Error(`Could not sign video URL: ${signError?.message ?? "unknown"}`);
  }

  return { path, signedUrl: data.signedUrl };
}
