import { NextRequest, NextResponse } from "next/server";
import { foodSuggestions } from "@/lib/server/food-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 8), 1), 20);
  return NextResponse.json(query ? await foodSuggestions(query, limit) : []);
}
