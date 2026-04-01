"""Add financial_snapshot table

Revision ID: 016_financial_snapshot
Revises: 015_financial_goal_planned_data
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '016_financial_snapshot'
down_revision: Union[str, None] = '016_fix_goal_payment_plan'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS financial_snapshot (
            id SERIAL NOT NULL,
            total_assets NUMERIC(18, 4),
            total_liabilities NUMERIC(18, 4),
            net_assets NUMERIC(18, 4),
            snapshot_data JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_financial_snapshot_id ON financial_snapshot (id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_financial_snapshot_id")
    op.execute("DROP TABLE IF EXISTS financial_snapshot")
