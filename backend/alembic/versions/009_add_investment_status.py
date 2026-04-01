"""Add investment_status table with initial data from 뱅샐현황 Excel

Revision ID: 009_add_investment_status
Revises: 008_remove_excel_dependencies
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision: str = '009_add_investment_status'
down_revision: Union[str, None] = '008_remove_excel_dependencies'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 2025-03-03~2026-03-03 뱅샐현황 엑셀 5.투자현황 섹션 데이터
INITIAL_DATA = [
    ('주식', '미래에셋증권', '애플',                     21326303,   29886811.2312,  40.1406),
    ('주식', '미래에셋증권', '마이크로소프트',            8827340,    13440417.2295,  52.2590),
    ('주식', '미래에셋증권', '페이팔 홀딩스',             65388412,   11574404.9577, -82.2990),
    ('주식', '미래에셋증권', 'TIGER 미국S&P500(H)',        12809747,   13686290.0000,   6.8428),
    ('주식', '미래에셋증권', 'SCHWAB US DIVIDEND EQUITY',  7001072,    8221679.4528,   17.4346),
    ('주식', '미래에셋증권', '리얼티 인컴',               5211009,    6240685.4244,   19.7596),
    ('주식', '미래에셋증권', '테슬라',                    12754265,   14192637.2064,  11.2776),
    ('주식', '미래에셋증권', '엔비디아',                  1637998,    2675576.5040,   63.3443),
    ('주식', '미래에셋증권', 'TIGER 미국S&P500',           1789664,    2107150.0000,   17.7400),
    ('주식', '미래에셋증권', 'KODEX 미국S&P500필수소비재', 1197029,    1375115.0000,   14.8773),
    ('주식', '유안타증권',   '서희건설',                  603734,     457686.0000,   -24.1908),
    ('주식', '토스증권',     '애플',                     937,        1696.9499,      81.1046),
    ('주식', '미래에셋증권', '알파벳 C',                  448006,     449194.2228,     0.2652),
    ('주식', '카카오페이 증권', '코카콜라',               32099,      36462.5009,     13.5939),
    ('주식', '카카오페이 증권', '엔비디아',               750,        802.6730,        7.0231),
]


def upgrade() -> None:
    # create_all이 먼저 실행된 경우를 대비해 IF NOT EXISTS로 처리
    op.execute("""
        CREATE TABLE IF NOT EXISTS investment_status (
            id SERIAL NOT NULL,
            investment_type VARCHAR,
            company VARCHAR,
            product_name VARCHAR NOT NULL,
            principal NUMERIC(15, 2),
            current_value NUMERIC(15, 4),
            return_rate NUMERIC(10, 4),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_investment_status_id ON investment_status (id)"
    )

    # 데이터가 없을 때만 초기 데이터 삽입
    op.bulk_insert(
        sa.table(
            'investment_status',
            sa.column('investment_type', sa.String),
            sa.column('company', sa.String),
            sa.column('product_name', sa.String),
            sa.column('principal', sa.Numeric),
            sa.column('current_value', sa.Numeric),
            sa.column('return_rate', sa.Numeric),
        ),
        [
            {
                'investment_type': row[0],
                'company': row[1],
                'product_name': row[2],
                'principal': row[3],
                'current_value': row[4],
                'return_rate': row[5],
            }
            for row in INITIAL_DATA
        ],
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_investment_status_id")
    op.execute("DROP TABLE IF EXISTS investment_status")
