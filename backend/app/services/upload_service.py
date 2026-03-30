from sqlalchemy.orm import Session
from app.models import UploadHistory
from app.services import excel_parser
from app.services import crud


def process_upload(db: Session, file_content: bytes, filename: str) -> UploadHistory:
    """
    Excel 파일 내용을 파싱하여 DB에 저장하고 UploadHistory를 반환합니다.

    Args:
        db: 데이터베이스 세션
        file_content: 파일 바이너리 내용
        filename: 안전하게 검증된 파일명

    Returns:
        생성된 UploadHistory 객체
    """
    parsed_data = excel_parser.parse_excel_file(file_content, filename)

    if not parsed_data["sheets"]:
        raise ValueError("파일에 데이터가 없습니다.")

    upload = crud.create_upload_history(db, filename, parsed_data["sheet_count"])

    for sheet_info in parsed_data["sheets"]:
        sheet = crud.create_sheet_data(
            db,
            upload_id=upload.id,
            sheet_name=sheet_info["name"],
            row_count=sheet_info["row_count"],
            column_count=sheet_info["column_count"],
        )
        crud.create_data_records(db, sheet.id, sheet_info["data"])

    return upload, parsed_data
