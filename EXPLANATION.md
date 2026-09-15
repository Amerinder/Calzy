# How Calzy works

Calzy is a responsive nutrition tracker designed around a phone screen. A visitor can create an account, enter body measurements and activity level, see estimated calorie/macro targets, and browse food data. The current implementation is complete through Phase 4; meal logging and historical totals intentionally begin in later phases.

## User flow

1. Landing leads to sign-in or onboarding.
2. Onboarding validates inputs, then uses Mifflin–St Jeor to estimate BMR and maintenance calories (TDEE).
3. The result page saves a dated target snapshot for a signed-in user.
4. Add Food calls a Next.js server endpoint, which tries FatSecret first, USDA second, and the verified local catalog last.
5. Serving selection scales nutrition from canonical 100 g values: `per_100g × grams / 100`.

These estimates are general wellness information, not medical advice.

## Architecture

The frontend is a Next.js 16 TypeScript application. `AppShell`, navigation, cards, inputs, progress bars and calorie rings keep the visual language consistent across dashboard, food search, calendar and profile pages. It is mobile-first, using bottom navigation at small widths and a wider desktop layout where space permits.

There is no separate Python or FastAPI service. Next.js Route Handlers are the Node.js backend boundary:

| Route | Responsibility |
| --- | --- |
| `/api/foods/search` | Returns FatSecret, then USDA, then verified local results. |
| `/api/foods/suggestions` | Returns de-duplicated names for autocomplete. |
| `/api/foods/[foodId]` | Returns nutrition and servings for the selected food. |

`src/lib/server/food-service.ts` is server-only. It handles OAuth token caching and third-party requests so API keys never enter the browser bundle. The client uses relative `/api` requests only.

## Data and privacy

Supabase provides authentication and PostgreSQL. `user_profiles` is linked to `auth.users`; `daily_targets` stores an effective date so later profile changes do not rewrite past targets. The food catalog is split into `foods`, `food_nutrition`, and `servings`: identity/source, values per 100 g, and human-friendly gram equivalents. Row-level security keeps profile and target rows private; catalog data is read-only.

The Phase 4 migration includes indexes and unique external IDs/serving labels to control duplicate imports. The development seed retains USDA/IFCT attribution.

## Target calculation

For male inputs BMR is `10 × kg + 6.25 × cm − 5 × age + 5`; for female inputs it ends in `−161`. TDEE is BMR multiplied by the selected activity factor. The goal selects a documented calorie adjustment and the macro helper derives protein, fat and carbohydrates. The deterministic logic lives in `src/lib/calculator.ts`.

## What changed in Phase 4

The old FastAPI/Python backend was removed and replaced with TypeScript Next.js Route Handlers. Food credentials are now `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`, and `USDA_API_KEY` in `frontend/.env.local`; only public Supabase values use the `NEXT_PUBLIC_` prefix. FatSecret is intentionally queried before USDA. Without provider credentials, the same UI works using the verified development catalog.

## Verification and tradeoffs

TypeScript checking passes. Live provider results require locally configured keys and were not fabricated or committed. A future import job can write provider-approved records into Supabase for a fully database-backed catalog. Meal persistence, dashboard aggregation, historical editing and custom foods remain later phases.
