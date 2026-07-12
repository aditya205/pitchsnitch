import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { createSignedDealFileReadUrl } from "@/lib/storage";
import { DEAL_PLACEHOLDER_NAME, RAW_INPUT_VIDEO_SOURCE } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type IntakeFileKind = "document" | "video";

type CreateDealBody = {
  deal_id?: unknown;
  raw_text?: unknown;
  file_path?: unknown;
  file_kind?: unknown;
};

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanFileKind(value: unknown): IntakeFileKind | null {
  return value === "document" || value === "video" ? value : null;
}

function validStoragePath(path: string, dealId: string): boolean {
  return (
    path.startsWith(`${dealId}/`) &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..")
  );
}

async function createPlaceholderDeal(): Promise<
  | { ok: true; dealId: string }
  | { ok: false; response: NextResponse }
> {
  const { data: deal, error } = await getSupabaseAdmin()
    .from("deals")
    .insert({
      company_name: DEAL_PLACEHOLDER_NAME,
      status: "new",
      source_channel: "upload",
    })
    .select("id")
    .single();

  if (error || !deal) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Could not create deal: ${error?.message ?? "unknown"}` },
        { status: 500 }
      ),
    };
  }

  return { ok: true, dealId: deal.id as string };
}

async function ensureDealExists(
  dealId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { data, error } = await getSupabaseAdmin()
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  if (!data) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Deal not found." }, { status: 404 }),
    };
  }

  return { ok: true };
}

async function markProcessingError(dealId: string, message: string) {
  const { error } = await getSupabaseAdmin()
    .from("deals")
    .update({ processing_error: message })
    .eq("id", dealId);

  if (error) {
    console.error(
      `[deals/create] could not record processing_error on ${dealId}:`,
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

  let body: CreateDealBody;
  try {
    body = (await request.json()) as CreateDealBody;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const rawText = cleanString(body.raw_text);
  const requestedDealId = cleanString(body.deal_id);
  const filePath = cleanString(body.file_path);
  const fileKind = filePath ? cleanFileKind(body.file_kind) : null;

  if (!rawText && !filePath) {
    return NextResponse.json(
      { error: "Provide a file or some text to create a deal." },
      { status: 400 }
    );
  }

  if (requestedDealId && !UUID.test(requestedDealId)) {
    return NextResponse.json({ error: "Invalid deal id." }, { status: 400 });
  }

  if (filePath && !requestedDealId) {
    return NextResponse.json(
      { error: "Uploaded files must include a deal id." },
      { status: 400 }
    );
  }

  if (filePath && !fileKind) {
    return NextResponse.json(
      { error: "Uploaded files must include a valid file kind." },
      { status: 400 }
    );
  }

  let dealId: string;
  if (requestedDealId) {
    const dealResult = await ensureDealExists(requestedDealId);
    if (!dealResult.ok) {
      return dealResult.response;
    }
    dealId = requestedDealId;
  } else {
    const dealResult = await createPlaceholderDeal();
    if (!dealResult.ok) {
      return dealResult.response;
    }
    dealId = dealResult.dealId;
  }

  if (filePath && !validStoragePath(filePath, dealId)) {
    return NextResponse.json(
      { error: "Uploaded file path does not belong to this deal." },
      { status: 400 }
    );
  }

  let fileUrl: string | null = null;
  let fileWarning: string | null = null;

  if (filePath) {
    try {
      fileUrl = await createSignedDealFileReadUrl(filePath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign file URL.";
      if (!rawText) {
        return NextResponse.json({ error: message }, { status: 502 });
      }
      fileWarning = message;
    }
  }

  const rawInputSource = fileKind === "video" ? RAW_INPUT_VIDEO_SOURCE : "upload";
  const { error: rawError } = await getSupabaseAdmin().from("raw_inputs").insert({
    deal_id: dealId,
    source: rawInputSource,
    raw_text: rawText,
    file_url: fileUrl,
  });

  let webhookWarning: string | null = null;
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.startsWith("your-")) {
    webhookWarning =
      "The deal was saved, but N8N_WEBHOOK_URL is not set, so the analysis pipeline was never started. Set it in .env.local and re-run the deal.";
  } else {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId,
          raw_text: rawText,
          file_url: fileUrl,
          file_kind: fileKind,
          source: rawInputSource,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const hint =
          res.status === 404
            ? " An n8n /webhook/ URL returns 404 until its workflow is activated — activate it, or use the /webhook-test/ URL while building."
            : "";
        webhookWarning =
          `The deal was saved, but the analysis pipeline rejected the request: ` +
          `POST ${webhookUrl} returned ${res.status} ${res.statusText}.${hint}`;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      webhookWarning =
        `The deal was saved, but the analysis pipeline could not be reached: ` +
        `POST ${webhookUrl} failed (${reason}).`;
    }
  }

  if (webhookWarning) {
    await markProcessingError(dealId, webhookWarning);
  }

  const warnings = [
    fileWarning,
    rawError ? `Raw input not saved: ${rawError.message}` : null,
    webhookWarning,
  ].filter(Boolean);

  return NextResponse.json({ deal_id: dealId, warnings }, { status: 201 });
}
