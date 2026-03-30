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
    CashFlowResponse,
    FixedExpenseResponse,
    MonthlySummaryResponse,
    FinancialGoalResponse,
    RealEstateAnalysisResponse,
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
    
    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")
    
    customer = data_service.extract_and_save_customer_from_data_record(
        db=db, 
        sheet_id=sheet_id,
        upload_id=sheet.upload_id
    )
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
    return data_service.get_customers(db=db, skip=skip, limit=limit)

@router.get("/cash-flows", response_model=List[CashFlowResponse])
async def get_cash_flows(
    sheet_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """현금 흐름 현황 조회"""
    return data_service.get_cash_flows(db=db, sheet_id=sheet_id, skip=skip, limit=limit)

@router.post("/sheets/{sheet_id}/extract-cash-flows", response_model=List[CashFlowResponse])
async def extract_cash_flows_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 현금 흐름 현황을 추출하여 cash_flow 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")
    
    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")
    
    cash_flows = data_service.extract_and_save_cash_flows_from_data_record(
        db=db, 
        sheet_id=sheet_id,
        upload_id=sheet.upload_id
    )
    return cash_flows

@router.get("/fixed-expenses", response_model=List[FixedExpenseResponse])
async def get_fixed_expenses(
    sheet_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """고정비 목록 조회"""
    return data_service.get_fixed_expenses(db=db, sheet_id=sheet_id, skip=skip, limit=limit)

@router.post("/sheets/{sheet_id}/extract-fixed-expenses", response_model=List[FixedExpenseResponse])
async def extract_fixed_expenses_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 고정비를 추출하여 fixed_expense 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")

    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")

    return data_service.extract_and_save_fixed_expenses_from_data_record(
        db=db,
        sheet_id=sheet_id,
        upload_id=sheet.upload_id,
    )

@router.get("/monthly-summaries", response_model=List[MonthlySummaryResponse])
async def get_monthly_summaries(
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """월별 결산 목록 조회"""
    return data_service.get_monthly_summaries(db=db, year=year, skip=skip, limit=limit)

@router.post("/sheets/{sheet_id}/extract-monthly-summary", response_model=List[MonthlySummaryResponse])
async def extract_monthly_summary_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 월별 결산을 추출하여 monthly_summary 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")

    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")

    return data_service.extract_and_save_monthly_summary_from_data_record(
        db=db,
        sheet_id=sheet_id,
        upload_id=sheet.upload_id,
    )

@router.get("/financial-goals", response_model=List[FinancialGoalResponse])
async def get_financial_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """재무 목표 목록 조회"""
    return data_service.get_financial_goals(db=db, skip=skip, limit=limit)

@router.post("/sheets/{sheet_id}/extract-financial-goal", response_model=FinancialGoalResponse)
async def extract_financial_goal_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 재무 목표를 추출하여 financial_goal 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")

    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")

    result = data_service.extract_and_save_financial_goal_from_data_record(
        db=db, sheet_id=sheet_id, upload_id=sheet.upload_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="재무 목표 데이터를 찾을 수 없습니다.")
    return result

@router.get("/real-estate-analyses", response_model=List[RealEstateAnalysisResponse])
async def get_real_estate_analyses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """부동산 수익분석 목록 조회"""
    return data_service.get_real_estate_analyses(db=db, skip=skip, limit=limit)

@router.post("/sheets/{sheet_id}/extract-real-estate", response_model=RealEstateAnalysisResponse)
async def extract_real_estate_from_sheet(
    sheet_id: int,
    db: Session = Depends(get_db)
):
    """시트에서 부동산 수익분석을 추출하여 real_estate_analysis 테이블에 저장"""
    sheet = data_service.get_sheet_data(db=db, sheet_id=sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail="시트를 찾을 수 없습니다.")

    if not sheet.upload_id:
        raise HTTPException(status_code=400, detail="시트에 업로드 ID가 없습니다.")

    result = data_service.extract_and_save_real_estate_from_data_record(
        db=db, sheet_id=sheet_id, upload_id=sheet.upload_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="부동산 수익분석 데이터를 찾을 수 없습니다.")
    return result

@router.post("/data-records/by-ids", response_model=List[DataRecordResponse])
async def get_records_by_ids(
    record_ids: List[int],
    db: Session = Depends(get_db)
):
    """레코드 ID 리스트로 레코드 조회"""
    records = data_service.get_records_by_ids(db=db, record_ids=record_ids)
    return records

