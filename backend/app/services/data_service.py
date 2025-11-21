from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime, date, time
from app.models import UploadHistory, SheetData, DataRecord, Customer

def create_upload_history(db: Session, filename: str, sheet_count: int) -> UploadHistory:
    """업로드 이력 생성"""
    upload = UploadHistory(filename=filename, sheet_count=sheet_count)
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload

def create_sheet_data(db: Session, upload_id: int, sheet_name: str, row_count: int, column_count: int) -> SheetData:
    """시트 데이터 생성"""
    sheet = SheetData(
        upload_id=upload_id,
        sheet_name=sheet_name,
        row_count=row_count,
        column_count=column_count
    )
    db.add(sheet)
    db.commit()
    db.refresh(sheet)
    return sheet

def _convert_datetime_to_string(value: Any) -> Any:
    """
    datetime, date, time 객체를 ISO 형식 문자열로 변환합니다.
    다른 타입의 값은 그대로 반환합니다.
    
    Args:
        value: 변환할 값
    
    Returns:
        datetime/date/time 객체는 ISO 형식 문자열, 그 외는 원본 값
    """
    if isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, date):
        return value.isoformat()
    elif isinstance(value, time):
        return value.isoformat()
    return value

def create_data_records(db: Session, sheet_id: int, data: List[List[Any]]) -> List[DataRecord]:
    """데이터 레코드 생성"""
    records = []
    for row_index, row_data in enumerate(data):
        # 행 데이터를 딕셔너리로 변환 (열 인덱스를 키로 사용)
        # datetime 객체가 있는 경우 문자열로 변환 (이중 보호)
        row_dict = {str(i): _convert_datetime_to_string(value) for i, value in enumerate(row_data)}
        record = DataRecord(
            sheet_id=sheet_id,
            row_index=row_index,
            data=row_dict
        )
        records.append(record)
    
    db.add_all(records)
    db.commit()
    return records

def get_upload_history_list(db: Session, skip: int = 0, limit: int = 100) -> List[UploadHistory]:
    """업로드 이력 목록 조회"""
    return db.query(UploadHistory).offset(skip).limit(limit).all()

def get_upload_history(db: Session, upload_id: int) -> Optional[UploadHistory]:
    """업로드 이력 조회"""
    return db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()

def get_sheets_by_upload(db: Session, upload_id: int) -> List[SheetData]:
    """업로드 ID로 시트 목록 조회"""
    return db.query(SheetData).filter(SheetData.upload_id == upload_id).all()

def get_sheet_data(db: Session, sheet_id: int) -> Optional[SheetData]:
    """시트 데이터 조회"""
    return db.query(SheetData).filter(SheetData.id == sheet_id).first()

def get_records_by_sheet(db: Session, sheet_id: int, skip: int = 0, limit: int = 1000) -> List[DataRecord]:
    """시트 ID로 데이터 레코드 조회"""
    return db.query(DataRecord).filter(DataRecord.sheet_id == sheet_id).offset(skip).limit(limit).all()

def extract_and_save_customer_from_data_record(db: Session, sheet_id: int) -> Optional[Customer]:
    """
    data_record에서 고객정보를 추출하여 customer 테이블에 저장합니다.
    
    고객정보는 보통 헤더 행(이름, 성별, 연령 등) 다음 행에 위치합니다.
    
    Args:
        db: 데이터베이스 세션
        sheet_id: 시트 ID
    
    Returns:
        생성된 Customer 객체 또는 None
    """
    # 시트의 모든 레코드 조회
    records = db.query(DataRecord).filter(DataRecord.sheet_id == sheet_id).order_by(DataRecord.row_index).all()
    
    if not records:
        return None
    
    # 헤더 행 찾기 (이름, 성별, 연령 등의 키워드가 있는 행)
    header_row_index = None
    for record in records:
        data = record.data
        col1 = data.get("1", "").strip() if data.get("1") else ""
        # 헤더 행 확인 (이름, 성별 등의 키워드 포함)
        if col1 in ["이름", "고객정보"] or "이름" in col1:
            header_row_index = record.row_index
            break
    
    if header_row_index is None:
        return None
    
    # 헤더 행 다음 행이 고객정보 데이터
    customer_record = None
    for record in records:
        if record.row_index == header_row_index + 1:
            customer_record = record
            break
    
    if not customer_record:
        return None
    
    data = customer_record.data
    
    # 고객정보 추출
    name = data.get("1", "").strip() if data.get("1") else ""
    gender = data.get("2", "").strip() if data.get("2") else None
    age_str = data.get("3", "")
    credit_score_str = data.get("4", "")
    email = data.get("5", "").strip() if data.get("5") else None
    
    # 이름이 없으면 고객정보가 아님
    if not name or name in ["항목", "2.현금흐름현황"]:
        return None
    
    # 나이와 신용점수 변환
    age = None
    if age_str:
        try:
            age = int(age_str) if isinstance(age_str, (int, str)) and str(age_str).isdigit() else None
        except (ValueError, TypeError):
            age = None
    
    credit_score = None
    if credit_score_str:
        try:
            credit_score = int(credit_score_str) if isinstance(credit_score_str, (int, str)) and str(credit_score_str).isdigit() else None
        except (ValueError, TypeError):
            credit_score = None
    
    # 이메일이 "-"이면 None으로 처리
    if email == "-" or email == "":
        email = None
    
    # 이미 존재하는 고객인지 확인 (같은 data_record_id로)
    existing_customer = db.query(Customer).filter(Customer.data_record_id == customer_record.id).first()
    if existing_customer:
        # 기존 고객 정보 업데이트
        existing_customer.name = name
        existing_customer.gender = gender
        existing_customer.age = age
        existing_customer.credit_score = credit_score
        existing_customer.email = email
        existing_customer.updated_at = datetime.now()
        db.commit()
        db.refresh(existing_customer)
        return existing_customer
    
    # 새 고객 생성
    customer = Customer(
        name=name,
        gender=gender,
        age=age,
        credit_score=credit_score,
        email=email,
        data_record_id=customer_record.id
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

