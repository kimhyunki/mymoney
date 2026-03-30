"""
cash_flow_service.py 헬퍼 함수 단위 테스트
"""
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.services.cash_flow_service import (
    _extract_row_data,
    _find_column_headers,
    _find_section_header,
    _merge_monthly_data,
    _to_float,
    _to_str,
)


# ────────────────────────────────────────────
# _to_str
# ────────────────────────────────────────────

class TestToStr:
    def test_string_value(self):
        assert _to_str("  수입  ") == "수입"

    def test_int_value(self):
        assert _to_str(42) == "42"

    def test_float_value(self):
        assert _to_str(3.14) == "3.14"

    def test_none_value(self):
        assert _to_str(None) == ""

    def test_empty_string(self):
        assert _to_str("") == ""


# ────────────────────────────────────────────
# _to_float
# ────────────────────────────────────────────

class TestToFloat:
    def test_int(self):
        assert _to_float(100) == 100.0

    def test_float(self):
        assert _to_float(3.14) == 3.14

    def test_string_number(self):
        assert _to_float("1234") == 1234.0

    def test_string_with_comma(self):
        assert _to_float("1,234,567") == 1234567.0

    def test_negative(self):
        assert _to_float("-500") == -500.0

    def test_invalid_string(self):
        assert _to_float("abc") is None

    def test_none(self):
        assert _to_float(None) is None

    def test_empty_string(self):
        assert _to_float("") is None


# ────────────────────────────────────────────
# _find_section_header
# ────────────────────────────────────────────

def _make_record(row_index: int, col1: str):
    record = MagicMock()
    record.row_index = row_index
    record.data = {"1": col1}
    return record


class TestFindSectionHeader:
    def test_finds_header(self):
        records = [
            _make_record(1, "고객정보"),
            _make_record(5, "2.현금흐름현황"),
            _make_record(6, "항목"),
        ]
        assert _find_section_header(records) == 5

    def test_finds_partial_match(self):
        records = [_make_record(3, "현금흐름 분석")]
        assert _find_section_header(records) == 3

    def test_returns_none_when_not_found(self):
        records = [_make_record(1, "고객정보"), _make_record(2, "자산현황")]
        assert _find_section_header(records) is None


# ────────────────────────────────────────────
# _find_column_headers
# ────────────────────────────────────────────

class TestFindColumnHeaders:
    def test_finds_headers_after_section_start(self):
        records = [
            _make_record(5, "2.현금흐름현황"),
            # 항목 헤더 행
            MagicMock(
                row_index=6,
                data={
                    "1": "항목",
                    "2": "총계",
                    "3": "월평균",
                    "4": "2024-01",
                    "5": "2024-02",
                    "6": "",
                },
            ),
        ]
        header_idx, monthly = _find_column_headers(records, section_start=5)
        assert header_idx == 6
        assert "4" in monthly
        assert monthly["4"] == "2024-01"
        assert "6" not in monthly  # 빈 값 제외

    def test_ignores_rows_before_section_start(self):
        records = [
            MagicMock(row_index=3, data={"1": "항목"}),
            _make_record(5, "현금흐름현황"),
        ]
        header_idx, monthly = _find_column_headers(records, section_start=5)
        assert header_idx is None

    def test_returns_none_when_not_found(self):
        records = [_make_record(6, "급여"), _make_record(7, "지출")]
        header_idx, monthly = _find_column_headers(records, section_start=5)
        assert header_idx is None
        assert monthly == {}


# ────────────────────────────────────────────
# _extract_row_data
# ────────────────────────────────────────────

class TestExtractRowData:
    def test_income_row(self):
        data = {
            "1": "급여",
            "2": "36000000",
            "3": "3000000",
            "4": "3000000",
        }
        monthly_headers = {"4": "2024-01"}
        result = _extract_row_data(data, monthly_headers)
        assert result is not None
        item_name, total, avg, monthly, item_type = result
        assert item_name == "급여"
        assert total == 36000000.0
        assert item_type == "수입"
        assert monthly == {"2024-01": 3000000.0}

    def test_expense_row(self):
        data = {"1": "식비", "2": "1200000", "3": "100000"}
        result = _extract_row_data(data, {})
        assert result is not None
        assert result[4] == "지출"

    def test_excluded_keyword(self):
        data = {"1": "항목", "2": ""}
        assert _extract_row_data(data, {}) is None

    def test_excludes_total_in_name(self):
        data = {"1": "월수입 총계", "2": "5000000"}
        assert _extract_row_data(data, {}) is None

    def test_asset_keyword_excluded(self):
        data = {"1": "주식 자산", "2": "10000000"}
        assert _extract_row_data(data, {}) is None

    def test_numeric_only_item_name_excluded(self):
        data = {"1": "1234", "2": ""}
        assert _extract_row_data(data, {}) is None

    def test_section_number_prefix_excluded(self):
        data = {"1": "2.현금흐름현황", "2": ""}
        assert _extract_row_data(data, {}) is None


# ────────────────────────────────────────────
# _merge_monthly_data
# ────────────────────────────────────────────

def _make_upload_hist(filename: str, uploaded_at: datetime):
    u = MagicMock()
    u.filename = filename
    u.uploaded_at = uploaded_at
    return u


class TestMergeMonthlyData:
    def test_new_month_added(self):
        current = _make_upload_hist("2025-01-01~2025-12-31.xlsx", datetime(2025, 2, 1))
        existing = _make_upload_hist("2024-01-01~2024-12-31.xlsx", datetime(2025, 1, 1))
        merged = _merge_monthly_data(
            {"2024-01": 100.0},
            {"2025-01": 200.0},
            current,
            existing,
        )
        assert merged["2024-01"] == 100.0
        assert merged["2025-01"] == 200.0

    def test_existing_data_preserved_when_not_in_current_range(self):
        # current upload covers 2025; existing data for 2024 should stay
        current = _make_upload_hist("2025-01-01~2025-12-31.xlsx", datetime(2025, 2, 1))
        existing = _make_upload_hist("2024-01-01~2024-12-31.xlsx", datetime(2025, 1, 1))
        merged = _merge_monthly_data(
            {"2024-06": 500.0},
            {"2024-06": 999.0},   # current tries to overwrite 2024-06
            current,
            existing,
        )
        # 2024-06 is in existing range, not in current range → keep existing value
        assert merged["2024-06"] == 500.0

    def test_none_existing_treated_as_empty(self):
        current = _make_upload_hist("report.xlsx", datetime(2025, 2, 1))
        existing = _make_upload_hist("report.xlsx", datetime(2025, 1, 1))
        merged = _merge_monthly_data(None, {"2025-01": 300.0}, current, existing)
        assert merged["2025-01"] == 300.0
