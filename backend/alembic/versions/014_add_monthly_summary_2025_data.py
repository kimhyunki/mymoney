"""Add monthly summary data for 2025-03 to 2025-12 from 뱅샐현황 sheet

Revision ID: 014_monthly_summary_2025_data
Revises: 013_real_estate_goal_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '014_monthly_summary_2025_data'
down_revision: Union[str, None] = '013_real_estate_goal_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 출처: 2025-03-03~2026-03-03.xlsx 뱅샐현황 시트 현금흐름현황 섹션 (행 18, 35, 36)
# (year, month, income, expense, net_income, cumulative_net_income)
# cumulative_net_income: 2025년 YTD 누적 (3월부터 시작)
INITIAL_DATA = [
    (2025, 3,  5343606, 3464202, 1879404,  1879404),
    (2025, 4,  5344122, 2471250, 2872872,  4752276),
    (2025, 5,  5443878, 2929813, 2514065,  7266341),
    (2025, 6,  5349427, 3267064, 2082363,  9348704),
    (2025, 7,  5537818, 3931625, 1606193, 10954897),
    (2025, 8,  6376464, 3530662, 2845802, 13800699),
    (2025, 9,  5340598, 3056380, 2284218, 16084917),
    (2025, 10, 5339737, 3451654, 1888083, 17973000),
    (2025, 11, 5652739, 2719072, 2933667, 20906667),
    (2025, 12, 5336743, 3612263, 1724480, 22631147),
]


def upgrade() -> None:
    conn = op.get_bind()
    for year, month, income, expense, net_income, cumulative in INITIAL_DATA:
        exists = conn.execute(
            sa.text("SELECT COUNT(*) FROM monthly_summary WHERE year=:y AND month=:m"),
            {"y": year, "m": month}
        ).scalar()
        if exists:
            continue
        conn.execute(
            sa.text("""
                INSERT INTO monthly_summary (year, month, income, expense, net_income, cumulative_net_income)
                VALUES (:year, :month, :income, :expense, :net_income, :cumulative)
            """),
            {
                "year": year, "month": month,
                "income": income, "expense": expense,
                "net_income": net_income, "cumulative": cumulative,
            }
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM monthly_summary WHERE year = 2025 AND month BETWEEN 3 AND 12")
    )
