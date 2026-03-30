# Architecture & Software Design Document

> Date: 2026-03-30
> Source: `ref/26_가계부_재무재표.xlsx` + full codebase
> Tool: Claude Code (claude-sonnet-4-6)

---

## Key Files Analyzed

| File | Role |
|------|------|
| `ref/26_가계부_재무재표.xlsx` | Excel data source for design |
| `backend/app/models/models.py` | SQLAlchemy ORM models |
| `backend/app/schemas/schemas.py` | Pydantic request/response schemas |
| `backend/app/services/data_service.py` | Core business logic |
| `backend/app/services/excel_parser.py` | Excel parsing |
| `backend/app/services/scheduler_service.py` | Background auto-sync |
| `backend/app/api/upload.py` | File upload router |
| `backend/app/api/data.py` | Data query/extraction router |
| `frontend/src/types/index.ts` | TypeScript type definitions |
| `frontend/src/lib/api.ts` | API client |

---

## 1. Project Overview

**MyMoney** is a web visualization app for users who manage household finances via Excel files.
Uploading a BankSalad-export Excel file automatically extracts customer info, cash flow, fixed expenses, financial goals, and real estate analysis — then presents them as charts and dashboards.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router 7, React Query 5, Recharts, Tailwind CSS 4 |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, APScheduler |
| Database | PostgreSQL |
| Infra | Docker Compose |

### Runtime Ports

| Service | Port | Command |
|---------|------|---------|
| Frontend | 8050 | `./start.sh` |
| Backend | 8051 | `./start.sh` |
| Database | 8052 | `./start.sh` |
| Frontend (local dev) | 3000 | `cd frontend && npm run dev` |

---

## 2. Excel Data Source Analysis

### 2.1 Sheet Overview

| Sheet name | Rows | Cols | Content | Extraction target | Status |
|------------|------|------|---------|-------------------|--------|
| 뱅샐현황 (26-01) | ~163 | 17 | Customer info + monthly cash flow | Customer, CashFlow | ✅ supported |
| 뱅샐현황 (26-02) | ~164 | 17 | Customer info + monthly cash flow | Customer, CashFlow | ✅ supported |
| 고정비 (26) | 59 | 19 | Fixed expenses by account/bank/item | FixedExpense | 🔲 new |
| 총 결산 | 57 | 18 | Monthly income/expense/net summary | MonthlySummary | 🔲 new |
| 평촌 자이 퍼스티니 분양금 계획 | long | 15 | Financial goal plan vs. execution | FinancialGoal | 🔲 new |
| 부동산 수익분석 | 41 | 10 | ROE, leverage, asset structure | RealEstateAnalysis | 🔲 new |
| Sheet2 | 55 | 8 | Simple/compound interest simulation | (none) | - |
| Sheet3 | 23 | 4 | Input data for real estate analysis | (RealEstateAnalysis aux) | - |

---

### 2.2 Sheet Detail

#### 뱅샐현황 (26-01, 26-02) — fully supported

**Customer info area (Row 3–6):**

| Row | C col | D col |
|-----|-------|-------|
| 3 | 이름 | 김현기 |
| 4 | 성별 | 남 |
| 5 | 연령(만 나이) | 40 |
| 6 | 신용점수(KCB) | 1000 |

**Cash flow area (Row 9+):**

```
Row 9  : section header — "2.현금흐름현황"
Row 11 : column header — C:항목 | D:총계 | E:월평균 | F–Q: month cols (YYYY-MM, 13 months)
Row 12+: income items (금융수입, 급여, 기타수입, 상여금, ...)
       : 월수입 총계
       : expense items (경조/선물, 교육/학습, 교통, 금융, 생활, ...)
       : 월지출 총계
```

**Sample data:**

| Item | Total | Avg | 2025-02 | 2025-03 | ... | 2026-01 |
|------|-------|-----|---------|---------|-----|---------|
| 급여 | 68,762,553 | 5,289,427 | 5,072,536 | 5,340,956 | ... | 10,334,456 |
| 월수입 총계 | 70,510,042 | 5,423,849 | 5,076,671 | 5,343,643 | ... | 10,368,100 |
| 생활 | 8,170,860 | 628,527 | 759,630 | ... | ... | 491,830 |
| 월지출 총계 | 7,127,756 | 548,289 | 697,028 | ... | ... | 3,476,702 |

---

#### 고정비 (26) — FixedExpense (new)

**Header row (Row 2):**

```
B: 계좌(번호)  C: 은행  D: 예금주  E: 이체명  F: 성향  G: 항목  H–S: 01월–12월
```
→ In `data_record.data`: `"1"`–`"6"` = metadata, `"7"`–`"18"` = monthly amounts

**Sample data (Row 3–10):**

| 계좌 | 은행 | 예금주 | 이체명 | 성향 | 항목 | Jan | Feb |
|------|------|--------|--------|------|------|-----|-----|
| 528420827040 | 미래에셋 | 김현기 | 현기 저축 | 저축(연금) | 현기 연금 | 200,000 | 200,000 |
| 3333013251119 | 카카오 | 김현기 | 현기 용돈 | 용돈 | 현기 교통비 | 50,000 | 50,000 |
| 1002554581178 | 우리 | 김현기 | 현기 보험 | 보험(삼성) | 현기보험 | 12,629 | 12,629 |

**Category (성향) values:** 저축(연금), 용돈, 보험, 교육, 생활비, 주거, 통신

---

#### 총 결산 — MonthlySummary (new)

**Layout:**

```
B2: year (2026)   C2–N2: month headers (Jan–Dec)
B3: 월 수입        C3–N3: monthly income
B4: 월 지출        C4–N4: monthly expense
B5: 월 순수익      C5–N5: net income (income - expense)
B6: 누적 순수익    C6–N6: cumulative net income
B24: 투자 원금     C24–N24: investment principal
B25: 평가금        C25–N25: investment market value
```
→ In `data_record.data`: `"1"` = row label, `"2"`–`"13"` = Jan–Dec values

**Sample data (2026):**

| Row label | Jan | Feb | Mar+ |
|-----------|-----|-----|------|
| 월 수입 | 10,368,100 | 9,668,527 | 0 (not entered) |
| 월 지출 | 3,476,702 | 3,357,958 | 0 |
| 월 순수익 | 6,891,398 | 6,310,569 | 0 |
| 누적 순수익 | 6,891,398 | 13,201,967 | 13,201,967 |
| 투자 원금 | 119,345,971 | 139,028,365 | — |
| 평가금 | 86,806,114 | 104,346,609 | — |

---

#### 평촌 자이 퍼스티니 분양금 계획 — FinancialGoal (new)

**Metadata area (Row 2–10):**

| Field | Value |
|-------|-------|
| Target amount | 240,523,700 KRW |
| Start date | 2025-10 (estimated) |
| End date | 2027-12 (estimated) |
| Annual rate | 5% |
| Total weeks | 117 (2yr 2mo) |
| Elapsed weeks | 25 (5mo) |
| Remaining weeks | 92 (1yr 9mo) |
| Progress | 21.37% |
| Weekly allocation | 1,943,276 KRW |

**Plan/execution area (Row 14+):**

```
Row 14–15: section split — left "계획" | right "집행"
Row 16+  : per-item data
  Plan cols:      날짜 | 구분 | 지출항목 | 자금액 | 잔액
  Execution cols: 날짜 | 구분 | 지출항목 | 자금액 | 잔액
```

**Sample data:**

| 날짜 | 구분 | Item | Amount |
|------|------|------|--------|
| 계약시 | — | 분양 계약금 | -97,810,000 |
| 계약시 | — | 옵션 1 계약금 | -1,313,000 |
| 계약시 | — | 모은 돈 | +100,323,000 |
| (date) | — | 분양 중도금 1차 | -97,810,000 |

---

#### 부동산 수익분석 — RealEstateAnalysis (new)

**Layout:**

```
Row 1–5  : asset structure (취득원가, 자기자본, 타인자본)
Row 7–12 : current value & return analysis (시세차익, ROE)
Row 14–20: leverage effect analysis (배수, 가속계수)
```

**Key metrics:**

| Metric (KR term) | Description |
|------------------|-------------|
| 취득원가 | Total acquisition cost (purchase price + taxes) |
| 자기자본 (LTV) | Own capital contribution |
| 타인자본 | Loan capital |
| 시세차익 | Unrealized gain (market value − acquisition cost) |
| ROE | Return on equity (gain / own capital) |
| 레버리지 배수 | Leverage multiple (loan / own capital) |
| 가속계수 | Return amplification factor from leverage |

---

## 3. Requirements

### 3.1 Functional Requirements (FR)

#### FR-001: Excel File Upload ✅ implemented

- **Input:** `.xlsx` or `.xls` file
- **Process:** Parse all sheets → store as `DataRecord` JSON → create `UploadHistory`, `SheetData`
- **Output:** `{ upload_id, sheet_count, message }`
- **Constraints:** File size limit required (NFR-002); whitelist `.xlsx`, `.xls` only

#### FR-002: Customer Info Extraction ✅ implemented

- **Source sheet:** 뱅샐현황
- **Process:** Find "이름" header row → extract name, gender, age, credit score, email → latest-file-wins on duplicates
- **Output:** `Customer[]`

#### FR-003: Cash Flow Analysis ✅ implemented

- **Source sheet:** 뱅샐현황
- **Process:** Find "2.현금흐름현황" section → extract item name, total, avg, 13-month values → auto-classify income/expense by keyword → merge across multiple uploads
- **Output:** `CashFlow[]`, monthly trend charts

#### FR-004: Fixed Expense Management 🔲 new

- **Source sheet:** 고정비 (26)
- **Process:** Find "계좌"/"은행" header row → extract per-item data → categorize by 성향 (저축/용돈/보험/교육/…) → store monthly JSON `{"2026-01": 200000}`
- **Output:** `FixedExpense[]`, category pie chart

#### FR-005: Monthly Financial Summary 🔲 new

- **Source sheet:** 총 결산
- **Process:** Map row labels to fields → extract 6 metrics per month (income, expense, net, cumulative, principal, value)
- **Output:** `MonthlySummary[]`, annual bar chart, cumulative line chart

#### FR-006: Financial Goal Tracking 🔲 new

- **Source sheet:** 평촌 자이 퍼스티니 분양금 계획
- **Process:** Extract metadata (target, duration, progress, weekly allocation) → store plan section and execution section as separate JSON arrays
- **Output:** `FinancialGoal`, progress gauge, plan vs. execution chart

#### FR-007: Real Estate Investment Analysis 🔲 new

- **Source sheet:** 부동산 수익분석, Sheet3
- **Process:** Extract asset structure, unrealized gain, ROE, leverage multiple, acceleration factor → store scenario data as JSON
- **Output:** `RealEstateAnalysis`, asset structure pie chart, leverage comparison table

#### FR-008: Data Visualization ✅ partial / 🔲 extending

- **Implemented:** monthly cash flow trend (line chart), click-to-detail modal
- **New:** fixed expense category pie (FR-004), cumulative net income line (FR-005), goal progress gauge (FR-006), investment return card (FR-007)

---

### 3.2 Non-Functional Requirements (NFR)

#### NFR-001: Performance

| Item | Requirement |
|------|-------------|
| Query efficiency | No N+1 queries — bulk upsert + single commit after loop |
| Excel loading | No double-loading — `data_only=True` first, lazy fallback only if needed |
| Scheduler | No full-table scan — process only sheets changed since last sync |
| Frontend | No function recreation per render — define utils outside components or use `useMemo` |

#### NFR-002: Security

| Item | Requirement |
|------|-------------|
| File size | Set max upload size limit |
| Filename | Prevent path traversal — `os.path.basename()` + extension whitelist |
| CORS | Restrict allowed origins to production domain (currently `*`) |
| SQL | Use SQLAlchemy ORM — no raw string queries |

#### NFR-003: Extensibility

| Item | Requirement |
|------|-------------|
| New data types | Adding a new domain model requires modifying exactly 6 files |
| Constants | No magic values — define column indices and keywords as top-of-file constants |
| Schema layers | Maintain Base → Create → Response 3-level structure |

#### NFR-004: Auto-sync

| Item | Requirement |
|------|-------------|
| Backend | APScheduler 30s interval (configurable via `CUSTOMER_SYNC_INTERVAL`) |
| Frontend | React Query `refetchInterval: 30000` aligned with backend interval |

---

## 4. System Architecture

### 4.1 Component Diagram

> See `002-architecture-and-design.html` for the SVG diagram.

```
[User] → [Frontend :8050] ◄── REST API ──► [Backend :8051]
                                                  │
                                           ┌──────┴──────┐
                                     excel_parser   scheduler
                                     data_service  (30s APScheduler)
                                           │
                                           ▼
                                    [PostgreSQL :8052]
```

### 4.2 Data Flow

```
User uploads .xlsx
    ↓ POST /api/upload
excel_parser.py  →  List[List[Any]]  (row × col)
    ↓
data_service.create_data_records()
    →  DataRecord { data: {"1": val, "2": val, ...} }
    ↓ (manual extract or scheduler)
extract_and_save_customer()        → Customer
extract_and_save_cash_flows()      → CashFlow
extract_and_save_fixed_expenses()  → FixedExpense   [new]
extract_and_save_monthly_summary() → MonthlySummary [new]
extract_and_save_financial_goal()  → FinancialGoal  [new]
extract_and_save_real_estate()     → RealEstateAnalysis [new]
    ↓
Frontend React Query (refetchInterval: 30s) → charts updated
```

### 4.3 Scheduler Flow

```
APScheduler (30s)
  → sync_customers()   : find unprocessed 뱅샐현황 sheets → extract_and_save_customer()
  → sync_cash_flows()  : find unprocessed 뱅샐현황 sheets → extract_and_save_cash_flows()
```

---

## 5. Data Model Design

### 5.1 Existing Models — ERD

```
UploadHistory (upload_history)
├── id           INTEGER PK
├── filename     VARCHAR
├── uploaded_at  TIMESTAMP
└── sheet_count  INTEGER
        │ 1:N
        ▼
SheetData (sheet_data)
├── id            INTEGER PK
├── upload_id     INTEGER FK → upload_history.id
├── sheet_name    VARCHAR
├── row_count     INTEGER
└── column_count  INTEGER
        │ 1:N
        ▼
DataRecord (data_record)
├── id         INTEGER PK
├── sheet_id   INTEGER FK → sheet_data.id
├── row_index  INTEGER
└── data       JSON  ← {"1": val, "2": val, ...}

Customer (customer)
├── name, gender, age, credit_score, email
├── upload_id       FK → upload_history.id
├── data_record_id  FK → data_record.id
├── created_at, updated_at
  INDEX: (name, upload_id)

CashFlow (cash_flow)
├── sheet_id        FK → sheet_data.id
├── item_name       VARCHAR NOT NULL
├── item_type       VARCHAR  (수입/지출)
├── total, monthly_average  NUMERIC(15,2)
├── monthly_data    JSON  ← {"2025-02": 4135, ...}
├── upload_id, data_record_id  FKs
  INDEX: (item_name, upload_id)
```

---

### 5.2 New Model Definitions

#### FixedExpense (fixed_expense) — FR-004

```python
class FixedExpense(Base):
    __tablename__ = "fixed_expense"

    id              = Column(Integer, primary_key=True, index=True)
    sheet_id        = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    account_number  = Column(String, nullable=True)   # 계좌번호
    bank_name       = Column(String, nullable=True)   # 은행명
    account_holder  = Column(String, nullable=True)   # 예금주
    transfer_name   = Column(String, nullable=True)   # 이체명
    category        = Column(String, nullable=False, index=True)  # 성향 (저축/용돈/보험 …)
    item_name       = Column(String, nullable=False, index=True)  # 항목명
    monthly_amount  = Column(Numeric(15, 2), nullable=True)
    monthly_data    = Column(JSON, nullable=True)  # {"2026-01": 200000, ...}
    upload_id       = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id  = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index('idx_fixed_exp_item_upload', 'item_name', 'upload_id'),)
```

**Column index mapping (고정비 sheet):**

| data key | Field |
|----------|-------|
| `"1"` | account_number |
| `"2"` | bank_name |
| `"3"` | account_holder |
| `"4"` | transfer_name |
| `"5"` | category (성향) |
| `"6"` | item_name |
| `"7"`–`"18"` | monthly_data (Jan–Dec) |

---

#### MonthlySummary (monthly_summary) — FR-005

```python
class MonthlySummary(Base):
    __tablename__ = "monthly_summary"

    id                    = Column(Integer, primary_key=True, index=True)
    sheet_id              = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    year                  = Column(Integer, nullable=False, index=True)
    month                 = Column(Integer, nullable=False)  # 1–12
    income                = Column(Numeric(15, 2), nullable=True)  # 월 수입
    expense               = Column(Numeric(15, 2), nullable=True)  # 월 지출
    net_income            = Column(Numeric(15, 2), nullable=True)  # 월 순수익
    cumulative_net_income = Column(Numeric(15, 2), nullable=True)  # 누적 순수익
    investment_principal  = Column(Numeric(15, 2), nullable=True)  # 투자 원금
    investment_value      = Column(Numeric(15, 2), nullable=True)  # 평가금
    upload_id             = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id        = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index('idx_monthly_summary_year_month_upload', 'year', 'month', 'upload_id'),)
```

**Row label mapping (총 결산 sheet):**

| Row label (data key `"1"`) | Field |
|----------------------------|-------|
| 월 수입 | `income` |
| 월 지출 | `expense` |
| 월 순수익 | `net_income` |
| 누적 순수익 | `cumulative_net_income` |
| 원금 | `investment_principal` |
| 평가금 | `investment_value` |

---

#### FinancialGoal (financial_goal) — FR-006

```python
class FinancialGoal(Base):
    __tablename__ = "financial_goal"

    id                = Column(Integer, primary_key=True, index=True)
    sheet_id          = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    goal_name         = Column(String, nullable=False)
    target_amount     = Column(Numeric(15, 2), nullable=True)
    start_date        = Column(String, nullable=True)
    end_date          = Column(String, nullable=True)
    interest_rate     = Column(Numeric(5, 4), nullable=True)   # 0.05 = 5%
    total_weeks       = Column(Integer, nullable=True)
    elapsed_weeks     = Column(Integer, nullable=True)
    remaining_weeks   = Column(Integer, nullable=True)
    progress_rate     = Column(Numeric(5, 4), nullable=True)   # 0.2137 = 21.37%
    weekly_allocation = Column(Numeric(15, 2), nullable=True)
    planned_data      = Column(JSON, nullable=True)  # plan section items
    actual_data       = Column(JSON, nullable=True)  # execution section items
    upload_id         = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**planned_data / actual_data JSON shape:**

```json
[
  { "date": "계약시", "category": null, "item": "분양 계약금", "amount": -97810000, "balance": null },
  { "date": "계약시", "category": null, "item": "모은돈", "amount": 100323000, "balance": 0 }
]
```

---

#### RealEstateAnalysis (real_estate_analysis) — FR-007

```python
class RealEstateAnalysis(Base):
    __tablename__ = "real_estate_analysis"

    id                     = Column(Integer, primary_key=True, index=True)
    sheet_id               = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    property_name          = Column(String, nullable=True)
    total_acquisition_cost = Column(Numeric(15, 2), nullable=True)  # 취득원가
    self_capital           = Column(Numeric(15, 2), nullable=True)  # 자기자본
    loan_capital           = Column(Numeric(15, 2), nullable=True)  # 타인자본
    current_market_value   = Column(Numeric(15, 2), nullable=True)
    unrealized_gain        = Column(Numeric(15, 2), nullable=True)  # 시세차익
    roe                    = Column(Numeric(8, 4), nullable=True)
    leverage_multiple      = Column(Numeric(8, 4), nullable=True)   # 레버리지 배수
    acceleration_factor    = Column(Numeric(8, 4), nullable=True)   # 가속계수
    analysis_data          = Column(JSON, nullable=True)
    upload_id              = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id         = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

---

### 5.3 New TypeScript Types

```typescript
// Add to frontend/src/types/index.ts

export interface FixedExpense {
  id: number; sheet_id: number;
  account_number: string | null; bank_name: string | null;
  account_holder: string | null; transfer_name: string | null;
  category: string; item_name: string;
  monthly_amount: number | null;
  monthly_data: Record<string, number> | null;  // {"2026-01": 200000}
  upload_id: number | null; data_record_id: number | null;
  created_at: string; updated_at: string;
}

export interface MonthlySummary {
  id: number; sheet_id: number; year: number; month: number;
  income: number | null; expense: number | null;
  net_income: number | null; cumulative_net_income: number | null;
  investment_principal: number | null; investment_value: number | null;
  upload_id: number | null; data_record_id: number | null;
  created_at: string; updated_at: string;
}

export interface FinancialGoalItem {
  date: string | null; category: string | null;
  item: string; amount: number; balance: number | null;
}
export interface FinancialGoal {
  id: number; sheet_id: number; goal_name: string;
  target_amount: number | null; start_date: string | null; end_date: string | null;
  interest_rate: number | null;
  total_weeks: number | null; elapsed_weeks: number | null; remaining_weeks: number | null;
  progress_rate: number | null; weekly_allocation: number | null;
  planned_data: FinancialGoalItem[] | null; actual_data: FinancialGoalItem[] | null;
  upload_id: number | null; created_at: string; updated_at: string;
}

export interface RealEstateAnalysis {
  id: number; sheet_id: number; property_name: string | null;
  total_acquisition_cost: number | null; self_capital: number | null; loan_capital: number | null;
  current_market_value: number | null; unrealized_gain: number | null;
  roe: number | null; leverage_multiple: number | null; acceleration_factor: number | null;
  analysis_data: Record<string, any> | null;
  upload_id: number | null; data_record_id: number | null;
  created_at: string; updated_at: string;
}
```

---

## 6. API Design

### 6.1 Existing Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `POST` | `/api/upload` | Upload Excel file | `UploadResponse` |
| `GET` | `/api/uploads` | List upload history | `UploadHistory[]` |
| `GET` | `/api/uploads/{id}` | Get upload detail | `UploadHistory` |
| `GET` | `/api/uploads/{id}/sheets` | List sheets in upload | `SheetData[]` |
| `GET` | `/api/sheets/{id}` | Sheet + records | `SheetWithData` |
| `GET` | `/api/customers` | List customers | `Customer[]` |
| `POST` | `/api/sheets/{id}/extract-customer` | Extract & save customer | `Customer` |
| `GET` | `/api/cash-flows` | List cash flows | `CashFlow[]` |
| `POST` | `/api/sheets/{id}/extract-cash-flows` | Extract & save cash flows | `CashFlow[]` |
| `POST` | `/api/data-records/by-ids` | Fetch records by ID array | `DataRecord[]` |

### 6.2 New Endpoints

| Method | Path | Description | Response | FR |
|--------|------|-------------|----------|----|
| `GET` | `/api/fixed-expenses` | List fixed expenses (`?sheet_id=`) | `FixedExpense[]` | FR-004 |
| `POST` | `/api/sheets/{id}/extract-fixed-expenses` | Extract & save | `FixedExpense[]` | FR-004 |
| `GET` | `/api/monthly-summaries` | List monthly summaries (`?year=`) | `MonthlySummary[]` | FR-005 |
| `POST` | `/api/sheets/{id}/extract-monthly-summary` | Extract & save | `MonthlySummary[]` | FR-005 |
| `GET` | `/api/financial-goals` | List financial goals | `FinancialGoal[]` | FR-006 |
| `POST` | `/api/sheets/{id}/extract-financial-goal` | Extract & save | `FinancialGoal` | FR-006 |
| `GET` | `/api/real-estate-analyses` | List real estate analyses | `RealEstateAnalysis[]` | FR-007 |
| `POST` | `/api/sheets/{id}/extract-real-estate` | Extract & save | `RealEstateAnalysis` | FR-007 |

---

## 7. Implementation Guide: Adding a New Data Type

**6 files to always modify:**

```
1. backend/app/models/models.py          ← SQLAlchemy model class
2. backend/app/schemas/schemas.py        ← Pydantic Base/Create/Response
3. backend/app/services/data_service.py  ← constants + extract function
4. backend/app/api/data.py               ← GET + POST endpoints
5. frontend/src/types/index.ts           ← TypeScript interface
6. frontend/src/lib/api.ts               ← API client functions
```

Optional:
```
7. backend/app/services/scheduler_service.py  ← add auto-sync job
8. alembic/versions/XXX_*.py                  ← DB migration
```

### Extraction function pattern

```python
# Step 1: top-of-file constants
NEW_COL_FIELD1 = "1"
NEW_MONTHLY_COL_RANGE = range(7, 19)   # Jan–Dec
NEW_EXCLUDE_KEYWORDS = ["헤더명", "합계", ...]

# Step 2: extraction function
def extract_and_save_new_model(db, sheet_id, upload_id):
    records = db.query(DataRecord).filter(
        DataRecord.sheet_id == sheet_id
    ).order_by(DataRecord.row_index).all()

    # find header row
    header_row = next(
        (r.row_index for r in records if _to_str(r.data.get("1")) == "헤더키워드"), None
    )

    results = []
    for record in records:
        if record.row_index <= header_row:
            continue
        item_name = _to_str(record.data.get(NEW_COL_FIELD1))
        if not item_name or any(k in item_name for k in NEW_EXCLUDE_KEYWORDS):
            continue

        monthly_data = {
            f"2026-{i - 6:02d}": _to_float(record.data.get(str(i)))
            for i in NEW_MONTHLY_COL_RANGE
            if _to_float(record.data.get(str(i))) is not None
        }

        existing = db.query(NewModel).filter(
            NewModel.sheet_id == sheet_id,
            NewModel.item_name == item_name,
            NewModel.upload_id == upload_id
        ).first()

        if existing:
            existing.monthly_data = monthly_data
            existing.updated_at = datetime.now()
        else:
            existing = NewModel(sheet_id=sheet_id, item_name=item_name,
                               monthly_data=monthly_data, upload_id=upload_id,
                               data_record_id=record.id)
            db.add(existing)
        results.append(existing)

    db.commit()  # ← single commit after loop (prevents N+1)
    for r in results:
        db.refresh(r)
    return results
```

---

## 8. Implementation Roadmap

| Phase | Model | FR | Priority | Complexity | Notes |
|-------|-------|----|----------|------------|-------|
| 1 | `FixedExpense` | FR-004 | High | ⭐⭐ | Similar pattern to CashFlow, easy to test |
| 2 | `MonthlySummary` | FR-005 | High | ⭐ | Simple row-label mapping only |
| 3 | `FinancialGoal` | FR-006 | Medium | ⭐⭐⭐ | Metadata + plan/execution JSON split |
| 4 | `RealEstateAnalysis` | FR-007 | Low | ⭐⭐⭐⭐ | Formula-derived values, static analysis |

### Phase 1 — FixedExpense checklist

- [ ] `models.py`: add `FixedExpense`
- [ ] `schemas.py`: add `FixedExpenseBase/Create/Response`
- [ ] `data_service.py`: `FIXED_EXPENSE_*` constants + `extract_and_save_fixed_expenses_from_data_record()`
- [ ] `api/data.py`: `GET /api/fixed-expenses`, `POST /api/sheets/{id}/extract-fixed-expenses`
- [ ] `types/index.ts`: add `FixedExpense` interface
- [ ] `lib/api.ts`: add `getFixedExpenses()`, `extractFixedExpensesFromSheet()`
- [ ] Alembic migration (004)
- [ ] (optional) `scheduler_service.py`: add `sync_fixed_expenses()`

### Phase 2 — MonthlySummary checklist

- [ ] `models.py`: add `MonthlySummary`
- [ ] `schemas.py`: add `MonthlySummaryBase/Create/Response`
- [ ] `data_service.py`: row-label map constants + extract function
- [ ] `api/data.py`: 2 endpoints
- [ ] `types/index.ts`, `lib/api.ts` updates
- [ ] Alembic migration (005)

---

## 9. Migration Strategy

### Alembic commands

```bash
# Run while Docker is running
docker exec mymoney-backend alembic revision --autogenerate -m "Add FixedExpense model"
docker exec mymoney-backend alembic upgrade head

# Check status
docker exec mymoney-backend alembic current
docker exec mymoney-backend alembic history
```

### File naming convention

```
alembic/versions/
├── 001_initial_schema.py
├── 002_add_customer_indexes.py
├── 003_add_cashflow_monthly_data.py
├── 004_add_fixed_expense.py        ← Phase 1
├── 005_add_monthly_summary.py      ← Phase 2
├── 006_add_financial_goal.py       ← Phase 3
└── 007_add_real_estate_analysis.py ← Phase 4
```

**Notes:**
- New models must be imported into `alembic/env.py`'s `target_metadata` for `--autogenerate` to work.
- Always verify `down_revision` matches the previous migration's `revision` ID exactly.
- No impact on existing `Customer` / `CashFlow` data (new tables only).

---

## Appendix: CashFlow vs FixedExpense

| | CashFlow (existing) | FixedExpense (new) |
|---|---|---|
| Source sheet | 뱅샐현황 (actual transactions) | 고정비 (planned amounts) |
| Classification | `item_type`: 수입/지출 | `category`: 저축/용돈/보험/교육/… |
| Monthly variability | Variable (real transactions) | Fixed (pre-set) |
| Data key | `{"2025-02": 4135}` | `{"2026-01": 200000}` |
| Header lookup | `"2.현금흐름현황"` | `"계좌"` or `"은행"` |
| Merge strategy | Overwrite by month | UPDATE in place |
| Primary use | Actual spending pattern analysis | Fixed cost plan management |
