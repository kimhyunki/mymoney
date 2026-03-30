import re
from typing import Optional, Tuple
from datetime import datetime, date
from app.models import UploadHistory


def parse_date_range_from_filename(filename: str) -> Optional[Tuple[date, date]]:
    """
    파일명에서 날짜 범위를 추출합니다.
    형식: YYYY-MM-DD~YYYY-MM-DD (확장자 제외)
    예: 2024-08-13~2025-08-13.xlsx -> (2024-08-13, 2025-08-13)
    """
    base_name = filename.rsplit('.', 1)[0]
    pattern = r'(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})'
    match = re.search(pattern, base_name)
    if match:
        try:
            start_str, end_str = match.groups()
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            return start_date, end_date
        except ValueError:
            return None
    return None


def is_date_in_range(target_date: date, start_date: date, end_date: date) -> bool:
    """특정 날짜가 날짜 범위에 포함되는지 확인합니다."""
    return start_date <= target_date <= end_date


def is_upload_newer(new_upload: UploadHistory, old_upload: UploadHistory) -> bool:
    """
    두 업로드 중 new_upload가 더 최신인지 판단합니다.
    파일명의 날짜 범위를 우선 비교하고, 실패 시 업로드 시간을 비교합니다.
    """
    new_range = parse_date_range_from_filename(new_upload.filename)
    old_range = parse_date_range_from_filename(old_upload.filename)

    if new_range and old_range:
        if new_range[0] > old_range[0]:
            return True
        elif new_range[0] < old_range[0]:
            return False
        if new_range[1] > old_range[1]:
            return True
        elif new_range[1] < old_range[1]:
            return False

    return new_upload.uploaded_at > old_upload.uploaded_at
