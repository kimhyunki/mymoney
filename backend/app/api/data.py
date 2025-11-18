from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services import data_service
from app.schemas.schemas import (
    UploadHistoryResponse,
    SheetDataResponse,
    DataRecordResponse,
    SheetWithDataResponse
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

