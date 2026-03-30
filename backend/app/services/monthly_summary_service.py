from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import SheetData, DataRecord, MonthlySummary

# --- 컬럼 인덱스 (총 결산 시트) ---
# B2: year, C2-N2: 월 헤더(1-12월), 이후 row들: B=레이블, C-N=월별 값
MONTHLY_SUMMARY_COL_LABEL = "1"   # B열 → 행 레이블
MONTHLY_SUMMARY_COL_RANGE = range(2, 14)  # "2"→1월, "13"→12월

# row 레이블 → 모델 필드 매핑
MONTHLY_SUMMARY_ROW_MAP: Dict[str, str] = {
    "월 수입":    "income",
    "월 지출":    "expense",
    "월 순수익":  "net_income",
    "누적 순수익": "cumulative_net_income",
    "투자 원금":  "investment_principal",
    "원금":       "investment_principal",  # 실제 시트에서 줄여쓰는 경우 대비
    "평가금":     "investment_value",
}


def _to_str(value: Any) -> str:
    if isinstance(value, (int, float)):
        return str(value).strip()
    if isinstance(value, str):
        return value.strip()
    return ""


def _to_float(value: Any) -> Optional[float]:
    try:
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str) and value.strip():
            cleaned = value.strip().replace(',', '')
            if cleaned.replace('.', '').replace('-', '').isdigit():
                return float(cleaned)
    except (ValueError, TypeError):
        pass
    return None


def _to_int(value: Any) -> Optional[int]:
    f = _to_float(value)
    return int(f) if f is not None else None


def extract_and_save_monthly_summary_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> List[MonthlySummary]:
    """
    총 결산 시트의 data_record에서 월별 요약을 추출하여 monthly_summary 테이블에 저장합니다.
    bulk upsert + 단일 commit으로 N+1 쿼리를 방지합니다.
    """
    sheet = db.query(SheetData).filter(SheetData.id == sheet_id).first()
    if not sheet:
        return []

    if upload_id is None:
        upload_id = sheet.upload_id

    records = (
        db.query(DataRecord)
        .filter(DataRecord.sheet_id == sheet_id)
        .order_by(DataRecord.row_index)
        .all()
    )
    if not records:
        return []

    # --- Step 1: year 행 탐색 (col "1" 값이 4자리 연도 숫자) ---
    year: Optional[int] = None
    for record in records:
        val = _to_int(record.data.get(MONTHLY_SUMMARY_COL_LABEL))
        if val and 2000 <= val <= 2100:
            year = val
            break

    if year is None:
        return []

    # --- Step 2: 각 레이블 행에서 월별 값 수집 ---
    # { field_name: { month(1-12): value } }
    field_monthly: Dict[str, Dict[int, Optional[float]]] = {
        field: {} for field in set(MONTHLY_SUMMARY_ROW_MAP.values())
    }

    for record in records:
        label = _to_str(record.data.get(MONTHLY_SUMMARY_COL_LABEL, ""))
        field = MONTHLY_SUMMARY_ROW_MAP.get(label)
        if field is None:
            continue
        for col_idx in MONTHLY_SUMMARY_COL_RANGE:
            month_num = col_idx - 1  # "2"→1월, "13"→12월
            val = _to_float(record.data.get(str(col_idx)))
            # 같은 field에 이미 값이 있으면 덮어쓰지 않음 (투자 원금 / 원금 중복 방지)
            if month_num not in field_monthly[field]:
                field_monthly[field][month_num] = val

    # --- Step 3: 월별 upsert ---
    # Pre-fetch: (year, month, upload_id) 기준 기존 레코드 일괄 로드
    existing_map: Dict[int, MonthlySummary] = {
        ms.month: ms
        for ms in db.query(MonthlySummary).filter(
            MonthlySummary.sheet_id == sheet_id,
            MonthlySummary.year == year,
            MonthlySummary.upload_id == upload_id,
        ).all()
    }

    now = datetime.now()
    results: List[MonthlySummary] = []
    new_records: List[MonthlySummary] = []

    for month_num in range(1, 13):
        income               = field_monthly["income"].get(month_num)
        expense              = field_monthly["expense"].get(month_num)
        net_income           = field_monthly["net_income"].get(month_num)
        cumulative_net_income = field_monthly["cumulative_net_income"].get(month_num)
        investment_principal = field_monthly["investment_principal"].get(month_num)
        investment_value     = field_monthly["investment_value"].get(month_num)

        # 모든 값이 None이면 행 자체가 없는 것 — 저장 생략
        if all(v is None for v in [
            income, expense, net_income,
            cumulative_net_income, investment_principal, investment_value,
        ]):
            continue

        if month_num in existing_map:
            ms = existing_map[month_num]
            ms.income                = income
            ms.expense               = expense
            ms.net_income            = net_income
            ms.cumulative_net_income = cumulative_net_income
            ms.investment_principal  = investment_principal
            ms.investment_value      = investment_value
            ms.updated_at            = now
            results.append(ms)
        else:
            ms = MonthlySummary(
                sheet_id=sheet_id,
                year=year,
                month=month_num,
                income=income,
                expense=expense,
                net_income=net_income,
                cumulative_net_income=cumulative_net_income,
                investment_principal=investment_principal,
                investment_value=investment_value,
                upload_id=upload_id,
            )
            new_records.append(ms)
            results.append(ms)

    if new_records:
        db.add_all(new_records)
    db.commit()

    for ms in results:
        db.refresh(ms)

    return results
