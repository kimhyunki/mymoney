"""Add fixed_expense table

Revision ID: 004_add_fixed_expense
Revises: 0758720a0c4c
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_add_fixed_expense'
down_revision: Union[str, None] = '0758720a0c4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'fixed_expense',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sheet_id', sa.Integer(), sa.ForeignKey('sheet_data.id'), nullable=False),
        sa.Column('account_number', sa.String(), nullable=True),
        sa.Column('bank_name', sa.String(), nullable=True),
        sa.Column('account_holder', sa.String(), nullable=True),
        sa.Column('transfer_name', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('item_name', sa.String(), nullable=False),
        sa.Column('monthly_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('monthly_data', sa.JSON(), nullable=True),
        sa.Column('upload_id', sa.Integer(), sa.ForeignKey('upload_history.id'), nullable=True),
        sa.Column('data_record_id', sa.Integer(), sa.ForeignKey('data_record.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_fixed_expense_id'), 'fixed_expense', ['id'], unique=False)
    op.create_index(op.f('ix_fixed_expense_category'), 'fixed_expense', ['category'], unique=False)
    op.create_index(op.f('ix_fixed_expense_item_name'), 'fixed_expense', ['item_name'], unique=False)
    op.create_index('idx_fixed_exp_item_upload', 'fixed_expense', ['item_name', 'upload_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_fixed_exp_item_upload', table_name='fixed_expense')
    op.drop_index(op.f('ix_fixed_expense_item_name'), table_name='fixed_expense')
    op.drop_index(op.f('ix_fixed_expense_category'), table_name='fixed_expense')
    op.drop_index(op.f('ix_fixed_expense_id'), table_name='fixed_expense')
    op.drop_table('fixed_expense')
