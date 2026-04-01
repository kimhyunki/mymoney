"""Fix financial_goal planned_data with milestone-based payment schedule

Revision ID: 016_fix_financial_goal_payment_plan
Revises: 015_financial_goal_planned_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import json

revision: str = '016_fix_goal_payment_plan'
down_revision: Union[str, None] = '015_financial_goal_planned_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    planned_data = [
        # 계약시
        {"date": "계약시", "category": "계약금", "item": "분양 계약금",    "amount": -97810000,  "balance": None},
        {"date": "계약시", "category": "계약금", "item": "옵션 1 계약금",  "amount": -1313000,   "balance": None},
        {"date": "계약시", "category": "계약금", "item": "옵션 2 계약금",  "amount": -1200000,   "balance": None},
        {"date": "계약시", "category": "계약금", "item": "모은돈",          "amount": 100323000,  "balance": 0},
        # 중도금 1차
        {"date": "2025-05-15", "category": "중도금 1차", "item": "분양 중도금 1차", "amount": -97810000, "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "옵션 1 중도금",   "amount": -1313000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "옵션 2 중도금",   "amount": -1200000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "모은돈",           "amount": 83000000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "청약",             "amount": 19000000,  "balance": 1677000},
        # 중도금 2차
        {"date": "2025-11-14", "category": "중도금 2차", "item": "분양 중도금 2차", "amount": -97810000, "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "현기 퇴직금",     "amount": 53000000,  "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "유안타 국내주식", "amount": 23000000,  "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "모은돈",           "amount": 27000000,  "balance": 5190000},
        # 중도금 3차
        {"date": "2026-05-15", "category": "중도금 3차", "item": "분양 중도금 3차", "amount": -97810000, "balance": None},
        {"date": "2026-05-15", "category": "중도금 3차", "item": "요람 퇴직금",     "amount": 60000000,  "balance": None},
        {"date": "2026-05-15", "category": "중도금 3차", "item": "달러신투요람",     "amount": 3600000,   "balance": None},
        {"date": "2026-05-15", "category": "중도금 3차", "item": "원화 미래 요람",  "amount": 30900000,  "balance": -3310000},
        # 중도금 4차
        {"date": "2027-01-15", "category": "중도금 4차", "item": "분양 중도금 4차",  "amount": -97810000, "balance": None},
        {"date": "2027-01-15", "category": "중도금 4차", "item": "달러 (미래 공동)", "amount": 21000000,  "balance": None},
        {"date": "2027-01-15", "category": "중도금 4차", "item": "주식 (미래 공동)", "amount": 68460000,  "balance": None},
        {"date": "2027-01-15", "category": "중도금 4차", "item": "TIGER ETF",        "amount": 11000000,  "balance": 2650000},
        # 중도금 5차
        {"date": "2027-05-17", "category": "중도금 5차", "item": "분양 중도금 5차", "amount": -97810000, "balance": None},
        {"date": "2027-05-17", "category": "중도금 5차", "item": "대출",             "amount": 97810000,  "balance": 0},
        # 중도금 6차
        {"date": "2027-09-17", "category": "중도금 6차", "item": "분양 중도금 6차", "amount": -97810000, "balance": None},
        {"date": "2027-09-17", "category": "중도금 6차", "item": "대출",             "amount": 97810000,  "balance": 0},
        # 입주시 잔금
        {"date": "입주시", "category": "잔금", "item": "잔금",             "amount": -293430000, "balance": None},
        {"date": "입주시", "category": "잔금", "item": "취득세 (3%)",      "amount": -29343000,  "balance": None},
        {"date": "입주시", "category": "잔금", "item": "지방교육세 (0.3%)", "amount": -2934300,  "balance": None},
        {"date": "입주시", "category": "잔금", "item": "법무사비용",        "amount": -1135400,   "balance": None},
        {"date": "입주시", "category": "잔금", "item": "옵션 1",            "amount": -10504000,  "balance": None},
        {"date": "입주시", "category": "잔금", "item": "옵션 2",            "amount": -9730000,   "balance": None},
        {"date": "입주시", "category": "잔금", "item": "전세금",            "amount": 315000000,  "balance": -32076700},
    ]

    actual_data = [
        # 계약시 집행 완료
        {"date": "계약시", "category": "계약금", "item": "분양 계약금",    "amount": -97810000,  "balance": None},
        {"date": "계약시", "category": "계약금", "item": "옵션 1 계약금",  "amount": -1313000,   "balance": None},
        {"date": "계약시", "category": "계약금", "item": "옵션 2 계약금",  "amount": -1200000,   "balance": None},
        {"date": "계약시", "category": "계약금", "item": "모은돈",          "amount": 100323000,  "balance": 0},
        # 중도금 1차 집행 완료 (모은돈 실제 1,677,000 차감)
        {"date": "2025-05-15", "category": "중도금 1차", "item": "분양 중도금 1차", "amount": -97810000, "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "옵션 1 중도금",   "amount": -1313000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "옵션 2 중도금",   "amount": -1200000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "모은돈",           "amount": 81323000,  "balance": None},
        {"date": "2025-05-15", "category": "중도금 1차", "item": "청약",             "amount": 19000000,  "balance": 0},
        # 중도금 2차 집행 완료 (모은돈 실제 5,190,000 차감)
        {"date": "2025-11-14", "category": "중도금 2차", "item": "분양 중도금 2차", "amount": -97810000, "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "현기 퇴직금",     "amount": 53000000,  "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "유안타 국내주식", "amount": 23000000,  "balance": None},
        {"date": "2025-11-14", "category": "중도금 2차", "item": "모은돈",           "amount": 21810000,  "balance": 0},
    ]

    # planned_data 교체 (항상)
    conn.execute(
        sa.text("""
            UPDATE financial_goal
            SET planned_data = :planned_data, updated_at = NOW()
            WHERE goal_name LIKE '평촌 자이 퍼스티니%'
        """),
        {"planned_data": json.dumps(planned_data, ensure_ascii=False)},
    )

    # actual_data 삽입 (없을 때만)
    conn.execute(
        sa.text("""
            UPDATE financial_goal
            SET actual_data = :actual_data, updated_at = NOW()
            WHERE goal_name LIKE '평촌 자이 퍼스티니%'
              AND (actual_data IS NULL OR actual_data::text = 'null'
                   OR jsonb_array_length(actual_data::jsonb) = 0)
        """),
        {"actual_data": json.dumps(actual_data, ensure_ascii=False)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE financial_goal
        SET actual_data = NULL, updated_at = NOW()
        WHERE goal_name LIKE '평촌 자이 퍼스티니%'
    """))
    # planned_data는 이전 migration으로 복원 불필요 (기존 값 유지)
