from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import SheetData, DataRecord, RealEstateAnalysis

# 키워드 → 모델 필드 매핑
REAL_ESTATE_FIELD_MAP: Dict[str, str] = {
    "취득원가":   "total_acquisition_cost",
    "자기자본":   "self_capital",
    "타인자본":   "loan_capital",
    "시세":       "current_market_value",
    "현재 시세":  "current_market_value",
    "시세차익":   "unrealized_gain",
    "ROE":        "roe",
    "레버리지 배수": "leverage_multiple",
    "레버리지배수":  "leverage_multiple",
    "가속계수":   "acceleration_factor",
}

# 값 컬럼 인덱스 후보 (B열 = "1" = 레이블, C열 이후 = 값)
VALUE_COL_CANDIDATES = ["2", "3", "4"]


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


def _find_value(data: dict) -> Optional[float]:
    """B열이 레이블일 때 인접 값 컬럼에서 첫 번째 유효 숫자를 반환합니다."""
    for col in VALUE_COL_CANDIDATES:
        val = _to_float(data.get(col))
        if val is not None:
            return val
    return None


def extract_and_save_real_estate_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> Optional[RealEstateAnalysis]:
    """
    부동산 수익분석 시트의 data_record에서 지표를 추출하여 real_estate_analysis 테이블에 저장합니다.
    시트당 1개 레코드 upsert.
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

    # 키워드 매핑으로 각 지표 추출
    fields: Dict[str, Any] = {}
    raw_rows: List[Dict] = []

    for record in records:
        label = _to_str(record.data.get("1", ""))
        field = REAL_ESTATE_FIELD_MAP.get(label)
        if field and field not in fields:
            val = _find_value(record.data)
            if val is not None:
                # ROE / 레버리지 / 가속계수: 퍼센트 표기이면 변환
                if field == "roe" and val > 1:
                    val = val / 100
                fields[field] = val

        # 원시 데이터 보존 (레이블이 있는 행만)
        if label:
            raw_rows.append({"row": record.row_index, "label": label, "data": record.data})

    # property_name: 시트 이름에서 추출
    property_name = sheet.sheet_name or None

    now = datetime.now()
    existing = db.query(RealEstateAnalysis).filter(
        RealEstateAnalysis.sheet_id == sheet_id,
    ).first()

    if existing:
        existing.property_name          = property_name
        existing.total_acquisition_cost = fields.get("total_acquisition_cost")
        existing.self_capital           = fields.get("self_capital")
        existing.loan_capital           = fields.get("loan_capital")
        existing.current_market_value   = fields.get("current_market_value")
        existing.unrealized_gain        = fields.get("unrealized_gain")
        existing.roe                    = fields.get("roe")
        existing.leverage_multiple      = fields.get("leverage_multiple")
        existing.acceleration_factor    = fields.get("acceleration_factor")
        existing.analysis_data          = {"rows": raw_rows[:50]}  # 상위 50행만 보존
        existing.upload_id              = upload_id
        existing.updated_at             = now
        db.commit()
        db.refresh(existing)
        return existing
    else:
        analysis = RealEstateAnalysis(
            sheet_id=sheet_id,
            property_name=property_name,
            total_acquisition_cost=fields.get("total_acquisition_cost"),
            self_capital=fields.get("self_capital"),
            loan_capital=fields.get("loan_capital"),
            current_market_value=fields.get("current_market_value"),
            unrealized_gain=fields.get("unrealized_gain"),
            roe=fields.get("roe"),
            leverage_multiple=fields.get("leverage_multiple"),
            acceleration_factor=fields.get("acceleration_factor"),
            analysis_data={"rows": raw_rows[:50]},
            upload_id=upload_id,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis
