from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime, date, time
from app.models import UploadHistory, SheetData, DataRecord

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

