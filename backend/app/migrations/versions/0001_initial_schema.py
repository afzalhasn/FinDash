"""Initial database schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2025-12-14 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    user_role = postgresql.ENUM("admin", "partner", "staff", name="user_role")
    user_role.create(op.get_bind(), checkfirst=True)

    transaction_type = postgresql.ENUM("buy", "sell", "expense", name="transaction_type")
    transaction_type.create(op.get_bind(), checkfirst=True)

    expense_category = postgresql.ENUM("rent", "transport", "salary", "other", name="expense_category")
    expense_category.create(op.get_bind(), checkfirst=True)

    quantity_type = postgresql.ENUM("kg", "dozen", "pack", "unit", "custom", name="quantity_type")
    quantity_type.create(op.get_bind(), checkfirst=True)

    investment_activity_type = postgresql.ENUM("investment", "withdrawal", name="investment_activity_type")
    investment_activity_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("role", sa.Enum(name="user_role", native_enum=False), nullable=False),
        sa.Column("disabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)

    op.create_table(
        "investor",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("total_invested", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_withdrawn", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("net_investment", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
    )

    op.create_table(
        "transaction",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("type", sa.Enum(name="transaction_type", native_enum=False), nullable=False),
        sa.Column("product_name", sa.String(length=255)),
        sa.Column("expense_category", sa.Enum(name="expense_category", native_enum=False)),
        sa.Column("expense_description", sa.Text()),
        sa.Column("quantity", sa.Float()),
        sa.Column("quantity_type", sa.Enum(name="quantity_type", native_enum=False)),
        sa.Column("price_per_unit", sa.Numeric(12, 2)),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("person_name", sa.String(length=255)),
        sa.Column("recorded_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
    )
    op.create_check_constraint(
        "chk_transaction_product_applicability",
        "transaction",
        "(type = 'expense' AND product_name IS NULL) OR (type IN ('buy','sell') AND product_name IS NOT NULL)",
    )

    op.create_table(
        "investmentactivity",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("investor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("investor.id"), nullable=False),
        sa.Column("type", sa.Enum(name="investment_activity_type", native_enum=False), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
        sa.Column("created_by", sa.String(length=255)),
    )
    op.create_index("ix_investmentactivity_investor_id", "investmentactivity", ["investor_id"])

    op.create_table(
        "auditlog",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("payload", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())")),
    )


def downgrade() -> None:
    op.drop_table("auditlog")
    op.drop_index("ix_investmentactivity_investor_id", table_name="investmentactivity")
    op.drop_table("investmentactivity")
    op.drop_table("transaction")
    op.drop_table("investor")
    op.drop_index("ix_user_email", table_name="user")
    op.drop_table("user")

    for enum_name in [
        "investment_activity_type",
        "quantity_type",
        "expense_category",
        "transaction_type",
        "user_role",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE;")
