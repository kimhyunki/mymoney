"""Add real_estate_analysis table

Revision ID: 007_add_real_estate_analysis
Revises: 006_add_financial_goal
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_add_real_estate_analysis'
down_revision: Union[str, None] = '006_add_financial_goal'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'real_estate_analysis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sheet_id', sa.Integer(), sa.ForeignKey('sheet_data.id'), nullable=False),
        sa.Column('property_name', sa.String(), nullable=True),
        sa.Column('total_acquisition_cost', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('self_capital', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('loan_capital', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('current_market_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('unrealized_gain', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('roe', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('leverage_multiple', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('acceleration_factor', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('analysis_data', sa.JSON(), nullable=True),
        sa.Column('upload_id', sa.Integer(), sa.ForeignKey('upload_history.id'), nullable=True),
        sa.Column('data_record_id', sa.Integer(), sa.ForeignKey('data_record.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_real_estate_analysis_id'), 'real_estate_analysis', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_real_estate_analysis_id'), table_name='real_estate_analysis')
    op.drop_table('real_estate_analysis')
