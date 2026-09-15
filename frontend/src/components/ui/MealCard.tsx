import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Utensils, Coffee, Sun, Sunset, Moon } from "lucide-react";
import { MealCategoryFixture } from "@/lib/mockData";
import Link from "next/link";

interface MealCardProps {
  meal: MealCategoryFixture;
  onAddClick?: (mealType: string) => void;
}

export function MealCard({ meal }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);

  const getMealIcon = (type: string) => {
    switch (type) {
      case "breakfast":
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case "lunch":
        return <Sun className="w-4 h-4 text-emerald-500" />;
      case "snacks":
        return <Utensils className="w-4 h-4 text-blue-500" />;
      case "dinner":
        return <Moon className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sunset className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs transition-all duration-150 hover:border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            {getMealIcon(meal.type)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{meal.title}</h3>
            <p className="text-xs text-slate-500">
              {meal.items.length} {meal.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Calories & Action */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm font-extrabold text-slate-900">
              {totalCalories}
            </span>
            <span className="text-xs text-slate-400 ml-1">kcal</span>
          </div>

          <Link
            href={`/add-food?meal=${meal.type}`}
            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center hover:bg-emerald-100 transition-colors ml-1"
            title={`Add food to ${meal.title}`}
          >
            <Plus className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            aria-label={isExpanded ? "Collapse meal details" : "Expand meal details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded item details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
          {meal.items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1 text-center">
              No foods logged yet for {meal.title.toLowerCase()}.
            </p>
          ) : (
            meal.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0"
              >
                <div>
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {item.servingLabel} • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                  </div>
                </div>
                <div className="font-bold text-slate-700">
                  {item.calories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
