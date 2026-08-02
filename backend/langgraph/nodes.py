import re
from typing import Any

from prompts import (
    CAPA_PROMPT,
    COMPLETENESS_PROMPT,
    DUPLICATE_PROMPT,
    EXTRACTION_PROMPT,
    RISK_PROMPT,
    ROOT_CAUSE_PROMPT,
    SUMMARY_PROMPT,
)
from schemas.complaint import ComplaintAnalysisResponse, ExtractedFields
from services.groq_client import groq_client

from langgraph.state import ComplaintState


class LangGraphWorkflowError(RuntimeError):
    pass


def input_node(state: ComplaintState) -> ComplaintState:
    request = state["request"]
    raw_input = request.complaint_text.strip()
    if not raw_input:
        raise LangGraphWorkflowError("Complaint text cannot be empty.")
    return {"raw_input": raw_input}


def document_parser_node(state: ComplaintState) -> ComplaintState:
    # Phase 6 receives normalized text from the API. Upload-specific parsing is later.
    return {"parsed_text": state["raw_input"]}


def text_cleaner_node(state: ComplaintState) -> ComplaintState:
    clean_text = re.sub(r"\s+", " ", state["parsed_text"]).strip()
    return {"clean_text": clean_text}


def complaint_understanding_node(state: ComplaintState) -> ComplaintState:
    request = state["request"]
    understanding = {
        "customer_name": request.customer_name,
        "product_name": request.product_name,
        "batch_number": request.batch_number,
        "complaint_text": state["clean_text"],
    }
    return {"understanding": understanding}


def extraction_node(state: ComplaintState) -> ComplaintState:
    """Use AI to extract structured fields from the complaint text."""
    prompt_input = EXTRACTION_PROMPT.format(complaint_text=state["clean_text"])
    try:
        data = groq_client.complete_json_raw(prompt_input)
        extracted = ExtractedFields(
            customer_name=data.get("customer_name") or None,
            product_name=data.get("product_name") or None,
            batch_number=data.get("batch_number") or None,
            manufacturing_date=data.get("manufacturing_date") or None,
            expiry_date=data.get("expiry_date") or None,
            complaint_category=data.get("complaint_category") or None,
        )
        # Merge extracted hints into understanding if not already provided
        understanding = state.get("understanding", {})
        if not understanding.get("customer_name") and extracted.customer_name:
            understanding["customer_name"] = extracted.customer_name
        if not understanding.get("product_name") and extracted.product_name:
            understanding["product_name"] = extracted.product_name
        if not understanding.get("batch_number") and extracted.batch_number:
            understanding["batch_number"] = extracted.batch_number
        return {"extracted_fields": extracted, "understanding": understanding}
    except Exception:
        # Extraction is best-effort — never fail the workflow
        return {"extracted_fields": ExtractedFields()}


def summary_node(state: ComplaintState) -> ComplaintState:
    summary = groq_client.complete_text(SUMMARY_PROMPT, _complaint_context(state))
    return {"summary": summary}


def risk_node(state: ComplaintState) -> ComplaintState:
    data = groq_client.complete_json(RISK_PROMPT, _complaint_context(state))
    return {
        "risk_level": _require_string(data, "risk_level"),
        "risk_reason": _require_string(data, "risk_reason", fallback_key="reason"),
    }


def root_cause_node(state: ComplaintState) -> ComplaintState:
    data = groq_client.complete_json(ROOT_CAUSE_PROMPT, _complaint_context(state))
    return {
        "root_cause": _require_string(data, "root_cause"),
        "root_cause_reason": _require_string(data, "root_cause_reason", fallback_key="reason"),
    }


def capa_node(state: ComplaintState) -> ComplaintState:
    data = groq_client.complete_json(CAPA_PROMPT, _analysis_context(state))
    return {
        "corrective_action": _require_string(data, "corrective_action"),
        "preventive_action": _require_string(data, "preventive_action"),
    }


def completeness_node(state: ComplaintState) -> ComplaintState:
    data = groq_client.complete_json(COMPLETENESS_PROMPT, _complaint_context(state))
    missing = data.get("missing_information")
    if not isinstance(missing, list) or not all(isinstance(item, str) for item in missing):
        raise LangGraphWorkflowError("Completeness node returned invalid missing_information.")
    return {"missing_information": missing}


def duplicate_node(state: ComplaintState) -> ComplaintState:
    data = groq_client.complete_json(DUPLICATE_PROMPT, _duplicate_context(state))
    confidence = data.get("confidence", 0.75)
    if not isinstance(confidence, int | float):
        raise LangGraphWorkflowError("Duplicate node returned invalid confidence.")
    return {
        "duplicate_probability": _require_string(data, "duplicate_probability"),
        "confidence": max(0.0, min(float(confidence), 1.0)),
    }


def formatter_node(state: ComplaintState) -> ComplaintState:
    try:
        response = ComplaintAnalysisResponse(
            summary=state["summary"],
            risk_level=state["risk_level"],
            risk_reason=state["risk_reason"],
            root_cause=state["root_cause"],
            root_cause_reason=state["root_cause_reason"],
            corrective_action=state["corrective_action"],
            preventive_action=state["preventive_action"],
            missing_information=state["missing_information"],
            duplicate_probability=state["duplicate_probability"],
            confidence=state["confidence"],
            extracted_fields=state.get("extracted_fields"),
        )
    except Exception as exc:
        raise LangGraphWorkflowError("Formatted AI response did not match the Phase 4 contract.") from exc
    return {"final_response": response}


def _complaint_context(state: ComplaintState) -> str:
    return (
        "Complaint text:\n"
        f"{state['clean_text']}\n\n"
        "Known structured hints:\n"
        f"{state.get('understanding', {})}"
    )


def _analysis_context(state: ComplaintState) -> str:
    return (
        f"{_complaint_context(state)}\n\n"
        f"Risk: {state.get('risk_level')} - {state.get('risk_reason')}\n"
        f"Root cause: {state.get('root_cause')} - {state.get('root_cause_reason')}"
    )


def _duplicate_context(state: ComplaintState) -> str:
    return (
        f"{_complaint_context(state)}\n\n"
        "Previous complaint context is not available in Phase 6. "
        "Use only explicit repeat/same-batch language in the current complaint."
    )


def _require_string(data: dict[str, Any], key: str, fallback_key: str | None = None) -> str:
    value = data.get(key)
    if value is None and fallback_key:
        value = data.get(fallback_key)
    if not isinstance(value, str) or not value.strip():
        raise LangGraphWorkflowError(f"Node returned invalid {key}.")
    return value.strip()
