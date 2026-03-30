# 코드베이스 리팩터링 분석 보고서

> 작성일: 2026-03-30
> 분석 대상: `/Users/khk/work/khk/mymoney` (전체 코드베이스)
> 분석 도구: Claude Code (claude-sonnet-4-6)

---

## 분석된 주요 파일

| 파일 | 역할 |
|------|------|
| `backend/app/models/models.py` | SQLAlchemy ORM 모델 |
| `backend/app/schemas/schemas.py` | Pydantic 요청/응답 스키마 |
| `backend/app/services/data_service.py` | 핵심 비즈니스 로직 (701줄) |
| `backend/app/services/excel_parser.py` | Excel 파싱 |
| `backend/app/services/scheduler_service.py` | 백그라운드 동기화 스케줄러 |
| `backend/app/api/upload.py` | 파일 업로드 라우터 |
| `backend/app/api/data.py` | 데이터 조회/추출 라우터 |
| `backend/app/main.py` | FastAPI 앱 초기화 |
| `frontend/src/lib/api.ts` | API 클라이언트 |
| `frontend/src/types/index.ts` | TypeScript 타입 정의 |
| `frontend/src/components/DataVisualization.tsx` | 데이터 시각화 컴포넌트 |

---

## 이슈 목록 (18건)

### 1. 성능 (Performance) — 4건

#### P1. N+1 쿼리 문제 ⚠️ 높음
- **위치**: `data_service.py:541~697`
- **문제**: `extract_and_save_cash_flows_from_data_record()` 내 루프에서 행마다 `SELECT → commit → refresh` 실행
- **영향**: 50개 행 처리 시 150+ 쿼리 발생
- **수정 방향**: 루프 종료 후 bulk upsert + 단일 commit

#### P2. Excel 이중 로딩 ⚠️ 높음
- **위치**: `excel_parser.py:60~65`
- **문제**: `data_only=True`와 `data_only=False`로 동일 파일을 두 번 메모리에 로드
- **영향**: 대용량 파일 처리 시 메모리 2배 사용
- **수정 방향**: `data_only=True` 단독 시도 후 None 셀 발견 시에만 formula 워크북 lazy 로딩

#### P3. 스케줄러 풀스캔
- **위치**: `scheduler_service.py:26, 86`
- **문제**: 30초마다 `db.query(SheetData).all()` 전체 조회
- **영향**: 데이터 증가에 따라 선형적 성능 저하
- **수정 방향**: 마지막 sync 이후 변경된 시트만 처리

#### P4. 렌더링마다 함수 재생성
- **위치**: `DataVisualization.tsx:17`
- **문제**: `formatNumber`가 컴포넌트 내부에 선언되어 매 렌더링마다 재생성
- **수정 방향**: 유틸 파일로 분리 (`src/utils/format.ts`)

---

### 2. 가독성 (Readability) — 5건

#### R1. 거대 함수 ⚠️ 높음
- **위치**: `data_service.py:334~699`
- **문제**: `extract_and_save_cash_flows_from_data_record()` 단독 365줄, 중첩 if-else 5단계
- **수정 방향**: 내부 헬퍼 함수 4개로 분리
  - `_find_section_header()`
  - `_find_column_headers()`
  - `_extract_row_data()`
  - `_merge_monthly_data()`

#### R2. 동일 패턴 5회 중복
- **위치**: `data_service.py:373~414` 외
- **문제**: `isinstance(raw, (int, float)) → str 변환` 블록이 함수 내에서 5회 이상 반복
- **수정 방향**: `_to_str(value)` 헬퍼 함수로 추출

#### R3. 함수 내부 import
- **위치**: `data_service.py:455`
- **문제**: `import re`가 함수 내부에 위치
- **수정 방향**: 파일 최상단으로 이동

#### R4. DRY 위반
- **위치**: `excel_parser.py:10~27` / `data_service.py:91~108`
- **문제**: `convert_datetime_to_string()` 동일 로직이 두 파일에 독립적으로 존재
- **수정 방향**: `data_service.py`의 private 함수를 제거하고 `excel_parser`의 공개 함수를 import

#### R5. 하드코딩된 매직값
- **위치**: `data_service.py:405, 437, 529~533`
- **문제**: 컬럼 인덱스 `"1"~"5"`, `range(4, 17)`, 긴 키워드 리스트가 로직 내부에 산재
- **수정 방향**: 모듈 상단 상수로 선언

---

### 3. 모듈성 (Modularity) — 4건

#### M1. 신의 파일 (God File) ⚠️ 높음
- **위치**: `data_service.py` 전체
- **문제**: 날짜 유틸리티 + CRUD + 고객 추출 + 현금흐름 추출 로직이 1개 파일에 혼재
- **수정 방향**:
  ```
  services/
  ├── utils/date_utils.py      # 날짜 범위 파싱 유틸
  ├── crud.py                  # UploadHistory/Sheet/DataRecord CRUD
  ├── customer_service.py      # 고객 추출 비즈니스 로직
  └── cash_flow_service.py     # 현금흐름 추출 비즈니스 로직
  ```

#### M2. 서비스 레이어 우회
- **위치**: `data.py:100~101, 113`
- **문제**: API 라우터가 `from app.models import Customer; db.query(Customer)...`로 DB 직접 쿼리
- **수정 방향**: `data_service`에 `get_customers()`, `get_cash_flows()` 함수 추가 후 위임

#### M3. 라우터에 비즈니스 로직 혼재
- **위치**: `upload.py:58~102`
- **문제**: 업로드 핸들러가 파싱 → DB 저장 전체 흐름을 직접 조율
- **수정 방향**: `upload_service.py`로 분리

#### M4. 프론트엔드 유틸 미분리
- **위치**: `DataVisualization.tsx:17~49`
- **문제**: `formatNumber` 유틸이 컴포넌트 내부에 선언되어 재사용 불가
- **수정 방향**: `src/utils/format.ts`로 분리

---

### 4. 보안 (Security) — 3건

#### S1. 파일명 미검증 ⚠️ 높음
- **위치**: `upload.py:28`
- **문제**:
  - `file.filename`이 `None`일 경우 `AttributeError` 발생
  - Path Traversal 공격 미방어 (파일명에 `../` 포함 가능)
  - MIME 타입 검증 없음
- **수정 방향**:
  ```python
  if not file.filename:
      raise HTTPException(status_code=400, detail="파일명이 없습니다.")
  safe_name = os.path.basename(file.filename)  # Path traversal 방어
  ```

#### S2. 파일 크기 제한 없음
- **위치**: `upload.py` 전체
- **문제**: 타임아웃(10분)만 있고 용량 상한이 없어 서버 메모리 고갈 위험
- **수정 방향**: 업로드 크기 상한 설정 (예: 50MB)

#### S3. CORS 과도 허용
- **위치**: `main.py:36~37`
- **문제**: `allow_methods=["*"]`, `allow_headers=["*"]`
- **수정 방향**: `allow_methods=["GET", "POST"]`로 제한

---

### 5. 테스트 커버리지 (Test Coverage) — 2건

#### T1. 테스트 파일 없음 ⚠️ 높음
- **위치**: 백엔드/프론트엔드 전체
- **문제**: 단위 테스트, 통합 테스트 0%
- **수정 방향**: `backend/tests/` 디렉토리 생성, pytest 기반 테스트 추가

#### T2. 테스트하기 어려운 구조
- **위치**: `data_service.py` 전체
- **문제**: 거대 함수들이 DB Session에 직접 의존해 격리 단위 테스트 불가
- **수정 방향**: 서비스 분리(M1) 이후 순수 함수 추출로 테스트 용이성 확보

---

## 리팩터링 실행 계획 (IMPLEMENTATION CHECKLIST)

```
Phase 1 — 즉시 수정 (Low Risk, Zero Breaking Change)
  [ ] S1: file.filename None 체크 + os.path.basename() sanitize 추가
  [ ] S2: 파일 크기 상한 설정 (50MB)
  [ ] S3: CORS allow_methods=["GET", "POST"] 로 축소
  [ ] R3: data_service.py 상단으로 `import re` 이동
  [ ] R4: data_service._convert_datetime_to_string() 제거
          → excel_parser.convert_datetime_to_string import로 대체
  [ ] M4: formatNumber → frontend/src/utils/format.ts 분리
  [ ] FastAPI on_event("shutdown") → lifespan 패턴으로 변경

Phase 2 — 구조 개선 (Medium Risk, Non-Breaking)
  [ ] R2: _to_str() 헬퍼 추출 후 중복 5회 일괄 교체
  [ ] R5: 매직 상수 모듈 상단으로 추출 (COLUMN_*, EXCLUDE_KEYWORDS 등)
  [ ] M2: data.py 라우터의 직접 DB 쿼리 → data_service 함수로 위임

Phase 3 — 모듈 분리 (Medium-High Risk, Requires Regression Check)
  [ ] M1: data_service.py → 4개 파일로 분리
  [ ] R1: 거대 함수 내부 헬퍼 4개 추출
  [ ] M3: upload.py 로직 → upload_service.py 분리

Phase 4 — 성능 개선 (High Complexity)
  [ ] P1: 현금흐름 upsert → bulk INSERT/UPDATE + 단일 commit
  [ ] P2: Excel 이중 로딩 → lazy 로딩 방식으로 개선
  [ ] P3: 스케줄러 → 변경된 시트만 처리하도록 개선

Phase 5 — 테스트 추가 (After Refactoring)
  [ ] T1: backend/tests/ 디렉토리 + pytest 설정
  [ ] T1: data_service 핵심 추출 로직 단위 테스트
  [ ] T2: API 엔드포인트 통합 테스트
```

---

## 우선순위 매트릭스

| 이슈 | 위험도 | 영향도 | 권장 순서 |
|------|--------|--------|-----------|
| S1 파일명 미검증 | 낮음 | 높음 | Phase 1 |
| P1 N+1 쿼리 | 낮음 | 높음 | Phase 4 |
| R1 거대 함수 | 중간 | 높음 | Phase 3 |
| M1 God File | 중간 | 높음 | Phase 3 |
| P2 Excel 이중 로딩 | 중간 | 중간 | Phase 4 |
| T1 테스트 없음 | 낮음 | 높음 | Phase 5 |
