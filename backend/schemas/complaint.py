from datetime import date, datetime
from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from contracts.ai_analysis import AI_ANALYSIS_RESPONSE_EXAMPLE


class RiskLevel(StrEnum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class DuplicateProbability(StrEnum):
    unique = "Unique"
    probably_duplicate = "Probably Duplicate"
    duplicate = "Duplicate"


class ComplaintAnalyzeRequest(BaseModel):
    complaint_text: str = Field(..., min_length=1)
    customer_name: str | None = None
    product_name: str | None = None
    batch_number: str | None = None


class ExtractedFields(BaseModel):
    """Structured fields extracted from the raw complaint text by the AI."""
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None  # YYYY-MM-DD string
    expiry_date: Optional[str] = None         # YYYY-MM-DD string
    complaint_category: Optional[str] = None


class ComplaintAnalysisResponse(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"example": AI_ANALYSIS_RESPONSE_EXAMPLE},
    )

    summary: str
    risk_level: RiskLevel
    risk_reason: str
    root_cause: str
    root_cause_reason: str
    corrective_action: str
    preventive_action: str
    missing_information: list[str]
    duplicate_probability: DuplicateProbability
    confidence: float = Field(..., ge=0, le=1)
    extracted_fields: Optional[ExtractedFields] = None
    analysis_provider: str = "groq"


class ComplaintCreate(BaseModel):
    customer_name: str
    product_name: str
    batch_number: str | None = None
    manufacturing_date: date | None = None
    expiry_date: date | None = None
    complaint_category: str
    complaint_description: str
    attachment_url: str | None = None
    summary: str | None = None
    risk_level: RiskLevel = RiskLevel.medium
    risk_reason: str | None = None
    root_cause: str | None = None
    corrective_action: str | None = None
    preventive_action: str | None = None
    duplicate_probability: DuplicateProbability = DuplicateProbability.unique
    complaint_status: str = "Open"


class ComplaintResponse(ComplaintCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class UploadResponse(BaseModel):
    filename: str
    content_type: str | None
    extracted_text: str
    warning: str | None = None
