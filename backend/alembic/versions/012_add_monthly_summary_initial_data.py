"""Add monthly summary initial data from 26_가계부_재무재표.xlsx 총 결산 sheet

Revision ID: 012_monthly_summary_data
Revises: 011_fixed_expenses_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '012_monthly_summary_data'
down_revision: Union[str, None] = '011_fixed_expenses_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 2026년 총 결산 데이터 (data_only로 읽은 값)
# (year, month, income, expense, net_income, cumulative_net_income)
INITIAL_DATA = [
    (2026, 1, 10368100, 3476702, 6891398, 6891398),
    (2026, 2, 9668527,  3357958, 6310569, 13201967),
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
    pass
