"""Add financial_goal table

Revision ID: 006_add_financial_goal
Revises: 005_add_monthly_summary
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_add_financial_goal'
down_revision: Union[str, None] = '005_add_monthly_summary'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'financial_goal',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sheet_id', sa.Integer(), sa.ForeignKey('sheet_data.id'), nullable=False),
        sa.Column('goal_name', sa.String(), nullable=False),
        sa.Column('target_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('start_date', sa.String(), nullable=True),
        sa.Column('end_date', sa.String(), nullable=True),
        sa.Column('interest_rate', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('total_weeks', sa.Integer(), nullable=True),
        sa.Column('elapsed_weeks', sa.Integer(), nullable=True),
        sa.Column('remaining_weeks', sa.Integer(), nullable=True),
        sa.Column('progress_rate', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('weekly_allocation', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('planned_data', sa.JSON(), nullable=True),
        sa.Column('actual_data', sa.JSON(), nullable=True),
        sa.Column('upload_id', sa.Integer(), sa.ForeignKey('upload_history.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_financial_goal_id'), 'financial_goal', ['id'], unique=False)
    op.create_index(op.f('ix_financial_goal_goal_name'), 'financial_goal', ['goal_name'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_financial_goal_goal_name'), table_name='financial_goal')
    op.drop_index(op.f('ix_financial_goal_id'), table_name='financial_goal')
    op.drop_table('financial_goal')
