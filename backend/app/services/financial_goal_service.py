from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import SheetData, DataRecord, FinancialGoal

# 메타데이터 행 레이블 → 필드 매핑
# 실제 시트 구조: B2 이후 행에 레이블/값 쌍
GOAL_META_LABEL_MAP: Dict[str, str] = {
    "목표금액":   "target_amount",
    "시작일":     "start_date",
    "종료일":     "end_date",
    "연이율":     "interest_rate",
    "총 기간":    "total_weeks",
    "경과 기간":  "elapsed_weeks",
    "잔여 기간":  "remaining_weeks",
    "진행률":     "progress_rate",
    "주간 배분":  "weekly_allocation",
    "주간배분":   "weekly_allocation",
}

# 계획/집행 섹션 헤더 키워드
PLAN_HEADER_KEYWORDS   = ["계획", "분양금 계획"]
EXECUTE_HEADER_KEYWORDS = ["집행"]

# 데이터 행 컬럼 인덱스 (계획 섹션)
PLAN_COL_DATE     = "1"   # 날짜
PLAN_COL_CATEGORY = "2"   # 구분
PLAN_COL_ITEM     = "3"   # 지출항목
PLAN_COL_AMOUNT   = "4"   # 자금액
PLAN_COL_BALANCE  = "5"   # 잔액

# 집행 섹션 컬럼 (같은 구조, 열 offset이 다를 수 있으므로 유연하게 처리)
EXEC_COL_DATE     = "8"
EXEC_COL_CATEGORY = "9"
EXEC_COL_ITEM     = "10"
EXEC_COL_AMOUNT   = "11"
EXEC_COL_BALANCE  = "12"


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
            cleaned = value.strip().replace(',', '').replace('%', '')
            if cleaned.replace('.', '').replace('-', '').isdigit():
                return float(cleaned)
    except (ValueError, TypeError):
        pass
    return None


def _parse_meta(records: List[DataRecord]) -> Dict[str, Any]:
    """시트 상단 메타데이터 영역을 파싱합니다."""
    meta: Dict[str, Any] = {}
    for record in records:
        label = _to_str(record.data.get("1", ""))
        value_raw = record.data.get("2")

        field = GOAL_META_LABEL_MAP.get(label)
        if not field:
            continue

        if field in ("target_amount", "weekly_allocation"):
            meta[field] = _to_float(value_raw)
        elif field in ("total_weeks", "elapsed_weeks", "remaining_weeks"):
            f = _to_float(value_raw)
            meta[field] = int(f) if f is not None else None
        elif field == "interest_rate":
            f = _to_float(value_raw)
            # 5 → 0.05 변환 (퍼센트 표기인 경우)
            if f is not None and f > 1:
                f = f / 100
            meta[field] = f
        elif field == "progress_rate":
            f = _to_float(value_raw)
            if f is not None and f > 1:
                f = f / 100
            meta[field] = f
        else:
            meta[field] = _to_str(value_raw) or None

    return meta


def _parse_plan_items(
    records: List[DataRecord],
    date_col: str, cat_col: str, item_col: str, amount_col: str, balance_col: str,
    header_row: int,
) -> List[Dict[str, Any]]:
    """헤더 이후의 계획 또는 집행 항목을 파싱합니다."""
    items = []
    for record in records:
        if record.row_index <= header_row:
            continue
        item_name = _to_str(record.data.get(item_col, ""))
        if not item_name:
            continue
        amount = _to_float(record.data.get(amount_col))
        if amount is None:
            continue
        items.append({
            "date":     _to_str(record.data.get(date_col, "")) or None,
            "category": _to_str(record.data.get(cat_col, "")) or None,
            "item":     item_name,
            "amount":   amount,
            "balance":  _to_float(record.data.get(balance_col)),
        })
    return items


def extract_and_save_financial_goal_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> Optional[FinancialGoal]:
    """
    분양금 계획 시트의 data_record에서 재무 목표를 추출하여 financial_goal 테이블에 저장합니다.
    """
    sheet = db.query(SheetData).filter(SheetData.id == sheet_id).first()
    if not sheet:
        return None

    if upload_id is None:
        upload_id = sheet.upload_id

    records = (
        db.query(DataRecord)
        .filter(DataRecord.sheet_id == sheet_id)
        .order_by(DataRecord.row_index)
        .all()
    )
    if not records:
        return None

    # goal_name은 시트 이름 사용
    goal_name = sheet.sheet_name or "재무 목표"

    # 메타데이터 파싱
    meta = _parse_meta(records)

    # 계획/집행 헤더 탐색
    plan_header_row = -1
    exec_header_row = -1
    for record in records:
        col1 = _to_str(record.data.get("1", ""))
        col2 = _to_str(record.data.get("2", ""))
        if any(k in col1 for k in PLAN_HEADER_KEYWORDS) or any(k in col2 for k in PLAN_HEADER_KEYWORDS):
            if plan_header_row == -1:
                plan_header_row = record.row_index
        if any(k in col1 for k in EXECUTE_HEADER_KEYWORDS) or any(k in col2 for k in EXECUTE_HEADER_KEYWORDS):
            exec_header_row = record.row_index

    # 계획 항목 파싱
    planned_data = []
    if plan_header_row >= 0:
        planned_data = _parse_plan_items(
            records, PLAN_COL_DATE, PLAN_COL_CATEGORY, PLAN_COL_ITEM,
            PLAN_COL_AMOUNT, PLAN_COL_BALANCE, plan_header_row,
        )

    # 집행 항목 파싱
    actual_data = []
    if exec_header_row >= 0:
        actual_data = _parse_plan_items(
            records, EXEC_COL_DATE, EXEC_COL_CATEGORY, EXEC_COL_ITEM,
            EXEC_COL_AMOUNT, EXEC_COL_BALANCE, exec_header_row,
        )

    now = datetime.now()
    existing = db.query(FinancialGoal).filter(
        FinancialGoal.sheet_id == sheet_id,
        FinancialGoal.goal_name == goal_name,
    ).first()

    if existing:
        existing.target_amount     = meta.get("target_amount")
        existing.start_date        = meta.get("start_date")
        existing.end_date          = meta.get("end_date")
        existing.interest_rate     = meta.get("interest_rate")
        existing.total_weeks       = meta.get("total_weeks")
        existing.elapsed_weeks     = meta.get("elapsed_weeks")
        existing.remaining_weeks   = meta.get("remaining_weeks")
        existing.progress_rate     = meta.get("progress_rate")
        existing.weekly_allocation = meta.get("weekly_allocation")
        existing.planned_data      = planned_data or None
        existing.actual_data       = actual_data or None
        existing.upload_id         = upload_id
        existing.updated_at        = now
        db.commit()
        db.refresh(existing)
        return existing
    else:
        goal = FinancialGoal(
            sheet_id=sheet_id,
            goal_name=goal_name,
            target_amount=meta.get("target_amount"),
            start_date=meta.get("start_date"),
            end_date=meta.get("end_date"),
            interest_rate=meta.get("interest_rate"),
            total_weeks=meta.get("total_weeks"),
            elapsed_weeks=meta.get("elapsed_weeks"),
            remaining_weeks=meta.get("remaining_weeks"),
            progress_rate=meta.get("progress_rate"),
            weekly_allocation=meta.get("weekly_allocation"),
            planned_data=planned_data or None,
            actual_data=actual_data or None,
            upload_id=upload_id,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal
