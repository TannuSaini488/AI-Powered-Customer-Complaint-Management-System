from typing import Any, TypedDict

from schemas.complaint import ComplaintAnalyzeRequest, ComplaintAnalysisResponse, ExtractedFields


class ComplaintState(TypedDict, total=False):
    request: ComplaintAnalyzeRequest
    raw_input: str
    parsed_text: str
    clean_text: str
    understanding: dict[str, Any]
    extracted_fields: ExtractedFields
    summary: str
    risk_level: str
    risk_reason: str
    root_cause: str
    root_cause_reason: str
    corrective_action: str
    preventive_action: str
    missing_information: list[str]
    duplicate_probability: str
    confidence: float
    final_response: ComplaintAnalysisResponse
