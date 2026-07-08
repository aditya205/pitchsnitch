import { getSupabaseAdmin } from "./supabaseAdmin";

// SERVER-ONLY. Uploads run through the service-role client.

export const DEAL_FILES_BUCKET = "deal-files";

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc, sometimes sent for .docx
]);

let ensured = false;

// Create the private bucket on first use. Idempotent; cheap after the first call.
export async function ensureDealFilesBucket(): Promise<void> {
  if (ensured) return;
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin.storage.getBucket(DEAL_FILES_BUCKET);
  if (existing) {
    ensured = true;
    return;
  }

  const { error } = await admin.storage.createBucket(DEAL_FILES_BUCKET, {
    public: false,
    allowedMimeTypes: Array.from(ACCEPTED_MIME),
    fileSizeLimit: "20MB",
  });

  // Tolerate the race where a concurrent request created it first.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
  }
  ensured = true;
}

export function isAcceptedFileType(file: File): boolean {
  if (ACCEPTED_MIME.has(file.type)) return true;
  // Some browsers send an empty type for .docx; fall back to the extension.
  return /\.(pdf|docx?)$/i.test(file.name);
}

/**
 * Upload a deal file to a per-deal path and return a signed URL the pipeline
 * can fetch. The bucket is private, so we sign rather than expose a public URL.
 */
export async function uploadDealFile(
  dealId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  await ensureDealFilesBucket();
  const admin = getSupabaseAdmin();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${dealId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(DEAL_FILES_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  // Signed URL valid for 7 days — long enough for the pipeline to process.
  const { data, error: signError } = await admin.storage
    .from(DEAL_FILES_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signError || !data) {
    throw new Error(`Could not sign file URL: ${signError?.message ?? "unknown"}`);
  }

  return { path, signedUrl: data.signedUrl };
}
