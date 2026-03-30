import re
from calendar import monthrange
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models import UploadHistory, SheetData, DataRecord, CashFlow
from app.services.utils.date_utils import (
    parse_date_range_from_filename,
    is_date_in_range,
    is_upload_newer,
)

# --- 컬럼 인덱스 ---
COL_ITEM_NAME = "1"
COL_TOTAL = "2"
COL_MONTHLY_AVG = "3"
MONTHLY_COL_RANGE = range(4, 17)

# --- 제외 키워드 ---
CASH_FLOW_EXCLUDE_KEYWORDS = [
    "항목",
    "2.현금흐름현황",
    "최근 1년 동안의 현금흐름을 분석합니다.",
    "월수입 총계",
    "월지출 총계",
    "순수입 총계",
    "총계",
    "현금 자산",
    "데이터를 내보낸 시점의 자산과 부채 상태를 분석합니다.",
    "사용자가 보유한 대출상품 현황을 분석합니다.",
    "사용자가 보유한 보험상품 현황을 분석합니다.",
    "사용자가 보유한 투자상품 현황을 분석합니다.",
    "대출종류",
    "금융사",
]
ASSET_KEYWORDS = [
    "자산", "부동산", "동산", "주식", "연금", "신탁", "보험", "저축",
    "투자상품", "삼성생명", "삼성화재", "현대해상", "순자산", "총자산", "전자금융",
]
INCOME_KEYWORDS = ["수입", "급여", "상여", "용돈", "금융수입", "기타수입", "사업수입", "앱테크"]
EXPENSE_KEYWORDS = [
    "지출", "경조", "선물", "교육", "학습", "교통", "금융", "문화", "여가",
    "뷰티", "미용", "생활", "식비", "여행", "숙박", "온라인쇼핑", "의료", "건강",
    "자녀", "육아", "자동차", "주거", "통신", "카페", "간식", "패션", "쇼핑",
]


def _to_str(value: Any) -> str:
    """int/float/str 값을 strip된 문자열로 변환합니다."""
    if isinstance(value, (int, float)):
        return str(value).strip()
    if isinstance(value, str):
        return value.strip()
    return ""


def _to_float(value: Any) -> Optional[float]:
    """int/float/str 값을 float으로 변환합니다. 변환 불가 시 None 반환."""
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


def _find_section_header(records: List[DataRecord]) -> Optional[int]:
    """'현금흐름현황' 섹션 헤더의 row_index를 반환합니다."""
    for record in records:
        col1 = _to_str(record.data.get(COL_ITEM_NAME, ""))
        if "현금흐름현황" in col1 or "현금흐름" in col1:
            return record.row_index
    return None


def _find_column_headers(
    records: List[DataRecord], section_start: int
) -> Tuple[Optional[int], Dict[str, str]]:
    """'항목' 헤더 행을 찾아 (header_row_index, {col_idx: month_str}) 를 반환합니다."""
    for record in records:
        if record.row_index <= section_start:
            continue
        col1 = _to_str(record.data.get(COL_ITEM_NAME, ""))
        if col1 == "항목":
            monthly_headers: Dict[str, str] = {}
            for col_idx in MONTHLY_COL_RANGE:
                month_str = _to_str(record.data.get(str(col_idx), ""))
                if month_str and month_str not in ["총계", "월평균"]:
                    monthly_headers[str(col_idx)] = month_str
            return record.row_index, monthly_headers
    return None, {}


def _extract_row_data(
    data: dict, monthly_headers: Dict[str, str]
) -> Optional[Tuple[str, Optional[float], Optional[float], dict, Optional[str]]]:
    """
    단일 데이터 행에서 현금흐름 정보를 추출합니다.
    건너뛸 행이면 None을 반환합니다.
    Returns: (item_name, total, monthly_average, monthly_data, item_type)
    """
    item_name = _to_str(data.get(COL_ITEM_NAME, ""))

    if not item_name or item_name in CASH_FLOW_EXCLUDE_KEYWORDS:
        return None
    if "총계" in item_name or "현황" in item_name or "분석" in item_name:
        return None
    if re.match(r'^[\d.]+$', item_name):
        return None
    if re.match(r'^\d+\.', item_name):
        return None
    if any(keyword in item_name for keyword in ASSET_KEYWORDS):
        return None

    total = _to_float(data.get(COL_TOTAL, ""))
    monthly_average = _to_float(data.get(COL_MONTHLY_AVG, ""))

    monthly_data: dict = {}
    for col_idx, month_str in monthly_headers.items():
        amount = _to_float(data.get(col_idx, ""))
        if amount is not None:
            monthly_data[month_str] = amount

    item_type = None
    if any(keyword in item_name for keyword in INCOME_KEYWORDS):
        item_type = "수입"
    elif any(keyword in item_name for keyword in EXPENSE_KEYWORDS):
        item_type = "지출"

    return item_name, total, monthly_average, monthly_data, item_type


def _merge_monthly_data(
    existing_monthly: dict,
    new_monthly: dict,
    current_upload: UploadHistory,
    existing_upload: UploadHistory,
) -> dict:
    """두 업로드의 월별 데이터를 날짜 범위 우선순위에 따라 병합합니다."""
    merged = dict(existing_monthly) if existing_monthly else {}
    current_is_newer = is_upload_newer(current_upload, existing_upload)
    current_range = parse_date_range_from_filename(current_upload.filename)
    existing_range = parse_date_range_from_filename(existing_upload.filename)

    for month_key, amount in new_monthly.items():
        if merged.get(month_key) is None:
            merged[month_key] = amount
            continue

        should_update = False
        try:
            year, month = map(int, month_key.split('-'))
            month_start = date(year, month, 1)
            month_end = date(year, month, monthrange(year, month)[1])

            current_in_range = (
                is_date_in_range(month_start, current_range[0], current_range[1]) or
                is_date_in_range(month_end, current_range[0], current_range[1]) or
                (month_start <= current_range[0] <= month_end) or
                (month_start <= current_range[1] <= month_end)
            ) if current_range else True

            existing_in_range = (
                is_date_in_range(month_start, existing_range[0], existing_range[1]) or
                is_date_in_range(month_end, existing_range[0], existing_range[1]) or
                (month_start <= existing_range[0] <= month_end) or
                (month_start <= existing_range[1] <= month_end)
            ) if existing_range else True

            if current_in_range and not existing_in_range:
                should_update = True
            elif not current_in_range and existing_in_range:
                should_update = False
            elif current_is_newer:
                should_update = True
        except Exception:
            if current_is_newer:
                should_update = True

        if should_update:
            merged[month_key] = amount

    return merged


def extract_and_save_cash_flows_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> List[CashFlow]:
    """
    data_record에서 현금 흐름 현황을 추출하여 cash_flow 테이블에 저장합니다.
    """
    sheet = db.query(SheetData).filter(SheetData.id == sheet_id).first()
    if not sheet:
        return []

    if upload_id is None:
        upload_id = sheet.upload_id

    current_upload = db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()
    if not current_upload:
        return []

    records = (
        db.query(DataRecord)
        .filter(DataRecord.sheet_id == sheet_id)
        .order_by(DataRecord.row_index)
        .all()
    )
    if not records:
        return []

    cash_flow_start_index = _find_section_header(records)
    if cash_flow_start_index is None:
        return []

    header_row_index, monthly_headers = _find_column_headers(records, cash_flow_start_index)
    if header_row_index is None:
        return []

    cash_flows = []
    for record in records:
        if record.row_index <= header_row_index:
            continue

        row = _extract_row_data(record.data, monthly_headers)
        if row is None:
            continue

        item_name, total, monthly_average, monthly_data, item_type = row

        # 같은 sheet_id + item_name + upload_id upsert
        existing = db.query(CashFlow).filter(
            CashFlow.sheet_id == sheet_id,
            CashFlow.item_name == item_name,
            CashFlow.upload_id == upload_id,
        ).first()

        if existing:
            existing.item_type = item_type
            existing.total = total
            existing.monthly_average = monthly_average
            existing.monthly_data = monthly_data
            existing.data_record_id = record.id
            existing.updated_at = datetime.now()
            db.commit()
            db.refresh(existing)
            cash_flows.append(existing)
            continue

        # 같은 항목명의 다른 업로드 확인 (월별 데이터 병합)
        existing_by_item = (
            db.query(CashFlow)
            .filter(CashFlow.item_name == item_name)
            .join(UploadHistory, CashFlow.upload_id == UploadHistory.id)
            .order_by(UploadHistory.uploaded_at.desc())
            .first()
        )

        if existing_by_item:
            existing_upload = db.query(UploadHistory).filter(
                UploadHistory.id == existing_by_item.upload_id
            ).first()

            if existing_upload:
                merged = _merge_monthly_data(
                    existing_by_item.monthly_data, monthly_data, current_upload, existing_upload
                )
                existing_by_item.monthly_data = merged
                existing_by_item.updated_at = datetime.now()

                if is_upload_newer(current_upload, existing_upload):
                    existing_by_item.item_type = item_type
                    existing_by_item.total = total
                    existing_by_item.monthly_average = monthly_average
                    existing_by_item.upload_id = upload_id
                    existing_by_item.sheet_id = sheet_id
                    existing_by_item.data_record_id = record.id
            else:
                existing_by_item.item_type = item_type
                existing_by_item.total = total
                existing_by_item.monthly_average = monthly_average
                existing_by_item.monthly_data = monthly_data
                existing_by_item.upload_id = upload_id
                existing_by_item.sheet_id = sheet_id
                existing_by_item.data_record_id = record.id
                existing_by_item.updated_at = datetime.now()

            db.commit()
            db.refresh(existing_by_item)
            cash_flows.append(existing_by_item)
        else:
            cash_flow = CashFlow(
                sheet_id=sheet_id,
                item_name=item_name,
                item_type=item_type,
                total=total,
                monthly_average=monthly_average,
                monthly_data=monthly_data,
                upload_id=upload_id,
                data_record_id=record.id,
            )
            db.add(cash_flow)
            db.commit()
            db.refresh(cash_flow)
            cash_flows.append(cash_flow)

    return cash_flows
