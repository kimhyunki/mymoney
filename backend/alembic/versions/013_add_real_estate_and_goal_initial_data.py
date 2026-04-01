"""Add real estate analysis and financial goal initial data from 26_가계부_재무재표.xlsx

Revision ID: 013_real_estate_goal_data
Revises: 012_monthly_summary_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import json

revision: str = '013_real_estate_goal_data'
down_revision: Union[str, None] = '012_monthly_summary_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 부동산 수익분석 ────────────────────────────────────────────
    re_count = conn.execute(sa.text("SELECT COUNT(*) FROM real_estate_analysis")).scalar()
    if not re_count:
        analysis_data = {
            "asset_ratio": 0.1583,
            "ltv": 0.2042,
            "dsr_ratio": 0.5635,
            "leverage_effect": "대출이 없을 때보다 자산 증식 속도가 31% 더 빠름",
            "verdict": {
                "leverage": "가속 중",
                "ltv_safety": "매우 안전",
                "roe_profit": "초과 수익",
                "real_gain": "이득",
            },
        }
        conn.execute(
            sa.text("""
                INSERT INTO real_estate_analysis
                    (property_name, total_acquisition_cost, self_capital, loan_capital,
                     current_market_value, unrealized_gain, roe, leverage_multiple,
                     acceleration_factor, analysis_data)
                VALUES
                    (:property_name, :total_acquisition_cost, :self_capital, :loan_capital,
                     :current_market_value, :unrealized_gain, :roe, :leverage_multiple,
                     :acceleration_factor, :analysis_data)
            """),
            {
                "property_name": "평촌 자이 퍼스티니",
                "total_acquisition_cost": 1036000000,
                "self_capital": 791000000,
                "loan_capital": 245000000,
                "current_market_value": 1200000000,
                "unrealized_gain": 164000000,
                "roe": 0.2073,
                "leverage_multiple": 1.3097,
                "acceleration_factor": 0.3097,
                "analysis_data": json.dumps(analysis_data, ensure_ascii=False),
            }
        )

    # ── 분양금 계획 ────────────────────────────────────────────────
    goal_count = conn.execute(sa.text("SELECT COUNT(*) FROM financial_goal")).scalar()
    if not goal_count:
        conn.execute(
            sa.text("""
                INSERT INTO financial_goal
                    (goal_name, target_amount, start_date, end_date, interest_rate,
                     total_weeks, elapsed_weeks, remaining_weeks, progress_rate, weekly_allocation)
                VALUES
                    (:goal_name, :target_amount, :start_date, :end_date, :interest_rate,
                     :total_weeks, :elapsed_weeks, :remaining_weeks, :progress_rate, :weekly_allocation)
            """),
            {
                "goal_name": "평촌 자이 퍼스티니 분양금",
                "target_amount": 240523700,
                "start_date": "2025-10-01",
                "end_date": "2027-12-31",
                "interest_rate": 0.05,
                "total_weeks": 117,
                "elapsed_weeks": 25,
                "remaining_weeks": 92,
                "progress_rate": 0.2137,
                "weekly_allocation": 1943277,
            }
        )


def downgrade() -> None:
    pass
