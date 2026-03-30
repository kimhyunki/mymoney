# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

MyMoney는 Excel 파일을 업로드하여 가정 재무 현황(고객 정보, 현금흐름, 금융자산)을 시각화하는 웹앱입니다.

## 개발 환경 실행

**Docker 기반 전체 실행 (권장):**
```bash
./start.sh
```
- Frontend: http://localhost:8050
- Backend: http://localhost:8051
- Database: localhost:8052

**프론트엔드 로컬 개발:**
```bash
cd frontend && npm install && npm run dev  # http://localhost:3000
```

**주요 프론트엔드 명령어:**
```bash
npm run build   # TypeScript 컴파일 + Vite 번들링
npm run lint    # ESLint 검사
npm run preview # 빌드 결과 미리보기
```

**백엔드 마이그레이션 (Docker 실행 중):**
```bash
docker exec mymoney-backend alembic revision --autogenerate -m "설명"
docker exec mymoney-backend alembic upgrade head
```

## 아키텍처

### 기술 스택
- **Frontend:** React 19 + TypeScript, Vite, React Router 7, React Query 5, Recharts, Tailwind CSS 4
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, APScheduler
- **DB:** PostgreSQL

### 데이터 흐름
```
Excel 파일 → excel_parser → DataRecord(원본 JSON) → data_service → Customer/CashFlow 테이블
```

Excel의 각 행은 `data_record` 테이블에 컬럼 인덱스를 키로 하는 JSON(`{"1": 값, "2": 값, ...}`)으로 저장됩니다.

### 백엔드 구조
- `app/api/` — FastAPI 라우트 (upload.py, data.py)
- `app/models/models.py` — SQLAlchemy ORM 모델 전체
- `app/schemas/schemas.py` — Pydantic 스키마 전체
- `app/services/data_service.py` — 핵심 비즈니스 로직 (Excel 파싱 후 추출·저장)
- `app/services/scheduler_service.py` — 30초 주기 백그라운드 동기화
- `alembic/versions/` — 마이그레이션 파일 (001_, 002_, ... 순번 사용)

### 프론트엔드 구조
- `src/pages/` — 라우트별 페이지 (Home, Uploads, Visualization, Customers, CashFlow)
- `src/components/` — 재사용 컴포넌트 (Charts, Modals, Layout 등)
- `src/lib/api.ts` — 백엔드 API 호출 함수 전체
- `src/lib/queryClient.ts` — React Query 설정
- `src/types/index.ts` — TypeScript 타입 정의 전체

## 핵심 패턴: 새 데이터 유형 추가

Customer, CashFlow처럼 새로운 데이터를 Excel에서 추출해 저장할 때의 표준 패턴:

1. **모델** (`models.py`): `data_record_id` ForeignKey + `created_at`/`updated_at` 포함
2. **스키마** (`schemas.py`): Base → Create → Response 3단 구조, `from_attributes = True`
3. **마이그레이션**: `alembic revision --autogenerate`, `alembic/env.py`에 모델 import 추가
4. **서비스** (`data_service.py`): 섹션 헤더 탐색 → 데이터 행 추출 → upsert 저장
5. **API** (`data.py`): GET `/your-models` + POST `/sheets/{sheet_id}/extract-your-data`
6. **스케줄러** (`scheduler_service.py`): `sync_*` 함수 추가, `start_scheduler()`에 job 등록
7. **프론트엔드**: `types/index.ts` 타입 → `lib/api.ts` 함수 → 컴포넌트 (`refetchInterval: 30000`)

## 중요 규칙

**Excel 데이터 처리:**
- `data_record.data`의 값은 `int`, `float`, `str` 모두 가능 → 항상 `isinstance()` 체크 후 변환
- 숫자 변환 시 try-except 필수, 콤마 제거 후 변환 (`replace(',', '')`)
- 요약 행·헤더·섹션 제목은 exclude_keywords 리스트로 제외

**스케줄러/프론트엔드 동기화:**
- 스케줄러 기본 주기: 30초 (환경변수 `CUSTOMER_SYNC_INTERVAL`로 조정)
- 프론트엔드 React Query도 `refetchInterval: 30000`으로 맞춤

**마이그레이션:**
- 파일명은 순차 번호 사용: `001_`, `002_`, `003_` ...
- `down_revision`이 이전 마이그레이션 ID와 일치하는지 반드시 확인

**환경변수:**
- `DATABASE_URL` — PostgreSQL 연결 문자열
- `VITE_API_URL` — 프론트엔드에서 백엔드 URL (기본: http://localhost:8051)

## Git 원격 저장소

- 원격 URL: `git@github.com-private:kimhyunki/mymoney.git`
- SSH 별칭 `github.com-private` → `~/.ssh/khk/id_rsa` 키 → GitHub 계정 `kimhyunki`
- `github.com-connev` 별칭은 `khk04` 계정이므로 이 리포지토리에 사용하면 안 됨

현재 remote가 잘못 설정된 경우:
```bash
git remote set-url origin git@github.com-private:kimhyunki/mymoney.git
```
