from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import excel_parser, data_service
from app.schemas.schemas import UploadResponse
import io

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    엑셀 파일을 업로드하고 파싱하여 데이터베이스에 저장합니다.
    """
    # 파일 확장자 검증
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="지원하는 파일 형식은 .xlsx 또는 .xls입니다.")
    
    try:
        # 파일 내용 읽기
        file_content = await file.read()
        
        # 엑셀 파일 파싱
        parsed_data = excel_parser.parse_excel_file(file_content, file.filename)
        
        if not parsed_data["sheets"]:
            raise HTTPException(status_code=400, detail="파일에 데이터가 없습니다.")
        
        # 업로드 이력 생성
        upload = data_service.create_upload_history(
            db=db,
            filename=file.filename,
            sheet_count=parsed_data["sheet_count"]
        )
        
        # 각 시트 데이터 저장
        for sheet_info in parsed_data["sheets"]:
            sheet = data_service.create_sheet_data(
                db=db,
                upload_id=upload.id,
                sheet_name=sheet_info["name"],
                row_count=sheet_info["row_count"],
                column_count=sheet_info["column_count"]
            )
            
            # 데이터 레코드 저장
            data_service.create_data_records(
                db=db,
                sheet_id=sheet.id,
                data=sheet_info["data"]
            )
        
        return UploadResponse(
            upload_id=upload.id,
            filename=upload.filename,
            sheet_count=upload.sheet_count,
            message="파일이 성공적으로 업로드되었습니다."
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류가 발생했습니다: {str(e)}")

