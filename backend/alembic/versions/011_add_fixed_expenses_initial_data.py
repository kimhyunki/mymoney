"""Add fixed expenses initial data from 26_가계부_재무재표.xlsx 고정비 (26) sheet

Revision ID: 011_fixed_expenses_data
Revises: 010_add_ledger_transaction
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import json

revision: str = '011_fixed_expenses_data'
down_revision: Union[str, None] = '010_add_ledger_transaction'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (account_number, bank_name, account_holder, transfer_name, category, item_name, 01~12)
INITIAL_DATA = [
    ('528420827040',   '미래에셋', '김현기', '현기 저축', '저축(연금)',        '현기 연금',              200000, 200000, 200000, None, None, None, None, None, None, None, None, None),
    ('3333013251119',  '카카오',   '김현기', '현기 용돈', '용돈',              '현기 교통비',            50000,  50000,  50000,  None, None, None, None, None, None, None, None, None),
    ('3333013251119',  '카카오',   '김현기', '현기 용돈', '용돈',              '현기 용돈',              30000,  30000,  30000,  None, None, None, None, None, None, None, None, None),
    ('79790193566',    '카카오',   '안광준', '현기 용돈', '용돈',              '현기 용돈',              30000,  30000,  30000,  None, None, None, None, None, None, None, None, None),
    ('1002554581178',  '우리',     '김현기', '현기 보험', '보험(삼성)',         '현기보험',               12629,  12629,  12629,  None, None, None, None, None, None, None, None, None),
    ('1002554581178',  '우리',     '김현기', '현기 보험', '보험(삼성)',         '현기보험',               66429,  66429,  66429,  None, None, None, None, None, None, None, None, None),
    ('1002554581178',  '우리',     '김현기', '현기 보험', '보험(현대해상)',      '현대해상',               20050,  20050,  20050,  None, None, None, None, None, None, None, None, None),
    ('6911218805',     '신한금융', '김은유', '은유 저축', '저축',              '은유 저축',              150000, 150000, 150000, None, None, None, None, None, None, None, None, None),
    ('1002635002702',  '우리',     '김현기', '은유 교육', '교욱비(태권도)',      '은유 태권도',            170000, 170000, 170000, None, None, None, None, None, None, None, None, None),
    ('1002635002702',  '우리',     '김현기', '은유 교육', '교육비(눈높이)',      '은유 눈높이',            131000, 131000, 131000, None, None, None, None, None, None, None, None, None),
    ('110289741334',   '신한은행', '고영심', '은유 교육', '교육비(미술)',        '은유 미술',              80000,  80000,  80000,  None, None, None, None, None, None, None, None, None),
    ('1002635002702',  '우리',     '김현기', '은유 교육', '교육비(피아노)',      '은유 피아노',            140000, 140000, 140000, None, None, None, None, None, None, None, None, None),
    ('3333015953072',  '카카오',   '이요람', '요람 용돈', '용돈',              '요람용돈',               300000, 300000, 300000, None, None, None, None, None, None, None, None, None),
    ('3333015953072',  '카카오',   '이요람', '요람 용돈', '통신비',            '요람통신비',             50000,  50000,  50000,  None, None, None, None, None, None, None, None, None),
    ('3333015953072',  '카카오',   '이요람', '요람 용돈', '통신비',            '요람교통비',             30000,  30000,  30000,  None, None, None, None, None, None, None, None, None),
    ('110456767870',   '신한',     '이요람', '요람 보험', '보험(삼성)',         '요람 삼성보험(건강생활)',   41700,  41700,  41700,  None, None, None, None, None, None, None, None, None),
    ('110456767870',   '신한',     '이요람', '요람 보험', '보험(삼성)',         '요람 삼성보험(어린이보험)', 47259,  47259,  47259,  None, None, None, None, None, None, None, None, None),
    ('110456767870',   '신한',     '이요람', '요람 보험', '보험(삼성)',         '요람 삼성보험(유니버셜CI)', 73540,  73540,  73540,  None, None, None, None, None, None, None, None, None),
    ('110456767870',   '신한',     '이요람', '요람 보험', '보함(AIA)',          '요람 실비(AIA)',          22480,  22480,  22480,  None, None, None, None, None, None, None, None, None),
    ('110456767870',   '신한',     '이요람', '요람 보험', '보험(DB)',           '요람 실비(DB)',           41970,  41970,  41970,  None, None, None, None, None, None, None, None, None),
    ('3333110437506',  '카카오',   '김현기', '생활비',   '생활비',             '한달 생활비',            1000000,1000000,1000000,None, None, None, None, None, None, None, None, None),
    ('79795312108',    '카카오',   '김기성', '본가',     '경조사',             '현기 경조사',            50000,  50000,  50000,  None, None, None, None, None, None, None, None, None),
    ('1002635002702',  '우리',     '김현기', '가계',     '관리비(집)(',         '가계 관리비',            250000, 250000, 300000, None, None, None, None, None, None, None, None, None),
    ('3333015953072',  '카카오',   '이요람', '가계',     '관리비(인터넷+티비)', '인터넷+티비',            9900,   9900,   9900,   None, None, None, None, None, None, None, None, None),
    ('3333015953072',  '카카오',   '이요람', '가계',     '관리비(정수기)',       '정수기',                 17900,  17900,  17900,  None, None, None, None, None, None, None, None, None),
    ('79791036390',    '카카오',   '이요람', '처가',     '경조사',             '요람 경조사',            50000,  50000,  50000,  None, None, None, None, None, None, None, None, None),
]

MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']


def upgrade() -> None:
    conn = op.get_bind()
    count = conn.execute(sa.text("SELECT COUNT(*) FROM fixed_expense")).scalar()
    if count > 0:
        return

    rows = []
    for row in INITIAL_DATA:
        account_number, bank_name, account_holder, transfer_name, category, item_name = row[:6]
        monthly_vals = row[6:]
        monthly_data = {MONTHS[i]: monthly_vals[i] for i in range(12) if monthly_vals[i] is not None}
        # monthly_amount는 데이터가 있는 월들의 평균
        amounts = [v for v in monthly_vals if v is not None]
        monthly_amount = amounts[0] if amounts else None
        rows.append({
            'account_number': str(account_number) if account_number else None,
            'bank_name': bank_name,
            'account_holder': account_holder,
            'transfer_name': transfer_name,
            'category': category,
            'item_name': item_name,
            'monthly_amount': monthly_amount,
            'monthly_data': json.dumps(monthly_data, ensure_ascii=False),
        })

    op.bulk_insert(
        sa.table(
            'fixed_expense',
            sa.column('account_number', sa.String),
            sa.column('bank_name', sa.String),
            sa.column('account_holder', sa.String),
            sa.column('transfer_name', sa.String),
            sa.column('category', sa.String),
            sa.column('item_name', sa.String),
            sa.column('monthly_amount', sa.Numeric),
            sa.column('monthly_data', sa.String),
        ),
        rows,
    )


def downgrade() -> None:
    pass
