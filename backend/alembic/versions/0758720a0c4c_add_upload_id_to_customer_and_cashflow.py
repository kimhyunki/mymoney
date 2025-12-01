"""add_upload_id_to_customer_and_cashflow

Revision ID: 0758720a0c4c
Revises: 002_create_cash_flow
Create Date: 2025-11-24 09:17:07.424396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0758720a0c4c'
down_revision: Union[str, None] = '002_create_cash_flow'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Customer 테이블에 upload_id 컬럼 추가
    op.add_column('customer', sa.Column('upload_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_customer_upload_id',
        'customer', 'upload_history',
        ['upload_id'], ['id']
    )
    
    # CashFlow 테이블에 upload_id 컬럼 추가
    op.add_column('cash_flow', sa.Column('upload_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_cash_flow_upload_id',
        'cash_flow', 'upload_history',
        ['upload_id'], ['id']
    )
    
    # 기존 데이터 처리: sheet_id를 통해 upload_id 찾아서 채우기
    # CashFlow의 경우 sheet_id로 SheetData를 찾고, 그 upload_id를 사용
    op.execute("""
        UPDATE cash_flow
        SET upload_id = (
            SELECT sheet_data.upload_id
            FROM sheet_data
            WHERE sheet_data.id = cash_flow.sheet_id
        )
        WHERE upload_id IS NULL
    """)
    
    # Customer의 경우 data_record_id를 통해 sheet_id를 찾고, 그 upload_id를 사용
    op.execute("""
        UPDATE customer
        SET upload_id = (
            SELECT sheet_data.upload_id
            FROM data_record
            JOIN sheet_data ON sheet_data.id = data_record.sheet_id
            WHERE data_record.id = customer.data_record_id
        )
        WHERE upload_id IS NULL AND data_record_id IS NOT NULL
    """)
    
    # 복합 인덱스 생성
    op.create_index('idx_customer_name_upload', 'customer', ['name', 'upload_id'])
    op.create_index('idx_cashflow_item_upload', 'cash_flow', ['item_name', 'upload_id'])


def downgrade() -> None:
    # 인덱스 제거
    op.drop_index('idx_cashflow_item_upload', table_name='cash_flow')
    op.drop_index('idx_customer_name_upload', table_name='customer')
    
    # 외래 키 제약 조건 제거
    op.drop_constraint('fk_cash_flow_upload_id', 'cash_flow', type_='foreignkey')
    op.drop_constraint('fk_customer_upload_id', 'customer', type_='foreignkey')
    
    # 컬럼 제거
    op.drop_column('cash_flow', 'upload_id')
    op.drop_column('customer', 'upload_id')

