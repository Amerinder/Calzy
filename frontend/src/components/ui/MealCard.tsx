import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Utensils, Coffee, Sun, Sunset, Moon, Trash2 } from "lucide-react";
import Link from "next/link";
import { DailyMealCategory, LoggedMealItem } from "@/lib/api/meals";

interface MockItem {
  id: string;
  name: string;
  servingLabel?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface GenericMeal {
  type: string;
  title: string;
  items: Array<LoggedMealItem | MockItem>;
  total_calories?: number;
}

interface MealCardProps {
  meal: DailyMealCategory | GenericMeal;
  onDeleteItem?: (itemId: string) => void;
  targetDate?: string;
}

export function MealCard({ meal, onDeleteItem, targetDate }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute total calories from snapshot or fallback
  const totalCalories =
    meal.total_calories !== undefined
      ? meal.total_calories
      : meal.items.reduce((sum, item) => {
          const snapCal = (item as LoggedMealItem).nutrition_snapshot?.calories;
          const mockCal = (item as MockItem).calories;
          return sum + (snapCal ?? mockCal ?? 0);
        }, 0);

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

  const addFoodUrl = `/add-food?meal=${meal.type}${targetDate ? `&date=${targetDate}` : ""}`;

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
            href={addFoodUrl}
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
            <div className="py-3 text-center flex flex-col items-center gap-1.5">
              <p className="text-xs text-slate-400 italic">
                No foods logged yet for {meal.title.toLowerCase()}.
              </p>
              <Link
                href={addFoodUrl}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Log {meal.title}
              </Link>
            </div>
          ) : (
            meal.items.map((rawItem) => {
              const logged = rawItem as LoggedMealItem;
              const mock = rawItem as MockItem;

              const label = logged.portion_label || mock.servingLabel || "1 portion";
              const cals = logged.nutrition_snapshot?.calories ?? mock.calories ?? 0;
              const protein = logged.nutrition_snapshot?.protein_g ?? mock.protein ?? 0;
              const carbs = logged.nutrition_snapshot?.carbs_g ?? mock.carbs ?? 0;
              const fat = logged.nutrition_snapshot?.fat_g ?? mock.fat ?? 0;

              return (
                <div
                  key={rawItem.id}
                  className="flex items-center justify-between text-xs py-2 px-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 truncate">{rawItem.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {label} • P: {protein}g | C: {carbs}g | F: {fat}g
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900">{cals}</span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">kcal</span>
                    </div>

                    {onDeleteItem && (
                      <button
                        onClick={() => onDeleteItem(rawItem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
