from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import SheetData, DataRecord, FixedExpense

# --- 컬럼 인덱스 (고정비 시트) ---
# B:계좌번호 C:은행 D:예금주 E:이체명 F:성향 G:항목 H-S:01월-12월
FIXED_EXP_COL_ACCOUNT  = "1"   # 계좌(번호)
FIXED_EXP_COL_BANK     = "2"   # 은행
FIXED_EXP_COL_HOLDER   = "3"   # 예금주
FIXED_EXP_COL_TRANSFER = "4"   # 이체명
FIXED_EXP_COL_CATEGORY = "5"   # 성향
FIXED_EXP_COL_ITEM     = "6"   # 항목
FIXED_EXP_MONTHLY_RANGE = range(7, 19)  # "7"→1월, "18"→12월
FIXED_EXP_YEAR          = 2026

# 헤더 행 탐지 키워드
FIXED_EXP_HEADER_KEYS = ["계좌(번호)", "계좌번호", "계좌"]

# 제외 행 (헤더·합계 등)
FIXED_EXP_EXCLUDE = {"계좌(번호)", "계좌번호", "합계", "소계", "항목", "성향", ""}


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


def _find_header_row(records: List[DataRecord]) -> Optional[int]:
    """계좌(번호) 헤더 행의 row_index를 반환합니다."""
    for record in records:
        col1 = _to_str(record.data.get(FIXED_EXP_COL_ACCOUNT, ""))
        if col1 in FIXED_EXP_HEADER_KEYS:
            return record.row_index
    return None


def extract_and_save_fixed_expenses_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> List[FixedExpense]:
    """
    고정비 시트의 data_record에서 항목을 추출하여 fixed_expense 테이블에 저장합니다.
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

    header_row_index = _find_header_row(records)
    if header_row_index is None:
        return []

    # Pre-fetch: (item_name, upload_id) 기준 기존 레코드 일괄 로드
    existing_map: Dict[str, FixedExpense] = {
        fe.item_name: fe
        for fe in db.query(FixedExpense).filter(
            FixedExpense.sheet_id == sheet_id,
            FixedExpense.upload_id == upload_id,
        ).all()
    }

    now = datetime.now()
    results: List[FixedExpense] = []
    new_records: List[FixedExpense] = []

    for record in records:
        if record.row_index <= header_row_index:
            continue

        item_name = _to_str(record.data.get(FIXED_EXP_COL_ITEM, ""))
        if not item_name or item_name in FIXED_EXP_EXCLUDE:
            continue

        category = _to_str(record.data.get(FIXED_EXP_COL_CATEGORY, ""))
        if not category or category in FIXED_EXP_EXCLUDE:
            continue

        account_number = _to_str(record.data.get(FIXED_EXP_COL_ACCOUNT, "")) or None
        bank_name      = _to_str(record.data.get(FIXED_EXP_COL_BANK, "")) or None
        account_holder = _to_str(record.data.get(FIXED_EXP_COL_HOLDER, "")) or None
        transfer_name  = _to_str(record.data.get(FIXED_EXP_COL_TRANSFER, "")) or None

        # 월별 데이터 빌드: col_idx 7→1월, 8→2월, ..., 18→12월
        monthly_data: Dict[str, float] = {}
        for col_idx in FIXED_EXP_MONTHLY_RANGE:
            month_num = col_idx - 6  # 7→1, 8→2, ..., 18→12
            val = _to_float(record.data.get(str(col_idx)))
            if val is not None:
                monthly_data[f"{FIXED_EXP_YEAR}-{month_num:02d}"] = val

        # 대표 월 금액: 첫 번째 non-None 값
        monthly_amount = next(iter(monthly_data.values()), None)

        if item_name in existing_map:
            fe = existing_map[item_name]
            fe.account_number = account_number
            fe.bank_name      = bank_name
            fe.account_holder = account_holder
            fe.transfer_name  = transfer_name
            fe.category       = category
            fe.monthly_amount = monthly_amount
            fe.monthly_data   = monthly_data
            fe.data_record_id = record.id
            fe.updated_at     = now
            results.append(fe)
        else:
            fe = FixedExpense(
                sheet_id=sheet_id,
                account_number=account_number,
                bank_name=bank_name,
                account_holder=account_holder,
                transfer_name=transfer_name,
                category=category,
                item_name=item_name,
                monthly_amount=monthly_amount,
                monthly_data=monthly_data,
                upload_id=upload_id,
                data_record_id=record.id,
            )
            new_records.append(fe)
            results.append(fe)

    if new_records:
        db.add_all(new_records)
    db.commit()

    for fe in results:
        db.refresh(fe)

    return results
