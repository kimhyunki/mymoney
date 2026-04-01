"""Update financial goal planned_data with 117-week payment schedule

Revision ID: 015_financial_goal_planned_data
Revises: 014_monthly_summary_2025_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import json
from datetime import date, timedelta

revision: str = '015_financial_goal_planned_data'
down_revision: Union[str, None] = '014_monthly_summary_2025_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _generate_planned_data() -> list:
    """평촌 자이 퍼스티니 분양금 주간 납부 계획 자동 생성"""
    start = date(2025, 10, 1)
    target = 240_523_700
    weekly = 1_943_277
    total_weeks = 117

    entries = []
    balance = target
    for i in range(total_weeks):
        d = start + timedelta(weeks=i)
        payment = weekly if i < total_weeks - 1 else max(balance, 0)
        balance -= weekly
        entries.append({
            "date": d.isoformat(),
            "category": "분양금",
            "item": f"{i + 1}회차",
            "amount": payment,
            "balance": max(balance, 0),
        })
    return entries


def upgrade() -> None:
    conn = op.get_bind()

    planned_data = _generate_planned_data()

    conn.execute(
        sa.text("""
            UPDATE financial_goal
            SET planned_data = :planned_data
            WHERE goal_name = '평촌 자이 퍼스티니 분양금'
              AND (planned_data IS NULL OR planned_data::text = 'null')
        """),
        {"planned_data": json.dumps(planned_data, ensure_ascii=False)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE financial_goal SET planned_data = NULL WHERE goal_name = '평촌 자이 퍼스티니 분양금'")
    )
