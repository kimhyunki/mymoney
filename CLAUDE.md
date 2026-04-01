# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyMoney is a web app that visualizes household finances (customer info, cash flow, financial assets) by uploading Excel files.

## Running the Development Environment

**Full Docker stack (recommended):**
```bash
./start.sh
```
- Frontend: http://localhost:8050
- Backend: http://localhost:8051
- Database: localhost:8052

**Frontend local dev:**
```bash
cd frontend && npm install && npm run dev  # http://localhost:3000
```

**Key frontend commands:**
```bash
npm run build   # TypeScript compile + Vite bundle
npm run lint    # ESLint check
npm run preview # Preview build output
```

**Backend migrations (while Docker is running):**
```bash
docker exec mymoney-backend alembic revision --autogenerate -m "description"
docker exec mymoney-backend alembic upgrade head
```

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript, Vite, React Router 7, React Query 5, Recharts, Tailwind CSS 4
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, APScheduler
- **DB:** PostgreSQL

### Data Flow
```
Excel file → excel_parser → DataRecord (raw JSON) → data_service → Customer/CashFlow tables
```

Each Excel row is stored in `data_record` table as JSON with column index keys (`{"1": val, "2": val, ...}`).

### Backend Structure
- `app/api/` — FastAPI routes (upload.py, data.py)
- `app/models/models.py` — All SQLAlchemy ORM models
- `app/schemas/schemas.py` — All Pydantic schemas
- `app/services/data_service.py` — Core business logic (Excel parsing, extraction, storage)
- `app/services/scheduler_service.py` — 30-second background sync
- `alembic/versions/` — Migration files (sequential prefix: 001_, 002_, ...)

### Frontend Structure
- `src/pages/` — Route-level pages (Home, Uploads, Visualization, Customers, CashFlow)
- `src/components/` — Reusable components (Charts, Modals, Layout, etc.)
- `src/lib/api.ts` — All backend API call functions
- `src/lib/queryClient.ts` — React Query configuration
- `src/types/index.ts` — All TypeScript type definitions

## Core Pattern: Adding a New Data Type

Standard pattern when extracting new data from Excel (like Customer, CashFlow):

1. **Model** (`models.py`): include `data_record_id` ForeignKey + `created_at`/`updated_at`
2. **Schema** (`schemas.py`): Base → Create → Response 3-level structure, `from_attributes = True`
3. **Migration**: `alembic revision --autogenerate`, add model import to `alembic/env.py`
4. **Service** (`data_service.py`): find section header → extract data rows → upsert
5. **API** (`data.py`): GET `/your-models` + POST `/sheets/{sheet_id}/extract-your-data`
6. **Scheduler** (`scheduler_service.py`): add `sync_*` function, register job in `start_scheduler()`
7. **Frontend**: type in `types/index.ts` → function in `lib/api.ts` → component (`refetchInterval: 30000`)

## Important Rules

**Excel data handling:**
- Values in `data_record.data` can be `int`, `float`, or `str` — always check with `isinstance()` before converting
- Number conversion requires try-except; remove commas before converting (`replace(',', '')`)
- Exclude summary rows, headers, and section titles using `exclude_keywords` lists

**Scheduler / frontend sync:**
- Scheduler default interval: 30s (adjustable via `CUSTOMER_SYNC_INTERVAL` env var)
- Frontend React Query also uses `refetchInterval: 30000` to match

**Migrations:**
- Use sequential prefix for filenames: `001_`, `002_`, `003_` ...
- Always verify `down_revision` matches the previous migration's `revision` ID

**Environment variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `VITE_API_URL` — Backend URL for frontend (default: http://localhost:8051)

## Documentation Rules (docs/)

**File naming:**
- Same document content must share the same number.
- Always create both formats: `.md` (edit/reference) and `.html` (viewing).
- Format: `NNN-kebab-title.md` + `NNN-kebab-title.html` (3-digit zero-padded number)

**Current documents:**
```
docs/
├── 001-refactoring-analysis.md    / 001-refactoring-analysis.html
└── 002-architecture-and-design.md / 002-architecture-and-design.html
```

**HTML style:**
- Dark theme CSS (base `--bg: #0f1117`) — refer to `docs/001-refactoring-analysis.html`
- Component diagrams must be SVG (no ASCII art)
- Document number must appear in both the header meta and the footer

**Language:**
- `.md` files: English prose + Korean domain proper nouns kept as-is (e.g. 뱅샐현황, 총 결산, 고정비)
- `.html` files: Korean (human-readable viewing format)

## Git Remote

- Remote URL: `git@github.com-kimhyunki:kimhyunki/mymoney.git`
- SSH alias `github.com-kimhyunki` → `~/.ssh/kimhyunki/id_rsa` key → GitHub account `kimhyunki`
- Do NOT use the `github.com-connev` alias for this repo — that maps to the `khk04` account

If remote is misconfigured:
```bash
git remote set-url origin git@github.com-kimhyunki:kimhyunki/mymoney.git
```
