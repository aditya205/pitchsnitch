import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { isAcceptedFileType, uploadDealFile } from "@/lib/storage";
import { DEAL_PLACEHOLDER_NAME } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

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

  const rawText = (form.get("raw_text") as string | null)?.trim() || null;
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  // At least one of file or text is required.
  if (!rawText && !hasFile) {
    return NextResponse.json(
      { error: "Provide a file or some text to create a deal." },
      { status: 400 }
    );
  }

  if (hasFile) {
    if (!isAcceptedFileType(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or DOCX." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 20MB)." },
        { status: 400 }
      );
    }
  }

  const admin = getSupabaseAdmin();

  // 1. Create the deal row FIRST, so the submission is never lost even if a
  //    later step (upload, webhook) fails.
  const { data: deal, error: dealError } = await admin
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

  // 2. Upload the file (if any). A failure here is non-fatal: keep the deal,
  //    keep the pasted text, and report the problem.
  let fileUrl: string | null = null;
  let fileWarning: string | null = null;
  if (hasFile) {
    try {
      const { signedUrl } = await uploadDealFile(dealId, file);
      fileUrl = signedUrl;
    } catch (e) {
      fileWarning = e instanceof Error ? e.message : "File upload failed.";
    }
  }

  // 3. Store the raw input (text and/or file URL) linked to the deal.
  const { error: rawError } = await admin.from("raw_inputs").insert({
    deal_id: dealId,
    source: "upload",
    raw_text: rawText,
    file_url: fileUrl,
  });

  // 4. Kick off the pipeline via the n8n webhook. Failure is non-fatal —
  //    the deal and raw input already exist and can be reprocessed.
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
    } catch (e) {
      const reason = e instanceof Error ? e.message : "unknown error";
      webhookWarning =
        `The deal was saved, but the analysis pipeline could not be reached: ` +
        `POST ${webhookUrl} failed (${reason}).`;
    }
  }

  // 5. Record why analysis won't complete, so the board and deal sheet can stop
  //    waiting and show the reason instead of an endless "Analyzing…".
  //    Best-effort: pre-0006 databases have no processing_error column.
  if (webhookWarning) {
    const { error: markError } = await admin
      .from("deals")
      .update({ processing_error: webhookWarning })
      .eq("id", dealId);
    if (markError) {
      console.error(
        `[deals/create] could not record processing_error on ${dealId}:`,
        markError.message
      );
    }
  }

  const warnings = [
    fileWarning,
    rawError ? `Raw input not saved: ${rawError.message}` : null,
    webhookWarning,
  ].filter(Boolean);

  return NextResponse.json(
    { deal_id: dealId, warnings },
    { status: 201 }
  );
}
