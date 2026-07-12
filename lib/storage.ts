import { getSupabaseAdmin } from "./supabaseAdmin";

// SERVER-ONLY. Uploads run through the service-role client.

export const DEAL_FILES_BUCKET = "deal-files";
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

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
    fileSizeLimit: MAX_DOCUMENT_BYTES,
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

export function isAcceptedFileMetadata(
  fileName: string,
  contentType: string | null | undefined
): boolean {
  if (contentType && ACCEPTED_MIME.has(contentType)) return true;
  return /\.(pdf|docx?)$/i.test(fileName);
}

export function safeStorageFileName(fileName: string): string {
  const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName || "upload";
}

export function buildDealFilePath(dealId: string, fileName: string): string {
  return `${dealId}/${Date.now()}-${safeStorageFileName(fileName)}`;
}

export async function createSignedDealFileUploadUrl(
  dealId: string,
  fileName: string
): Promise<{ path: string; token: string }> {
  await ensureDealFilesBucket();
  const path = buildDealFilePath(dealId, fileName);

  const { data, error } = await getSupabaseAdmin()
    .storage.from(DEAL_FILES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Could not sign upload URL: ${error?.message ?? "unknown"}`);
  }

  return { path: data.path, token: data.token };
}

export async function createSignedDealFileReadUrl(
  path: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(DEAL_FILES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Could not sign file URL: ${error?.message ?? "unknown"}`);
  }

  return data.signedUrl;
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

  const path = buildDealFilePath(dealId, file.name);

  const { error: uploadError } = await admin.storage
    .from(DEAL_FILES_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  return { path, signedUrl: await createSignedDealFileReadUrl(path) };
}

async function listStoredFiles(prefix: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const paths: string[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await admin.storage
      .from(DEAL_FILES_BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error) {
      throw new Error(`Could not list deal files: ${error.message}`);
    }

    for (const entry of data ?? []) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        paths.push(...(await listStoredFiles(path)));
      } else {
        paths.push(path);
      }
    }

    if (!data || data.length < limit) break;
    offset += data.length;
  }

  return paths;
}

/** Remove every private upload under a deal's storage prefix. */
export async function deleteDealFiles(dealId: string): Promise<void> {
  const paths = await listStoredFiles(dealId);
  const batchSize = 100;

  for (let index = 0; index < paths.length; index += batchSize) {
    const { error } = await getSupabaseAdmin()
      .storage.from(DEAL_FILES_BUCKET)
      .remove(paths.slice(index, index + batchSize));

    if (error) {
      throw new Error(`Could not delete deal files: ${error.message}`);
    }
  }
}
