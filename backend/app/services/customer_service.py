from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date
from app.models import UploadHistory, SheetData, DataRecord, Customer
from app.services.utils.date_utils import (
    parse_date_range_from_filename,
    is_date_in_range,
    is_upload_newer,
)


def extract_and_save_customer_from_data_record(
    db: Session, sheet_id: int, upload_id: int
) -> Optional[Customer]:
    """
    data_record에서 고객정보를 추출하여 customer 테이블에 저장합니다.
    고객정보는 보통 헤더 행(이름, 성별, 연령 등) 다음 행에 위치합니다.
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

    # 헤더 행 찾기
    header_row_index = None
    for record in records:
        data = record.data
        col1 = data.get("1", "").strip() if data.get("1") else ""
        if col1 in ["이름", "고객정보"] or "이름" in col1:
            header_row_index = record.row_index
            break

    if header_row_index is None:
        return None

    # 헤더 다음 행이 고객정보 데이터
    customer_record = None
    for record in records:
        if record.row_index == header_row_index + 1:
            customer_record = record
            break

    if not customer_record:
        return None

    data = customer_record.data
    name = data.get("1", "").strip() if data.get("1") else ""
    gender = data.get("2", "").strip() if data.get("2") else None
    age_str = data.get("3", "")
    credit_score_str = data.get("4", "")
    email = data.get("5", "").strip() if data.get("5") else None

    if not name or name in ["항목", "2.현금흐름현황"]:
        return None

    age = None
    if age_str:
        try:
            age = int(age_str) if isinstance(age_str, (int, str)) and str(age_str).isdigit() else None
        except (ValueError, TypeError):
            age = None

    credit_score = None
    if credit_score_str:
        try:
            credit_score = (
                int(credit_score_str)
                if isinstance(credit_score_str, (int, str)) and str(credit_score_str).isdigit()
                else None
            )
        except (ValueError, TypeError):
            credit_score = None

    if email in ("-", ""):
        email = None

    current_upload = db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()
    if not current_upload:
        return None

    # 같은 이름 + upload_id 고객 확인 (upsert)
    existing = db.query(Customer).filter(
        Customer.name == name, Customer.upload_id == upload_id
    ).first()

    if existing:
        existing.name = name
        existing.gender = gender
        existing.age = age
        existing.credit_score = credit_score
        existing.email = email
        existing.data_record_id = customer_record.id
        existing.updated_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing

    # 같은 이름의 다른 업로드 고객 확인 (날짜 우선순위)
    existing_by_name = (
        db.query(Customer)
        .filter(Customer.name == name)
        .join(UploadHistory, Customer.upload_id == UploadHistory.id)
        .order_by(UploadHistory.uploaded_at.desc())
        .first()
    )

    if existing_by_name:
        existing_upload = db.query(UploadHistory).filter(
            UploadHistory.id == existing_by_name.upload_id
        ).first()

        if existing_upload:
            today = date.today()
            current_range = parse_date_range_from_filename(current_upload.filename)
            existing_range = parse_date_range_from_filename(existing_upload.filename)

            current_in_range = (
                is_date_in_range(today, current_range[0], current_range[1])
                if current_range else True
            )
            existing_in_range = (
                is_date_in_range(today, existing_range[0], existing_range[1])
                if existing_range else True
            )

            if current_in_range and not existing_in_range:
                should_update = True
            elif not current_in_range and existing_in_range:
                should_update = False
            else:
                should_update = is_upload_newer(current_upload, existing_upload)

            if should_update:
                existing_by_name.name = name
                existing_by_name.gender = gender
                existing_by_name.age = age
                existing_by_name.credit_score = credit_score
                existing_by_name.email = email
                existing_by_name.upload_id = upload_id
                existing_by_name.data_record_id = customer_record.id
                existing_by_name.updated_at = datetime.now()
                db.commit()
                db.refresh(existing_by_name)
                return existing_by_name

    # 새 고객 생성
    customer = Customer(
        name=name,
        gender=gender,
        age=age,
        credit_score=credit_score,
        email=email,
        upload_id=upload_id,
        data_record_id=customer_record.id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
