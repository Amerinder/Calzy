import { NextRequest, NextResponse } from "next/server";
import { searchFoods } from "@/lib/server/food-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 100;
  const items = await searchFoods(query, limit, category);
  return NextResponse.json({ query, category, total: items.length, items });
}
