import { NextRequest, NextResponse } from "next/server";
import { searchFoods } from "@/lib/server/food-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 25) : 25;
  const items = await searchFoods(query, limit);
  return NextResponse.json({ query, total: items.length, items });
}
