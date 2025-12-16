"""Switch timestamp defaults to IST.

Revision ID: 0002_use_ist_time_zone
Revises: 0001_initial_schema
Create Date: 2025-02-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_use_ist_time_zone"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None

IST_NOW = sa.text("timezone('Asia/Kolkata', now())")
UTC_NOW = sa.text("timezone('utc', now())")

TABLE_COLUMNS = [
    ("user", "created_at"),
    ("user", "updated_at"),
    ("investor", "last_activity_at"),
    ("investor", "created_at"),
    ("investor", "updated_at"),
    ("transaction", "occurred_at"),
    ("transaction", "created_at"),
    ("transaction", "updated_at"),
    ("investmentactivity", "occurred_at"),
    ("auditlog", "created_at"),
]


def upgrade():
    for table, column in TABLE_COLUMNS:
        op.alter_column(table, column, server_default=IST_NOW)


def downgrade():
    for table, column in TABLE_COLUMNS:
        op.alter_column(table, column, server_default=UTC_NOW)
