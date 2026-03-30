from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.upload_service import process_upload
from app.schemas.schemas import UploadResponse
import os
import logging
from datetime import datetime

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """엑셀 파일을 업로드하고 파싱하여 데이터베이스에 저장합니다."""
    start_time = datetime.now()
    logger.info(f"=== 파일 업로드 요청 시작 ===")
    logger.info(f"파일명: {file.filename}, Content-Type: {file.content_type}")

    # 파일명 검증 (None 체크 + Path Traversal 방어)
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")
    safe_filename = os.path.basename(file.filename)
    if not safe_filename:
        raise HTTPException(status_code=400, detail="유효하지 않은 파일명입니다.")

    # 파일 확장자 검증
    if not (safe_filename.endswith('.xlsx') or safe_filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="지원하는 파일 형식은 .xlsx 또는 .xls입니다.")

    try:
        file_content = await file.read()
        file_size = len(file_content)
        logger.info(f"파일 크기: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")

        # 파일 크기 검증 (50MB 상한)
        if file_size > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일 크기가 너무 큽니다. 최대 {MAX_UPLOAD_SIZE // (1024 * 1024)}MB까지 업로드 가능합니다."
            )

        parse_start = datetime.now()
        upload, parsed_data = process_upload(db, file_content, safe_filename)
        duration = (datetime.now() - parse_start).total_seconds()

        total_records = sum(s["row_count"] for s in parsed_data["sheets"])
        logger.info(
            f"=== 업로드 완료 (총 {(datetime.now() - start_time).total_seconds():.2f}초, "
            f"레코드 {total_records:,}건, ID: {upload.id}) ==="
        )

        return UploadResponse(
            upload_id=upload.id,
            filename=upload.filename,
            sheet_count=upload.sheet_count,
            message="파일이 성공적으로 업로드되었습니다."
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"값 오류: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"파일 처리 오류: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류가 발생했습니다: {e}")
