from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    manufacturing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    complaint_category: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    complaint_description: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium", index=True)
    risk_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_cause: Mapped[str | None] = mapped_column(String(150), nullable=True)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    preventive_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    duplicate_probability: Mapped[str] = mapped_column(String(50), nullable=False, default="Unique")
    complaint_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Open", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
