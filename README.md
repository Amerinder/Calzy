# Calzy — Precision Nutrition & Calorie Tracker

Calzy is a mobile-first calorie and macronutrient tracking web application designed for simplicity, scientific accuracy, and everyday habit formation. Built around a clean health aesthetic, Calzy enables users to calculate their Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) using the clinically validated Mifflin-St Jeor formula, browse a verified catalog of standardized Indian and western foods, select practical serving units (e.g., 1 roti, 1 cup dal, 2 eggs, or exact grams), inspect portion-scaled nutrition facts, and maintain daily wellness consistency. All nutrition values are derived from authoritative datasets and served as standardized estimates rather than medical prescriptions.

---

## Current Phase & Phase Status

Calzy is engineered incrementally in strict numbered phases. **Phase 5 is complete.**

| Phase | Title | Status | Scope Delivered |
| :--- | :--- | :---: | :--- |
| **Phase 0** | Project Foundation & Conventions | **Complete** | Next.js 16 App Router foundation, TypeScript, Tailwind CSS design tokens, responsive AppShell, documentation contracts, and linting/build pipeline. |
| **Phase 1** | UI Shell & Responsive Navigation | **Complete** | Bottom navigation bar for mobile, responsive desktop layout, shared components (`Card`, `Button`, `Input`, `CalorieRing`, `MacroBar`, `MealCard`, `EmptyState`, `LoadingState`). |
| **Phase 2** | Supabase Auth & User Profiles | **Complete** | Supabase Auth integration (email/password), session persistence, protected route middleware, onboarding questionnaire (age, gender, height, weight, activity, goal), and user profile table. |
| **Phase 3** | Calorie Calculator & Daily Targets | **Complete** | Tested Mifflin-St Jeor calculation service, activity multipliers, goal adjustments (-500/+350 kcal), gender safety floors (1200/1500 kcal), macro ratio allocation, persistent `daily_targets` snapshots, and unit tests. |
| **Phase 4** | Food Database & Nutrition Pipeline | **Complete** | Relational catalog schema (`foods`, `food_nutrition`, `servings`), 21-item verified seed dataset (USDA + ICMR-NIN IFCT 2017), server-side Next.js Route Handlers (`/api/foods/search`, `/api/foods/suggestions`, `/api/foods/[foodId]`), Supabase database integration, dual FatSecret & USDA live search fallback, and user's past 5 searches tracking. |
| **Phase 5** | Food Search & Quantity Selection | **Complete** | Complete user-facing food logging selection flow: unit-aware portion selectors (pieces, rotis, eggs, cups, ml, grams), multiplier steppers, custom quantity control with bounds validation (1g-5,000g), live scaled macronutrient & micronutrient breakdown (protein, carbs, fat, fiber, net carbs, sodium, potassium, calcium, iron, sugars), review before logging stage, favorites bookmarking, recent logged foods, backend `/api/foods/calculate` endpoint, automated scaling tests, and clean headerless search history chips. |
| **Phase 6** | Meal Logging & Real-time Totals | *Planned* | Persistent `meals` and `meal_items` tables, live dashboard aggregation, and nutritional snapshots. |
| **Phase 7** | Historical Calendar & Daily Views | *Planned* | Interactive monthly calendar, past-date inspection, and date-specific meal edits. |
| **Phase 8** | Favorites, Recents & Custom Foods | *Planned* | User-defined custom recipes, persistent database favorites, and historical meal templates. |
| **Phase 9** | Profile, Goals & Weight Tracking | *Planned* | Weight history charts, target recalculation workflows, and monthly nutrition insights. |
| **Phase 10**| Mobile/PWA Polish & MVP Readiness | *Planned* | Service worker PWA installation, offline capabilities, accessibility audit, and production deployment. |

---

## Feature List

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Scientific BMR / TDEE Calculator** | Completed | Calculates metabolic rates via Mifflin-St Jeor with activity coefficients and safety boundaries. |
| **Calorie & Macro Target Allocation** | Completed | Automatically derives optimal daily calories, protein (2.0g/kg), fat (0.9g/kg), and carbohydrate split. |
| **Persistent Target Snapshots** | Completed | Saves daily targets tied to effective dates in Supabase so historical logs remain accurate. |
| **Supabase Authentication** | Completed | Secure user signup, login, session persistence, and server-side middleware protection. |
| **Standardized Food Catalog** | Completed | Normalized foods table with strictly per-100g nutrition facts and human-friendly serving portions. |
| **Server-Side Food Search API** | Completed | `/api/foods/search` and `/api/foods/[foodId]` with Supabase DB queries, live provider fallbacks, and local catalog. |
| **Category Filtering** | Completed | Browse foods by categories (Poultry & Meat, Dairy & Eggs, Indian Breads, Lentils & Legumes, Grains, etc.). |
| **User's Past 5 Food Searches** | Completed | Real-time tracking of the user's last 5 searches with clean headerless quick-filter pills, individual remove, and clear all. |
| **Unit-Aware Portion Scaling** | Completed | Predefined unit labels (eggs, rotis, pieces, cups, ml, grams), multiplier steppers (0.5x-3x), and custom quantity validation (1g-5000g). |
| **Detailed Nutrition Facts & Micros** | Completed | Live breakdown of calories, protein, carbs, net carbs, fat, fiber, sodium, potassium, calcium, iron, and sugar. |
| **Pre-Log Food Review Stage** | Completed | Review card detailing target meal, exact selected portion, gram equivalent, and scaled macros before adding. |
| **Favorites & Recent Logged Foods** | Completed | Bookmarking daily staples and tracking recently logged items with fallback recommendations. |
| **Meal Logging & Dashboard Totals** | Planned | Phase 6: Saving meal items to Breakfast, Lunch, Snacks, and Dinner with live ring updates. |
| **Historical Calendar Logging** | Planned | Phase 7: Browsing and editing past logs across months. |

---

## Tech Stack

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with React 19 and TypeScript.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a curated mobile-first design token system (emerald primary accent, slate neutrals, soft card surfaces).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Backend & APIs**: Next.js Route Handlers running on Node.js runtime (server-only security boundary in `frontend/src/app/api/` and `frontend/src/lib/server/`). As specified in the master prompt (Phase 0), Route Handlers act as the cohesive backend, eliminating the need for a separate Express or FastAPI service.
- **Database & Auth**: [Supabase](https://supabase.com/) (Managed PostgreSQL 15, Row-Level Security, and Supabase Auth).
- **Nutrition Data Sources**: 
  - [FatSecret Platform API](https://platform.fatsecret.com/) (Live commercial food & recipe search)
  - [USDA FoodData Central](https://fdc.nal.usda.gov/) (Authoritative foundation and survey foods)
  - [ICMR-NIN Indian Food Composition Tables (IFCT 2017)](https://www.nin.res.in/) (Standardized Indian staples)
- **Testing**: Built-in Node.js Test Runner (`node --test`) for deterministic calculator tests.

---

## Folder & Project Structure

```
Calzy/
├── README.md                      # Primary project overview, setup guide, and phase tracker
├── EXPLANATION.md                 # Architecture, engineering rationale, and data flow explanations
├── package.json                   # Root workspace orchestration scripts
├── .env.example                   # Safe template for local environment variables
├── frontend/                      # Next.js 16 TypeScript web application
│   ├── package.json               # Frontend dependencies, scripts, and build commands
│   ├── tsconfig.json              # TypeScript strict configuration
│   ├── next.config.ts             # Next.js configuration
│   ├── src/
│   │   ├── middleware.ts          # Supabase session refresh and route protection
│   │   ├── app/                   # App Router pages and API routes
│   │   │   ├── layout.tsx         # Root HTML layout and viewport setup
│   │   │   ├── page.tsx           # Product landing page with hero and feature highlights
│   │   │   ├── login/page.tsx     # Authentication page (Sign in / Sign up)
│   │   │   ├── onboarding/        # Multi-step BMR and goal questionnaire
│   │   │   ├── dashboard/page.tsx # Calorie ring, daily macro progress, and meal cards
│   │   │   ├── add-food/page.tsx  # Food search, category filtering, past 5 searches, & portions
│   │   │   ├── calendar/page.tsx  # Monthly calendar and historical day navigation
│   │   │   ├── profile/page.tsx   # User profile, physical statistics, and account management
│   │   │   └── api/foods/         # Server-side Route Handlers
│   │   │       ├── search/        # GET /api/foods/search?q=...&category=...&limit=...
│   │   │       ├── suggestions/   # GET /api/foods/suggestions?q=...
│   │   │       ├── calculate/     # POST /api/foods/calculate (pure server validation)
│   │   │       └── [foodId]/      # GET /api/foods/[foodId]
│   │   ├── components/            # Reusable UI primitives
│   │   │   ├── layout/AppShell.tsx # Mobile-first shell with bottom navigation
│   │   │   └── ui/                # Card, Button, Input, CalorieRing, MacroBar, MealCard, etc.
│   │   └── lib/                   # Shared libraries, utilities, and services
│   │       ├── calculator.ts      # Mifflin-St Jeor BMR, TDEE, and macro calculation engine
│   │       ├── mockData.ts        # Clearly demarcated mock fixtures for development
│   │       ├── tokens.ts          # Design token constants
│   │       ├── api/foods.ts       # Food types, client fetchers, and 21 verified seed items
│   │       ├── server/food-service.ts # Server-only food search, Supabase DB & external integration
│   │       ├── supabase/          # Browser and server Supabase client factories
│   │       └── __tests__/         # Unit test suite for calculation engine
│   └── public/                    # Static assets, icons, and manifests
└── supabase/
    └── migrations/                # Version-controlled PostgreSQL migrations
        ├── 001_create_user_profiles.sql  # User profile table and RLS policies
        ├── 002_create_daily_targets.sql   # Daily targets snapshot table and indexes
        └── 003_create_food_catalog.sql    # Foods, nutrition, servings schema & seed dataset
```

---

## Local Setup Instructions

### Prerequisites
- **Node.js**: v20.9.0 or higher
- **npm**: v10.0.0 or higher
- A free **Supabase** account (or local Supabase CLI) for Auth and PostgreSQL

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Amerinder/Calzy.git
   cd Calzy
   ```

2. **Configure environment variables**:
   Create a `.env.local` file inside the `frontend/` directory:
   ```bash
   cp .env.example frontend/.env.local
   ```
   Open `frontend/.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

3. **Install dependencies**:
   ```bash
   npm install --prefix frontend
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Mobile viewport simulation (390×844px) is recommended in Developer Tools.

---

## Environment Variables

| Variable | Environment | Required | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes | Public URL of your Supabase project (e.g. `https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Yes | Public Supabase anonymous client key with Row-Level Security enforcement. |
| `FATSECRET_CLIENT_ID` | Server-only | Optional | OAuth Client ID for FatSecret Platform. Never exposed to browser bundle. |
| `FATSECRET_CLIENT_SECRET` | Server-only | Optional | OAuth Client Secret for FatSecret. Never exposed to browser bundle. |
| `USDA_API_KEY` | Server-only | Optional | API key for USDA FoodData Central. Used as live search fallback. |

*Note: Calzy functions completely out-of-the-box even without FatSecret or USDA API keys by leveraging the built-in verified food catalog and Supabase database.*

---

## Commands

All commands can be run from the root directory or inside `frontend/`:

| Command | Working Dir | Description |
| :--- | :---: | :--- |
| `npm run dev` | Root | Starts Next.js development server on `http://localhost:3000`. |
| `npm run lint` | Root | Runs ESLint across all TypeScript and TSX files. |
| `npm run typecheck` | Root | Runs `tsc --noEmit` to verify strict TypeScript typing. |
| `npm test` | Root | Executes the automated Mifflin-St Jeor unit test suite via `node --test`. |
| `npm run build` | Root | Compiles a production-ready Next.js application bundle. |

---

## Database Setup & Migrations

Execute the SQL scripts in order using the **Supabase SQL Editor** or Supabase CLI:

1. **`001_create_user_profiles.sql`**:
   Creates the `public.user_profiles` table linked to `auth.users`, enabling profile storage for age, height, weight, gender, activity level, and goals with strict Row-Level Security (RLS).
2. **`002_create_daily_targets.sql`**:
   Creates `public.daily_targets` with effective date indexing, ensuring historical targets remain untouched when user stats change.
3. **`003_create_food_catalog.sql`**:
   Creates normalized `public.foods`, `public.food_nutrition`, and `public.servings` tables with search indexes, public read access, and seeds 21 verified foods from USDA and ICMR-NIN IFCT 2017.

---

## External Accounts & Services

- **Supabase**: Required for authentication and database storage. Create a project at [supabase.com](https://supabase.com/).
- **USDA FoodData Central**: Optional live API key. Register for free at [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup.html).
- **FatSecret Platform API**: Optional commercial nutrition data provider. Register at [platform.fatsecret.com](https://platform.fatsecret.com/).

---

## Known Limitations & Next Phase

- **Current Limitation**: While food selection, unit-aware portion scaling, micronutrient calculation, and pre-log review stages are fully operational, meal item database persistence (`meals` and `meal_items` tables) and real-time dashboard calorie ring aggregation are scoped strictly for Phase 6 per the specification prompt. Clicking "Log to Meal" currently generates the auditable snapshot and records to local recent history with visual feedback.
- **Next Phase (Phase 6)**: Meal logging, database persistence (`meals` and `meal_items`), daily calorie ring progress updates, real-time dashboard macro aggregation, and item deletion/edit behavior.
