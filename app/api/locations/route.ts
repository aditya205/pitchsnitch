import { NextResponse } from "next/server";
import { suggestLocations } from "@/lib/locationSuggestions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  return NextResponse.json({
    suggestions: suggestLocations(query),
  });
}
