import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import {
  createSignedDealFileUploadUrl,
  DEAL_FILES_BUCKET,
  isAcceptedFileMetadata,
  MAX_DOCUMENT_BYTES,
} from "@/lib/storage";
import {
  createSignedDealVideoUploadUrl,
  isAcceptedVideoMetadata,
  MAX_VIDEO_BYTES,
} from "@/lib/videoStorage";
import { DEAL_PLACEHOLDER_NAME } from "@/lib/types";

export const dynamic = "force-dynamic";

type IntakeFileKind = "document" | "video";

type UploadUrlBody = {
  file_name?: unknown;
  file_type?: unknown;
  file_size?: unknown;
  file_kind?: unknown;
};

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fileKind(value: unknown): IntakeFileKind | null {
  return value === "document" || value === "video" ? value : null;
}

function fileSize(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

async function deletePlaceholderDeal(dealId: string) {
  const { error } = await getSupabaseAdmin().from("deals").delete().eq("id", dealId);
  if (error) {
    console.error(
      `[deals/upload-url] could not clean up placeholder deal ${dealId}:`,
      error.message
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: UploadUrlBody;
  try {
    body = (await request.json()) as UploadUrlBody;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const name = cleanString(body.file_name);
  const contentType = cleanString(body.file_type);
  const size = fileSize(body.file_size);
  const kind = fileKind(body.file_kind);

  if (!name || !size || !kind) {
    return NextResponse.json(
      { error: "Missing file name, size, or kind." },
      { status: 400 }
    );
  }

  const accepted =
    kind === "video"
      ? isAcceptedVideoMetadata(name, contentType)
      : isAcceptedFileMetadata(name, contentType);

  if (!accepted) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, DOCX, DOC, MP4, or MOV." },
      { status: 400 }
    );
  }

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_DOCUMENT_BYTES;
  if (size > maxBytes) {
    return NextResponse.json(
      {
        error:
          kind === "video"
            ? "Video is too large (max 50MB)."
            : "File is too large (max 20MB).",
      },
      { status: 400 }
    );
  }

  const { data: deal, error: dealError } = await getSupabaseAdmin()
    .from("deals")
    .insert({
      company_name: DEAL_PLACEHOLDER_NAME,
      status: "new",
      source_channel: "upload",
    })
    .select("id")
    .single();

  if (dealError || !deal) {
    return NextResponse.json(
      { error: `Could not create deal: ${dealError?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const dealId = deal.id as string;

  try {
    const { path, token } =
      kind === "video"
        ? await createSignedDealVideoUploadUrl(dealId, name)
        : await createSignedDealFileUploadUrl(dealId, name);

    return NextResponse.json(
      {
        bucket: DEAL_FILES_BUCKET,
        deal_id: dealId,
        file_path: path,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    await deletePlaceholderDeal(dealId);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create upload URL.",
      },
      { status: 502 }
    );
  }
}
