import { NextRequest, NextResponse } from "next/server";
import { getFoodDetail } from "@/lib/server/food-service";
import { FoodItem, scaleNutrition } from "@/lib/api/foods";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { food_id, food, grams, unit, quantity } = body;

    const parsedGrams = typeof grams === "number" ? grams : parseFloat(grams);

    if (isNaN(parsedGrams) || parsedGrams <= 0 || parsedGrams > 10000) {
      return NextResponse.json(
        {
          error: "Invalid grams parameter. Grams must be a positive number between 0.1 and 10000.",
        },
        { status: 400 }
      );
    }

    let foodItem: FoodItem | null = null;
    if (food && typeof food === "object" && food.nutrition) {
      foodItem = food as FoodItem;
    } else if (food_id && typeof food_id === "string") {
      foodItem = await getFoodDetail(food_id);
    }

    if (!foodItem) {
      return NextResponse.json(
        { error: "Food item not found or not provided." },
        { status: 404 }
      );
    }

    const scaled = scaleNutrition(foodItem, parsedGrams);

    return NextResponse.json({
      success: true,
      food_id: foodItem.id,
      food_name: foodItem.name,
      grams: parsedGrams,
      unit: unit || foodItem.default_unit,
      quantity: quantity || 1,
      scaled_nutrition: scaled,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
