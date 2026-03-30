from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app.models import UploadHistory, SheetData, DataRecord, Customer, CashFlow, FixedExpense, MonthlySummary, FinancialGoal, RealEstateAnalysis
from app.services.excel_parser import convert_datetime_to_string


def create_upload_history(db: Session, filename: str, sheet_count: int) -> UploadHistory:
    """업로드 이력 생성"""
    upload = UploadHistory(filename=filename, sheet_count=sheet_count)
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


def create_sheet_data(
    db: Session, upload_id: int, sheet_name: str, row_count: int, column_count: int
) -> SheetData:
    """시트 데이터 생성"""
    sheet = SheetData(
        upload_id=upload_id,
        sheet_name=sheet_name,
        row_count=row_count,
        column_count=column_count,
    )
    db.add(sheet)
    db.commit()
    db.refresh(sheet)
    return sheet


def create_data_records(db: Session, sheet_id: int, data: List[List[Any]]) -> List[DataRecord]:
    """데이터 레코드 생성"""
    records = []
    for row_index, row_data in enumerate(data):
        row_dict = {str(i): convert_datetime_to_string(value) for i, value in enumerate(row_data)}
        records.append(DataRecord(sheet_id=sheet_id, row_index=row_index, data=row_dict))
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


def get_records_by_sheet(
    db: Session, sheet_id: int, skip: int = 0, limit: int = 1000
) -> List[DataRecord]:
    """시트 ID로 데이터 레코드 조회"""
    return (
        db.query(DataRecord)
        .filter(DataRecord.sheet_id == sheet_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_records_by_ids(db: Session, record_ids: List[int]) -> List[DataRecord]:
    """레코드 ID 리스트로 레코드 조회"""
    if not record_ids:
        return []
    return db.query(DataRecord).filter(DataRecord.id.in_(record_ids)).all()


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    """고객 목록 조회"""
    return db.query(Customer).offset(skip).limit(limit).all()


def get_cash_flows(
    db: Session, sheet_id: Optional[int] = None, skip: int = 0, limit: int = 1000
) -> List[CashFlow]:
    """현금 흐름 현황 조회"""
    query = db.query(CashFlow)
    if sheet_id:
        query = query.filter(CashFlow.sheet_id == sheet_id)
    return query.offset(skip).limit(limit).all()


def get_fixed_expenses(
    db: Session, sheet_id: Optional[int] = None, skip: int = 0, limit: int = 1000
) -> List[FixedExpense]:
    """고정비 조회"""
    query = db.query(FixedExpense)
    if sheet_id:
        query = query.filter(FixedExpense.sheet_id == sheet_id)
    return query.offset(skip).limit(limit).all()


def get_monthly_summaries(
    db: Session, year: Optional[int] = None, skip: int = 0, limit: int = 1000
) -> List[MonthlySummary]:
    """월별 결산 조회"""
    query = db.query(MonthlySummary)
    if year:
        query = query.filter(MonthlySummary.year == year)
    return query.order_by(MonthlySummary.year, MonthlySummary.month).offset(skip).limit(limit).all()


def get_financial_goals(
    db: Session, skip: int = 0, limit: int = 100
) -> List[FinancialGoal]:
    """재무 목표 조회"""
    return db.query(FinancialGoal).offset(skip).limit(limit).all()


def get_real_estate_analyses(
    db: Session, skip: int = 0, limit: int = 100
) -> List[RealEstateAnalysis]:
    """부동산 수익분석 조회"""
    return db.query(RealEstateAnalysis).offset(skip).limit(limit).all()
