# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CONTROL-Z is a GHG (Greenhouse Gas) inventory management system for Thai organizations, built to track and report emissions across Scope 1, 2, and 3. It generates standardized Thai government report forms (FR01–FR05).

## Repository Structure

```
CONTROL-Z/
├── Backend/          # FastAPI Python backend
├── Frontend/         # React + Vite + TypeScript frontend
└── docker-compose.yaml  # MySQL 8.0 + phpMyAdmin
```

## Backend

**Stack:** FastAPI · SQLModel · SQLAlchemy · PyMySQL · MySQL 8.0 · JWT auth · python-jose · fastapi-mail · loguru

### Running

```bash
cd Backend
# Copy and configure environment
cp .env.example .env

# Install dependencies
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload
```

API available at `http://127.0.0.1:8000`. Swagger docs at `/docs`.

### Running Tests

```bash
cd Backend
pytest
# Single test file
pytest tests/test_ghg_formulas.py
```

### Architecture

- `app/main.py` — FastAPI app, CORS middleware, static file mount (`/static` → `uploads/`)
- `app/api/v1/router.py` — aggregates all controller routers under `/api/v1`
- `app/controllers/` — thin HTTP layer; each file maps to a resource (auth, organizations, forms, ghg, calculations, reports, admin, etc.)
- `app/services/` — business logic (GHG calculations, EF resolution, email, activity persistence)
- `app/repositories/` — database query helpers
- `app/models/tables.py` — all SQLModel table definitions
- `app/core/` — config (pydantic-settings from `.env`), database engine/session, JWT security, FastAPI dependencies, access control helpers

**Auth flow:** JWT Bearer tokens. `get_current_user` → `get_current_privilege` dependency chain. `uall=1` in `user_privileges` means ADMIN; otherwise USER. `assert_org_access()` in `app/core/access.py` enforces org-scoped data isolation.

**GHG calculation layer:** Pure functions in `app/services/ghg_formulas.py` (IPCC AR5 GWP100 constants). EF resolution in `app/services/ef_resolver.py`. Emission calculation orchestration in `app/services/ef_calculation.py`.

### Database

MySQL 8.0 via Docker. Default connection: `mysql+pymysql://user:mysql%40%231234@127.0.0.1:3306/control_z`

Start the database:
```bash
docker-compose up -d
```

phpMyAdmin at `http://localhost:8080`.

## Frontend

**Stack:** React 19 · TypeScript · Vite · Ant Design 6 · Tailwind CSS 4 · React Router 7 · Zustand · Axios · Chart.js · ExcelJS · react-hook-form

### Running

```bash
cd Frontend
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Type-check + production build
npm run lint     # ESLint
```

Vite proxies `/api` to `http://127.0.0.1:8000` in dev — no `VITE_API_BASE_URL` needed unless testing cross-origin.

### Architecture

- `src/app/AppRouter.tsx` — all routes. Two protected route groups: `allowRole="USER"` (`/app/*`) and `allowRole="ADMIN"` (`/admin/*`)
- `src/app/layouts/` — `MainLayout` (user shell), `AdminLayout` (admin shell)
- `src/pages/` — one file per page; admin pages under `pages/admin/`, report templates under `pages/reports/`
- `src/lib/api/http.ts` — central `apiRequest<T>()` wrapper (Bearer token injection, 401 auto-logout, error parsing)
- `src/lib/api/service.ts` — typed API call functions used by pages/components
- `src/lib/` — pure utility modules: GHG formula bridges, Excel export, storage helpers, validation
- `src/components/` — shared UI components organized by feature (auth, dashboard, data-input, reports, admin)
- Pages are lazy-loaded via `src/pages/lazyPages.tsx`

**State management:** Zustand stores (auth store at minimum). Tokens stored via `src/lib/authToken.ts`. Session expiry checked on every API request.

**Report generation:** FR01–FR05 report templates in `src/pages/reports/fr0*/`. Each report has a model file (data mapping) and template file (render). Excel export via ExcelJS in `src/lib/excelTemplateExportService.ts`.

## Key Domain Concepts

- **Forms (GhgtForm):** An organization's GHG inventory submission for a reporting period
- **Scopes:** Scope 1 (direct), Scope 2 (electricity), Scope 3 (value chain) — stored in `scope` / `subject_scope` / `details_scope` tables
- **EF (Emission Factor):** Values from Thai/international databases (TGO, IPCC AR5 GWP100) used to convert activity data to CO₂e
- **FR04/FR05:** Primary GHG inventory report forms aligned with Thai government (TGO) standards
- **kgCO2e:** All emissions calculated in kg CO₂e, displayed in tCO₂e in the UI
