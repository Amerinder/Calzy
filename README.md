# Calzy

Calzy is a mobile-first calorie and nutrition tracker. It helps users calculate an estimated daily target, search standardized foods, select a practical serving, and prepare to log meals. Nutrition values are estimates from named data sources, not medical advice.

## Phase status

| Phase | Status | Delivered |
| --- | --- | --- |
| 0 – Foundation | Complete | Next.js, TypeScript, Tailwind design system, responsive landing page and checks. |
| 1 – UI shell | Complete | Dashboard, Add Food, Calendar and Profile routes; accessible shared components and mobile navigation. |
| 2 – Auth/profile | Complete | Supabase Auth clients, session middleware, profile migration and onboarding UI. |
| 3 – Targets | Complete | Mifflin–St Jeor calculator, goal/macro targets and dated target snapshots. |
| 4 – Food catalog | Complete | Food schema/migration, verified seed catalog, servings, server-side search and food detail APIs. |
| 5–10 | Planned | Logging, calendar history, favorites, insights and production polish. |

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS and reusable accessible React components
- Next.js Route Handlers running on Node.js for server APIs
- Supabase Auth and PostgreSQL
- FatSecret (first search provider) → USDA FoodData Central (fallback) → checked-in verified development catalog

The browser talks only to same-origin `/api/foods/*` endpoints. FatSecret and USDA credentials stay on the server.

## Local setup

1. Install Node.js 20.9+.
2. Copy `.env.example` to `frontend/.env.local` and set the variables you have.
3. Install and run:

```bash
npm install --prefix frontend
npm run dev
```

Open `http://localhost:3000`. The app builds without provider keys; food search then uses the verified local development catalog.

## Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth/profile | Public Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth/profile | Public browser anon key. |
| `FATSECRET_CLIENT_ID` | First live food provider | Server-only OAuth client id. |
| `FATSECRET_CLIENT_SECRET` | First live food provider | Server-only OAuth secret; never commit. |
| `USDA_API_KEY` | Live fallback provider | Server-only FoodData Central API key. |

Run `001_create_user_profiles.sql`, `002_create_daily_targets.sql`, then `003_create_food_catalog.sql` in the Supabase SQL Editor. The last migration includes indexes, catalog policies, and food/nutrition/serving seed data.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Check TypeScript. |
| `npm run build` | Create a production build. |

## Food search behavior

`GET /api/foods/search?q=egg` attempts FatSecret first. Only if it has no usable result (or is unavailable) does it query USDA. If neither is configured or reachable, it searches the checked-in verified catalog so local development remains useful. `GET /api/foods/suggestions` and `GET /api/foods/[foodId]` use the same server-side routing. All nutrition is normalized to a 100 g basis; servings carry an explicit gram equivalent.

## Known limitations / next phase

The Phase 4 Add Food screen can search and inspect a quantity, but it does not yet persist meal items or change dashboard totals. Phase 5 should complete the real user-facing quantity and food-detail flow; Phase 6 should add meal persistence and daily aggregation.
