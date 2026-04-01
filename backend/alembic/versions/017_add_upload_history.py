"""Add upload_history table

Revision ID: 017_add_upload_history
Revises: 016_financial_snapshot
Create Date: 2026-04-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '017_add_upload_history'
down_revision: Union[str, None] = '016_financial_snapshot'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id SERIAL NOT NULL,
            filename VARCHAR NOT NULL,
            file_size INTEGER,
            result_json JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_upload_history_id ON upload_history (id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_upload_history_id")
    op.execute("DROP TABLE IF EXISTS upload_history")
