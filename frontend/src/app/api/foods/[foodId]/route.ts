import { NextRequest, NextResponse } from "next/server";
import { getFoodDetail } from "@/lib/server/food-service";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ foodId: string }> }) {
  const { foodId } = await params;
  const food = await getFoodDetail(foodId);
  return food ? NextResponse.json(food) : NextResponse.json({ error: "Food not found" }, { status: 404 });
}
