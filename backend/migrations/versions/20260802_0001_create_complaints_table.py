"""create complaints table

Revision ID: 20260802_0001
Revises:
Create Date: 2026-08-02
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260802_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("batch_number", sa.String(length=100), nullable=True),
        sa.Column("manufacturing_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("complaint_category", sa.String(length=150), nullable=False),
        sa.Column("complaint_description", sa.Text(), nullable=False),
        sa.Column("attachment_url", sa.String(length=500), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("risk_level", sa.String(length=50), nullable=False),
        sa.Column("risk_reason", sa.Text(), nullable=True),
        sa.Column("root_cause", sa.String(length=150), nullable=True),
        sa.Column("corrective_action", sa.Text(), nullable=True),
        sa.Column("preventive_action", sa.Text(), nullable=True),
        sa.Column("duplicate_probability", sa.String(length=50), nullable=False),
        sa.Column("complaint_status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_complaints_batch_number"), "complaints", ["batch_number"], unique=False)
    op.create_index(op.f("ix_complaints_complaint_category"), "complaints", ["complaint_category"], unique=False)
    op.create_index(op.f("ix_complaints_complaint_status"), "complaints", ["complaint_status"], unique=False)
    op.create_index(op.f("ix_complaints_customer_name"), "complaints", ["customer_name"], unique=False)
    op.create_index(op.f("ix_complaints_id"), "complaints", ["id"], unique=False)
    op.create_index(op.f("ix_complaints_product_name"), "complaints", ["product_name"], unique=False)
    op.create_index(op.f("ix_complaints_risk_level"), "complaints", ["risk_level"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_complaints_risk_level"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_product_name"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_id"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_customer_name"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_complaint_status"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_complaint_category"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_batch_number"), table_name="complaints")
    op.drop_table("complaints")
