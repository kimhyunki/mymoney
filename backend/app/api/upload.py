from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import excel_parser, data_service
from app.schemas.schemas import UploadResponse
import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    엑셀 파일을 업로드하고 파싱하여 데이터베이스에 저장합니다.
    """
    start_time = datetime.now()
    logger.info(f"=== 파일 업로드 요청 시작 ===")
    logger.info(f"파일명: {file.filename}")
    logger.info(f"Content-Type: {file.content_type}")
    
    # 파일 확장자 검증
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        logger.warning(f"지원하지 않는 파일 형식: {file.filename}")
        raise HTTPException(status_code=400, detail="지원하는 파일 형식은 .xlsx 또는 .xls입니다.")
    
    try:
        # 파일 내용 읽기
        logger.info(f"파일 내용 읽기 시작...")
        file_content = await file.read()
        file_size = len(file_content)
        logger.info(f"파일 크기: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
        
        # 엑셀 파일 파싱
        logger.info(f"엑셀 파일 파싱 시작...")
        parse_start = datetime.now()
        parsed_data = excel_parser.parse_excel_file(file_content, file.filename)
        parse_duration = (datetime.now() - parse_start).total_seconds()
        logger.info(f"파싱 완료 (소요 시간: {parse_duration:.2f}초)")
        
        if not parsed_data["sheets"]:
            logger.warning(f"파일에 데이터가 없습니다: {file.filename}")
            raise HTTPException(status_code=400, detail="파일에 데이터가 없습니다.")
        
        logger.info(f"파싱된 시트 수: {parsed_data['sheet_count']}")
        for idx, sheet_info in enumerate(parsed_data["sheets"], 1):
            logger.info(
                f"  시트 {idx}: '{sheet_info['name']}' - "
                f"행: {sheet_info['row_count']}, 열: {sheet_info['column_count']}"
            )
        
        # 업로드 이력 생성
        logger.info(f"데이터베이스에 업로드 이력 저장 중...")
        upload = data_service.create_upload_history(
            db=db,
            filename=file.filename,
            sheet_count=parsed_data["sheet_count"]
        )
        logger.info(f"업로드 이력 생성 완료 (ID: {upload.id})")
        
        # 각 시트 데이터 저장
        total_records = 0
        for sheet_info in parsed_data["sheets"]:
            logger.info(f"시트 '{sheet_info['name']}' 데이터 저장 중...")
            sheet_start = datetime.now()
            
            sheet = data_service.create_sheet_data(
                db=db,
                upload_id=upload.id,
                sheet_name=sheet_info["name"],
                row_count=sheet_info["row_count"],
                column_count=sheet_info["column_count"]
            )
            logger.info(f"  시트 메타데이터 저장 완료 (시트 ID: {sheet.id})")
            
            # 데이터 레코드 저장
            logger.info(f"  데이터 레코드 저장 중... (행 수: {sheet_info['row_count']})")
            records = data_service.create_data_records(
                db=db,
                sheet_id=sheet.id,
                data=sheet_info["data"]
            )
            record_count = len(records)
            total_records += record_count
            sheet_duration = (datetime.now() - sheet_start).total_seconds()
            logger.info(
                f"  시트 '{sheet_info['name']}' 저장 완료 - "
                f"레코드 수: {record_count:,}, 소요 시간: {sheet_duration:.2f}초"
            )
        
        total_duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"=== 파일 업로드 완료 ===")
        logger.info(
            f"총 소요 시간: {total_duration:.2f}초, "
            f"총 레코드 수: {total_records:,}, "
            f"업로드 ID: {upload.id}"
        )
        
        return UploadResponse(
            upload_id=upload.id,
            filename=upload.filename,
            sheet_count=upload.sheet_count,
            message="파일이 성공적으로 업로드되었습니다."
        )
    
    except HTTPException:
        # HTTPException은 그대로 재발생 (이미 로깅됨)
        raise
    except ValueError as e:
        logger.error(f"값 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(
            f"파일 처리 중 예상치 못한 오류 발생: {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류가 발생했습니다: {str(e)}")

