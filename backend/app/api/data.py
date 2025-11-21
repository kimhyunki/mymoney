from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services import data_service
from app.schemas.schemas import (
    UploadHistoryResponse,
    SheetDataResponse,
    DataRecordResponse,
    SheetWithDataResponse,
    CustomerResponse,
    CashFlowResponse
)

router = APIRouter()

@router.get("/uploads", response_model=List[UploadHistoryResponse])
async def get_uploads(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """업로드 이력 목록 조회"""
    uploads = data_service.get_upload_history_list(db=db, skip=skip, limit=limit)
    return uploads

@router.get("/uploads/{upload_id}", response_model=UploadHistoryResponse)
async def get_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """특정 업로드 이력 조회"""
    upload = data_service.get_upload_history(db=db, upload_id=upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="업로드 이력을 찾을 수 없습니다.")
    return upload

@router.get("/uploads/{upload_id}/sheets", response_model=List[SheetDataResponse])
async def get_sheets(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """업로드 ID로 시트 목록 조회"""
    upload = data_service.get_upload_history(db=db, upload_id=upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="업로드 이력을 찾을 수 없습니다.")
    
    sheets = data_service.get_sheets_by_upload(db=db, upload_id=upload_id)
    return sheets

@router.get("/sheets/{sheet_id}", response_model=SheetWithDataResponse)
async def get_sheet_with_data(
    sheet_id: int,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """시트 데이터와 레코드 조회"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")
    
    records = data_service.get_records_by_sheet(db=db, sheet_id=sheet_id, skip=skip, limit=limit)
    
    return SheetWithDataResponse(
        sheet=sheet,
        records=records
    )

@router.post("/sheets/{sheet_id}/extract-customer", response_model=CustomerResponse)
async def extract_customer_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 고객정보를 추출하여 customer 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")
    
    customer = data_service.extract_and_save_customer_from_data_record(db=db, sheet_id=sheet_id)
    if not customer:
        raise HTTPException(status_code=404, detail="고객정보를 찾을 수 없습니다.")
    
    return customer

@router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """고객 목록 조회"""
    from app.models import Customer
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.get("/cash-flows", response_model=List[CashFlowResponse])
async def get_cash_flows(
    sheet_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """현금 흐름 현황 조회"""
    from app.models import CashFlow
    query = db.query(CashFlow)
    if sheet_id:
        query = query.filter(CashFlow.sheet_id == sheet_id)
    cash_flows = query.offset(skip).limit(limit).all()
    return cash_flows

@router.post("/sheets/{sheet_id}/extract-cash-flows", response_model=List[CashFlowResponse])
async def extract_cash_flows_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 현금 흐름 현황을 추출하여 cash_flow 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")
    
    cash_flows = data_service.extract_and_save_cash_flows_from_data_record(db=db, sheet_id=sheet_id)
    return cash_flows

