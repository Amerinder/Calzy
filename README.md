# Calzy 🥗 — Precision Nutrition & Calorie Tracking

Calzy is a mobile-first nutrition tracking web application engineered to empower individuals to take control of their health through effortless, accurate daily nutrition logging. By providing automated maintenance calorie (TDEE) calculations, rapid food search across trusted nutrition datasets, practical unit-aware portion sizing, and an interactive daily dashboard with calendar retrospectives, Calzy simplifies personal nutrition without clutter, gimmicks, or unreliable estimates.

---

## 📌 Phase Progress Tracker

| Phase | Description | Status | Verification & Health |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Foundation & Repository Rules** | 🟢 **Completed** | Next.js 15 App Router, FastAPI backend, design tokens, AppShell, landing page, documentation |
| **Phase 1** | **UI Shell and Navigation** | 🟢 **Completed** | Bottom navigation, dashboard anchor, reusable card/ring primitives, Add Food, Calendar & Profile shells |
| **Phase 2** | **Supabase Authentication & User Profile** | 🟢 **Completed** | Supabase Auth, persistent accounts, PostgreSQL RLS schema, onboarding form, session management |
| **Phase 3** | **Calorie Calculator & Daily Targets** | 🟢 **Completed** | Mifflin-St Jeor engine, activity multipliers, macro logic, daily_targets snapshots, onboarding result screen |
| **Phase 4** | **Food Database & Nutrition Import Pipeline**| 🟢 **Completed** | 21 verified authoritative foods (USDA & IFCT 2017), 100g basis schema, serving portion chips, search & detail endpoints, 24/24 unit tests |
| **Phase 5** | **Food Search, Quantity Selection & Details** | ⚪ *Planned* | Debounced search, unit-aware servings, scaled macros |
| **Phase 6** | **Meal Logging & Daily Calorie Progress** | ⚪ *Planned* | Meal item logging, real-time aggregation, ring & macro bars |
| **Phase 7** | **Calendar & Historical Daily Views** | ⚪ *Planned* | Historical day browsing, date-range queries, edit logs |
| **Phase 8** | **Favorites, Recent Foods & Custom Recipes** | ⚪ *Planned* | Quick re-logging, custom food/recipe builder |
| **Phase 9** | **Profile, Goals, Weight Tracking & Insights** | ⚪ *Planned* | Weight trend visualization, goal adjustments |
| **Phase 10**| **Mobile/PWA Polish, Testing & Production** | ⚪ *Planned* | PWA capabilities, end-to-end journey tests, production hardening |

---

## 🚀 Feature Matrix

| Feature Area | Feature Detail | Current Status |
| :--- | :--- | :--- |
| **Project Foundation** | Monorepo structure, unified scripts, linting/typechecking | ✅ Ready |
| **Design System** | Emerald health palette, rounded cards, typography tokens | ✅ Ready |
| **AppShell Pattern** | Clean mobile-first viewport shell centered on desktop | ✅ Ready |
| **Bottom Navigation** | 4 primary tabs: Today, Add Food (+), Calendar, Profile | ✅ Ready |
| **Component Primitives**| Card, Button, Input, ProgressBar, CalorieRing, MacroBar, MealCard | ✅ Ready |
| **Landing Page** | Value proposition, feature highlights, direct dashboard entry | ✅ Ready |
| **Dashboard Shell** | CalorieRing anchor, 3 MacroBars, 4 expandable MealCards | ✅ Ready |
| **Add Food Shell** | Fast search, portion size chips, custom grams input | ✅ Ready |
| **Calendar Shell** | Month grid, target adherence indicators, daily summary | ✅ Ready |
| **Profile Shell** | Personal metrics, Mifflin-St Jeor TDEE preview | ✅ Ready |
| **Backend Health** | FastAPI `/health` endpoint & CORS configuration | ✅ Ready |
| **User Accounts** | Supabase Auth, session persistence, onboarding form | ✅ Ready |
| **Data Isolation** | PostgreSQL Row-Level Security (RLS) policies | ✅ Ready |
| **Calculator Engine** | BMR (Mifflin-St Jeor), TDEE & macro targets with safety floors | ✅ Ready |
| **Target Snapshots** | Immutable daily_targets table in PostgreSQL | ✅ Ready |
| **Onboarding Result**| Interactive review screen with BMR, TDEE & macro breakdown | ✅ Ready |
| **Food Catalog** | USDA FoodData Central & Indian Food Composition normalization (21 verified items) | ✅ Ready |
| **Portion Scaling** | Unit-aware serving chips, custom weight inputs, deterministic scaling | ✅ Ready |
| **Catalog API** | `/api/v1/foods/search`, `/api/v1/foods/{id}`, `/api/v1/foods/{id}/scale` | ✅ Ready |
| **Daily Logging** | Breakfast, Lunch, Snacks, Dinner with nutrition snapshots | ⏳ Phase 6 |
| **Calendar History** | Day selection, monthly summaries, past meal inspection | ⏳ Phase 7 |

---

## 🛠 Tech Stack

- **Frontend**:
  - **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript, React 19)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/) with centralized design tokens
  - **Icons**: [Lucide React](https://lucide.dev/)
  - **Visualizations**: Lightweight SVG/CSS progress rings and macro progress bars
- **Backend**:
  - **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.14)
  - **Server**: [Uvicorn](https://www.uvicorn.org/) ASGI server
  - **Validation & Settings**: [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
  - **Testing**: [Pytest](https://pytest.org/) & `httpx` TestClient (24/24 passing)
- **Database & Services**:
  - **Database**: PostgreSQL managed via [Supabase](https://supabase.com/)
  - **Food Datasets**: USDA FoodData Central (Foundation/SR Legacy) & ICMR-NIN Indian Food Composition Tables (IFCT 2017)

---

## 📂 Project Structure

```
Calzy/
├── frontend/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── add-food/         # Verified food catalog search & serving portion calculator
│   │   │   ├── dashboard/        # Main tracking dashboard
│   │   │   ├── onboarding/       # Personal metric calculation & daily target snapshot
│   │   │   ├── login/            # Supabase Auth registration and sign-in
│   │   │   └── page.tsx          # Landing page
│   │   ├── components/layout/    # AppShell, Navbar, BottomNav, Footer
│   │   ├── components/ui/        # CalorieRing, MacroBar, MealCard, Button, Input
│   │   └── lib/api/foods.ts      # Authoritative verified food catalog & portion scaling engine
├── backend/                      # FastAPI Python service
│   ├── app/
│   │   ├── api/v1/endpoints/     # health.py, calculator.py, foods.py
│   │   ├── services/             # calculator.py, food_importer.py, food_catalog.py
│   │   ├── schemas/              # food.py (Pydantic v2 models)
│   │   └── main.py               # FastAPI entrypoint, middleware, root routing
│   ├── data/
│   │   └── seed_foods.json       # 21 verified authoritative food records (USDA & IFCT 2017)
│   ├── tests/
│   │   ├── test_calculator.py    # 7 unit tests for Mifflin-St Jeor & macro math
│   │   ├── test_foods.py         # 14 unit tests for food catalog, scaling & endpoints
│   │   └── test_health.py        # Health endpoint tests
│   └── requirements.txt          # Python dependencies
├── supabase/
│   └── migrations/
│       ├── 001_create_user_profiles.sql  # User profile table & auth trigger
│       ├── 002_create_daily_targets.sql  # Daily target snapshot table with RLS
│       └── 003_create_food_catalog.sql   # Foods, food_nutrition, servings schema & seed
├── README.md                     # Project manual and progress status (this document)
└── EXPLANATION.md                # Architectural explanation and developer handbook
```

---

## 💻 Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0 or newer (tested with v24.9.0)
- **npm**: v9.0 or newer (tested with v11.6.0)
- **Python**: 3.10 or newer (tested with v3.14.7)

### 1. Clone & Configure Environment
```bash
# Copy the environment variable templates
cp .env.example frontend/.env.local
cp .env.example backend/.env
```

### 2. Frontend Installation & Startup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Installation & Startup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API root: [http://localhost:8000](http://localhost:8000)
- Interactive Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)
- Food search: [http://localhost:8000/api/v1/foods/search?q=roti](http://localhost:8000/api/v1/foods/search?q=roti)

---

## 🔐 Environment Variables (.env.example)

| Variable | Target | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL of the FastAPI backend | `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Frontend | Supabase public anon key | `eyJhbG...` |
| `ENVIRONMENT` | Backend | Current runtime mode | `development` |
| `PORT` | Backend | HTTP port for Uvicorn | `8000` |
| `CORS_ORIGINS` | Backend | Allowed origin list for browser clients| `["http://localhost:3000"]` |
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `USDA_API_KEY` | Backend | (Optional) Live USDA FoodData Central sync | `your-key` |

---

## 🧪 Development, Linting & Verification Commands

From the workspace root or respective subdirectories:

| Task | Command | Description |
| :--- | :--- | :--- |
| **Frontend Dev** | `npm run dev --prefix frontend` | Starts Next.js dev server on port 3000 |
| **Backend Dev** | `python -m uvicorn app.main:app --reload --port 8000` | Starts FastAPI Uvicorn on port 8000 |
| **Frontend Typecheck**| `npm run typecheck --prefix frontend` | Runs `tsc --noEmit` to verify TypeScript types |
| **Frontend Build** | `npm run build --prefix frontend` | Compiles production Next.js build |
| **Backend Tests** | `python -m pytest backend/tests` | Executes full Pytest test suite (24/24 passing) |

---

## 🗄️ Database Setup & Migrations

### Running Migrations in Supabase
1. Open your Supabase Project Dashboard at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab from the left navigation.
3. **Migration 001**: Run [`supabase/migrations/001_create_user_profiles.sql`](file:///c:/Users/ameri/OneDrive/Documents/Calzy/supabase/migrations/001_create_user_profiles.sql) (creates user profiles and auth trigger).
4. **Migration 002**: Run [`supabase/migrations/002_create_daily_targets.sql`](file:///c:/Users/ameri/OneDrive/Documents/Calzy/supabase/migrations/002_create_daily_targets.sql) (creates daily target snapshots with RLS).
5. **Migration 003**: Run [`supabase/migrations/003_create_food_catalog.sql`](file:///c:/Users/ameri/OneDrive/Documents/Calzy/supabase/migrations/003_create_food_catalog.sql) (creates `foods`, `food_nutrition`, and `servings` tables with 21 verified authoritative food records).

---

## 🌐 External Accounts & Services Checklist

- **Supabase**: Connected in Phase 2 for Auth and managed PostgreSQL.
- **USDA FoodData Central / ICMR-NIN**: Seed dataset is packaged out-of-the-box (no external API key required for core catalog). Optional `USDA_API_KEY` for live batch sync.
- **Vercel / Render**: Planned for Phase 10 cloud deployment.

---

## ⚠️ Known Limitations & Next Phase

### Current Limitations (Phase 4)
- Adding food from `/add-food` demonstrates verified portion selection, live 100g scaling, and temporary feedback state; persistent daily meal logging to Supabase is the explicit focus of **Phase 6**.
- Favorite foods toggling and custom food creation will be expanded in **Phase 8**.

### Next Phase
- **Phase 5 — Food Search, Quantity Selection, and Nutrition Details**: Complete the interactive food search, quantity selection modal, micro-nutrient details view, and meal selector preparation for database persistence.
