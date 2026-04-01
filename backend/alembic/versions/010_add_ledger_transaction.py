"""Add ledger_transaction table

Revision ID: 010_add_ledger_transaction
Revises: 009_add_investment_status
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '010_add_ledger_transaction'
down_revision: Union[str, None] = '009_add_investment_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS ledger_transaction (
            id SERIAL NOT NULL,
            transaction_date TIMESTAMP,
            transaction_time VARCHAR,
            transaction_type VARCHAR,
            category VARCHAR,
            subcategory VARCHAR,
            description VARCHAR,
            amount NUMERIC(15, 2),
            currency VARCHAR,
            payment_method VARCHAR,
            memo VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_ledger_transaction_id ON ledger_transaction (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ledger_transaction_date ON ledger_transaction (transaction_date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ledger_transaction_type ON ledger_transaction (transaction_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ledger_transaction_category ON ledger_transaction (category)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_ledger_transaction_category")
    op.execute("DROP INDEX IF EXISTS ix_ledger_transaction_type")
    op.execute("DROP INDEX IF EXISTS ix_ledger_transaction_date")
    op.execute("DROP INDEX IF EXISTS ix_ledger_transaction_id")
    op.execute("DROP TABLE IF EXISTS ledger_transaction")
