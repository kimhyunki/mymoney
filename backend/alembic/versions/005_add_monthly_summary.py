"""Add monthly_summary table

Revision ID: 005_add_monthly_summary
Revises: 004_add_fixed_expense
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_add_monthly_summary'
down_revision: Union[str, None] = '004_add_fixed_expense'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'monthly_summary',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sheet_id', sa.Integer(), sa.ForeignKey('sheet_data.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('income', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('expense', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('net_income', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('cumulative_net_income', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('investment_principal', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('investment_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('upload_id', sa.Integer(), sa.ForeignKey('upload_history.id'), nullable=True),
        sa.Column('data_record_id', sa.Integer(), sa.ForeignKey('data_record.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_monthly_summary_id'), 'monthly_summary', ['id'], unique=False)
    op.create_index(op.f('ix_monthly_summary_year'), 'monthly_summary', ['year'], unique=False)
    op.create_index(
        'idx_monthly_summary_year_month_upload',
        'monthly_summary',
        ['year', 'month', 'upload_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('idx_monthly_summary_year_month_upload', table_name='monthly_summary')
    op.drop_index(op.f('ix_monthly_summary_year'), table_name='monthly_summary')
    op.drop_index(op.f('ix_monthly_summary_id'), table_name='monthly_summary')
    op.drop_table('monthly_summary')
