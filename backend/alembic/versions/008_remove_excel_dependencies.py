"""Remove excel upload dependencies

Revision ID: 008_remove_excel_dependencies
Revises: 007_add_real_estate_analysis
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '008_remove_excel_dependencies'
down_revision: Union[str, None] = '007_add_real_estate_analysis'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_col_if_exists(table: str, col: str) -> None:
    op.execute(
        f"ALTER TABLE {table} DROP COLUMN IF EXISTS {col}"
    )


def upgrade() -> None:
    # ── 인덱스 제거 (컬럼 삭제 전) ────────────────────────────
    op.execute("DROP INDEX IF EXISTS idx_customer_name_upload")
    op.execute("DROP INDEX IF EXISTS idx_cashflow_item_upload")
    op.execute("DROP INDEX IF EXISTS idx_fixed_exp_item_upload")
    op.execute("DROP INDEX IF EXISTS idx_monthly_summary_year_month_upload")

    # ── customer ──────────────────────────────────────────────
    _drop_col_if_exists('customer', 'upload_id')
    _drop_col_if_exists('customer', 'data_record_id')

    # ── cash_flow ─────────────────────────────────────────────
    _drop_col_if_exists('cash_flow', 'sheet_id')
    _drop_col_if_exists('cash_flow', 'upload_id')
    _drop_col_if_exists('cash_flow', 'data_record_id')

    # ── fixed_expense ─────────────────────────────────────────
    _drop_col_if_exists('fixed_expense', 'sheet_id')
    _drop_col_if_exists('fixed_expense', 'upload_id')
    _drop_col_if_exists('fixed_expense', 'data_record_id')

    # ── monthly_summary ───────────────────────────────────────
    _drop_col_if_exists('monthly_summary', 'sheet_id')
    _drop_col_if_exists('monthly_summary', 'upload_id')
    _drop_col_if_exists('monthly_summary', 'data_record_id')

    # ── financial_goal ────────────────────────────────────────
    _drop_col_if_exists('financial_goal', 'sheet_id')
    _drop_col_if_exists('financial_goal', 'upload_id')

    # ── real_estate_analysis ──────────────────────────────────
    _drop_col_if_exists('real_estate_analysis', 'sheet_id')
    _drop_col_if_exists('real_estate_analysis', 'upload_id')
    _drop_col_if_exists('real_estate_analysis', 'data_record_id')

    # ── 구 테이블 삭제 (CASCADE로 남은 외래 키 처리) ─────────────
    op.execute("DROP TABLE IF EXISTS data_record CASCADE")
    op.execute("DROP TABLE IF EXISTS sheet_data CASCADE")
    op.execute("DROP TABLE IF EXISTS upload_history CASCADE")

    # ── 새 인덱스 ─────────────────────────────────────────────
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_monthly_summary_year_month "
        "ON monthly_summary (year, month)"
    )


def downgrade() -> None:
    pass
