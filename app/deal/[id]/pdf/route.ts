import { NextResponse } from "next/server";
import { dealPdfFilename, generateDealPdf } from "@/lib/dealPdf";
import { getDealDetail } from "@/lib/deals";

export const dynamic = "force-dynamic";

function displayName(value: string | null | undefined) {
  const name = value?.trim();
  return !name || /^processing/i.test(name) ? "New submission" : name;
}

export async function GET(_request: Request, ctx: RouteContext<"/deal/[id]/pdf">) {
  const { id } = await ctx.params;
  const result = await getDealDetail(id);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 500;
    return NextResponse.json({ error: result.message }, { status });
  }

  const companyName = displayName(result.deal.company_name);
  const bytes = await generateDealPdf(result.deal);
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${dealPdfFilename(companyName)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
