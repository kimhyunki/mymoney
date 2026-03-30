"""
date_utils.py 순수 함수 단위 테스트
"""
from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app.services.utils.date_utils import (
    is_date_in_range,
    is_upload_newer,
    parse_date_range_from_filename,
)


# ────────────────────────────────────────────
# parse_date_range_from_filename
# ────────────────────────────────────────────

class TestParseDateRangeFromFilename:
    def test_valid_filename(self):
        result = parse_date_range_from_filename("2024-08-13~2025-08-13.xlsx")
        assert result == (date(2024, 8, 13), date(2025, 8, 13))

    def test_valid_filename_without_extension(self):
        result = parse_date_range_from_filename("2023-01-01~2023-12-31")
        assert result == (date(2023, 1, 1), date(2023, 12, 31))

    def test_no_date_in_filename(self):
        result = parse_date_range_from_filename("report.xlsx")
        assert result is None

    def test_invalid_date_format(self):
        result = parse_date_range_from_filename("20240813~20250813.xlsx")
        assert result is None

    def test_filename_with_prefix(self):
        result = parse_date_range_from_filename("가계부_2024-01-01~2024-12-31.xlsx")
        assert result == (date(2024, 1, 1), date(2024, 12, 31))


# ────────────────────────────────────────────
# is_date_in_range
# ────────────────────────────────────────────

class TestIsDateInRange:
    def test_date_within_range(self):
        assert is_date_in_range(date(2024, 6, 15), date(2024, 1, 1), date(2024, 12, 31))

    def test_date_on_start(self):
        assert is_date_in_range(date(2024, 1, 1), date(2024, 1, 1), date(2024, 12, 31))

    def test_date_on_end(self):
        assert is_date_in_range(date(2024, 12, 31), date(2024, 1, 1), date(2024, 12, 31))

    def test_date_before_range(self):
        assert not is_date_in_range(date(2023, 12, 31), date(2024, 1, 1), date(2024, 12, 31))

    def test_date_after_range(self):
        assert not is_date_in_range(date(2025, 1, 1), date(2024, 1, 1), date(2024, 12, 31))


# ────────────────────────────────────────────
# is_upload_newer
# ────────────────────────────────────────────

def _make_upload(filename: str, uploaded_at: datetime):
    upload = MagicMock()
    upload.filename = filename
    upload.uploaded_at = uploaded_at
    return upload


class TestIsUploadNewer:
    def test_newer_by_filename_start_date(self):
        newer = _make_upload("2025-01-01~2025-12-31.xlsx", datetime(2025, 1, 1))
        older = _make_upload("2024-01-01~2024-12-31.xlsx", datetime(2025, 1, 1))
        assert is_upload_newer(newer, older)
        assert not is_upload_newer(older, newer)

    def test_newer_by_filename_end_date_same_start(self):
        newer = _make_upload("2024-01-01~2025-06-30.xlsx", datetime(2025, 1, 1))
        older = _make_upload("2024-01-01~2024-12-31.xlsx", datetime(2025, 1, 1))
        assert is_upload_newer(newer, older)

    def test_newer_by_uploaded_at_when_no_date_in_filename(self):
        newer = _make_upload("report.xlsx", datetime(2025, 6, 1))
        older = _make_upload("report.xlsx", datetime(2025, 1, 1))
        assert is_upload_newer(newer, older)
        assert not is_upload_newer(older, newer)

    def test_same_filename_date_falls_back_to_uploaded_at(self):
        newer = _make_upload("2024-01-01~2024-12-31.xlsx", datetime(2025, 3, 1))
        older = _make_upload("2024-01-01~2024-12-31.xlsx", datetime(2025, 1, 1))
        assert is_upload_newer(newer, older)
