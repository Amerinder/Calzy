import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aggregateDailyTotals, LoggedMealItem, MealType } from "@/lib/api/meals";
import { ScaledNutrition } from "@/lib/api/foods";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        date,
        authenticated: false,
        totals: aggregateDailyTotals(date, []),
      });
    }

    const { data: meals, error } = await supabase
      .from("meals")
      .select("id, date, meal_type, meal_items(*)")
      .eq("user_id", user.id)
      .eq("date", date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const items: LoggedMealItem[] = [];
    for (const m of meals || []) {
      const mealItems = (m.meal_items as Array<Record<string, unknown>>) || [];
      for (const it of mealItems) {
        items.push({
          id: String(it.id),
          meal_id: String(m.id),
          meal_type: m.meal_type as MealType,
          date: String(m.date),
          food_id: String(it.food_id),
          name: String(it.name),
          portion_label: String(it.portion_label),
          grams: Number(it.grams),
          quantity: Number(it.quantity || 1),
          nutrition_snapshot: it.nutrition_snapshot as ScaledNutrition,
          created_at: String(it.created_at),
        });
      }
    }

    const totals = aggregateDailyTotals(date, items);
    return NextResponse.json({ date, authenticated: true, totals });
  } catch {
    return NextResponse.json({
      date,
      authenticated: false,
      totals: aggregateDailyTotals(date, []),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, meal_type, food_id, name, portion_label, grams, quantity, nutrition_snapshot } = body;

    if (!date || !meal_type || !food_id || !name || !grams || !nutrition_snapshot) {
      return NextResponse.json({ error: "Missing required meal fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Unauthenticated client will handle via client-side storage
      return NextResponse.json({ success: true, localOnly: true });
    }

    // Upsert meal container
    const { data: meal, error: mealErr } = await supabase
      .from("meals")
      .upsert(
        { user_id: user.id, date, meal_type },
        { onConflict: "user_id,date,meal_type" }
      )
      .select("id")
      .single();

    if (mealErr || !meal?.id) {
      return NextResponse.json({ error: mealErr?.message || "Failed to create meal" }, { status: 500 });
    }

    // Insert meal item with immutable snapshot
    const { data: item, error: itemErr } = await supabase
      .from("meal_items")
      .insert({
        meal_id: meal.id,
        food_id,
        name,
        portion_label,
        grams,
        quantity: quantity || 1,
        nutrition_snapshot,
      })
      .select("*")
      .single();

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
