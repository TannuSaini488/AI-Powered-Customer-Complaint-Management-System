import re

from schemas.complaint import (
    ComplaintAnalyzeRequest,
    ComplaintAnalysisResponse,
    DuplicateProbability,
    ExtractedFields,
    RiskLevel,
)


def analyze_with_mock_rules(payload: ComplaintAnalyzeRequest) -> ComplaintAnalysisResponse:
    """Deterministic Phase 5 analysis.

    This module is intentionally isolated from Groq and LangGraph so it can be
    replaced by the real graph implementation without changing the API route or
    response contract.
    """
    text = payload.complaint_text.strip()
    lowered = text.lower()

    risk_level = RiskLevel.medium
    risk_reason = "The complaint describes a pharmaceutical product quality issue requiring QA review."
    root_cause = "Unknown"
    root_cause_reason = "There is not enough evidence yet to confirm a single root cause."
    corrective_action = "Document the complaint, request supporting evidence, and route it to QA triage."
    preventive_action = "Trend similar complaints and review whether additional process controls are needed."
    confidence = 0.68

    if any(term in lowered for term in ["wrong medicine", "wrong product", "expired"]):
        risk_level = RiskLevel.critical
        risk_reason = "Wrong or expired medicine can directly affect patient safety and product identity."
        root_cause = "Labeling"
        root_cause_reason = "The complaint suggests a labeling, dispensing, or product identification failure."
        corrective_action = "Quarantine related stock, verify distribution records, and escalate to QA leadership."
        preventive_action = "Review label reconciliation, dispatch checks, and customer notification procedures."
        confidence = 0.9
    elif any(term in lowered for term in ["foreign", "particle", "contamination", "contaminated"]):
        risk_level = RiskLevel.critical
        risk_reason = "Foreign matter or contamination may compromise product integrity and patient safety."
        root_cause = "Manufacturing"
        root_cause_reason = "The description points to a potential process, line-clearance, or material-handling issue."
        corrective_action = "Quarantine the affected batch, inspect retained samples, and open a QA investigation."
        preventive_action = "Review line clearance, environmental controls, and material handling procedures."
        confidence = 0.88
    elif any(term in lowered for term in ["leak", "leakage", "seal", "damaged packaging"]):
        risk_level = RiskLevel.high
        risk_reason = "Leakage or damaged packaging can expose product to contamination or stability risk."
        root_cause = "Packaging"
        root_cause_reason = "The reported defect is consistent with primary or secondary packaging failure."
        corrective_action = "Inspect packaging integrity, quarantine impacted units, and request complaint sample return."
        preventive_action = "Review sealing parameters, packaging material controls, and transport damage trends."
        confidence = 0.84
    elif any(term in lowered for term in ["broken", "cracked", "discolored", "colour", "color variation"]):
        risk_level = RiskLevel.high
        risk_reason = "Visible product defects can indicate manufacturing, packaging, or storage-related quality impact."
        root_cause = "Packaging"
        root_cause_reason = "The available facts are consistent with packaging, handling, moisture, or storage exposure."
        corrective_action = "Quarantine affected units and compare complaint sample against retained batch sample."
        preventive_action = "Review packaging controls, storage conditions, and complaint trends for the same batch."
        confidence = 0.78
    elif any(term in lowered for term in ["label", "labeling", "mismatch", "incorrect label"]):
        risk_level = RiskLevel.high
        risk_reason = "Incorrect labeling can cause misuse, traceability gaps, or regulatory impact."
        root_cause = "Labeling"
        root_cause_reason = "The complaint directly references label mismatch or incorrect labeling."
        corrective_action = "Hold affected stock and reconcile label, batch, and dispatch records."
        preventive_action = "Review label reconciliation, dispatch checks, and customer notification procedures."
        confidence = 0.86
    elif any(term in lowered for term in ["transport", "shipment", "courier", "delivery"]):
        risk_level = RiskLevel.medium
        risk_reason = "Transport-related complaints require review for potential handling or excursion impact."
        root_cause = "Transportation"
        root_cause_reason = "The complaint references shipment or delivery handling as a likely contributor."
        corrective_action = "Request transport records and inspect received goods for extent of damage."
        preventive_action = "Review carrier handling instructions and packaging qualification for transit conditions."
        confidence = 0.74

    missing_information: list[str] = []
    if not payload.customer_name and not any(term in lowered for term in ["pharmacy", "customer", "ltd", "limited", "hospital"]):
        missing_information.append("Customer Information")
    if not payload.product_name and not any(term in lowered for term in ["capsule", "tablet", "api", "medicine", "syrup", "injection"]):
        missing_information.append("Product Name")
    if not payload.batch_number and "batch" not in lowered and "lot" not in lowered:
        missing_information.append("Batch Number")
    if "manufacturing" not in lowered and "mfg" not in lowered:
        missing_information.append("Manufacturing Date")
    if "expiry" not in lowered and "expiration" not in lowered and "exp" not in lowered:
        missing_information.append("Expiry Date")
    if len(text) < 25:
        missing_information.append("Complaint Description")

    duplicate_probability = DuplicateProbability.unique
    duplicate_terms = ["again", "same issue", "repeat", "duplicate", "previous complaint", "same batch"]
    if any(term in lowered for term in duplicate_terms):
        duplicate_probability = DuplicateProbability.probably_duplicate
        confidence = max(confidence, 0.8)

    summary = text if len(text) <= 220 else f"{text[:217]}..."

    return ComplaintAnalysisResponse(
        summary=summary,
        risk_level=risk_level,
        risk_reason=risk_reason,
        root_cause=root_cause,
        root_cause_reason=root_cause_reason,
        corrective_action=corrective_action,
        preventive_action=preventive_action,
        missing_information=missing_information,
        duplicate_probability=duplicate_probability,
        confidence=confidence,
        extracted_fields=_extract_fields(text),
        analysis_provider="mock",
    )


# ─── Entity Extraction ────────────────────────────────────────────────────────

def _extract_fields(text: str) -> ExtractedFields:
    """Regex-based best-effort entity extraction from complaint text."""

    # ── Customer / company name ───────────────────────────────────────────────
    # Look for "Customer Name: <Value>" or "Customer: <Value>"
    customer_match = re.search(
        r"Customer\s*(?:Name)?\s*:\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if customer_match:
        customer_name = customer_match.group(1).strip()
    else:
        # Fallback to looking for company-style name in the text
        company_match = re.search(
            r"\b([A-Z][A-Za-z\s&]{2,50}(?:Pharmacy|Hospital|Ltd\.?|Limited|Clinic|Distributor|Pvt\.?|Labs?|Pharmaceuticals?))",
            text,
        )
        customer_name = company_match.group(1).strip() if company_match else None

    # ── Product name ──────────────────────────────────────────────────────────
    # Look for "Product Name: <Value>" or "Product: <Value>"
    product_match = re.search(
        r"Product\s*(?:Name)?\s*:\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if product_match:
        product_name = product_match.group(1).strip()
    else:
        # Fallback to "in <Product>" pattern
        in_match = re.search(
            r"\bin\s+([A-Z][A-Za-z0-9\s]{2,50}?(?:Capsules?|Tablets?|Syrup|Injection|API|Solution|Cream|Gel|mg|mcg)(?:\s+\d+\s*(?:mg|mcg|ml|g))?)",
            text,
            re.IGNORECASE,
        )
        product_name = in_match.group(1).strip() if in_match else None

    # ── Batch number ──────────────────────────────────────────────────────────
    # Look for "Batch Number: <Value>", "Batch No: <Value>", "Batch: <Value>"
    batch_match = re.search(
        r"Batch\s*(?:Number|No|#)?\s*:\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if batch_match:
        batch_number = batch_match.group(1).strip().upper()
    else:
        batch_match = re.search(
            r"(?:batch|lot)\s*(?:no\.?|number|#)?\s*:?\s*([A-Za-z0-9-]{1,30})",
            text,
            re.IGNORECASE,
        )
        batch_number = batch_match.group(1).strip().upper() if batch_match else None

    # ── Manufacturing date ────────────────────────────────────────────────────
    mfg_match = re.search(
        r"(?:manufacturing|mfg)\s*(?:date)?\s*:\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if mfg_match:
        manufacturing_date = _normalise_date(mfg_match.group(1).strip())
    else:
        mfg_match = re.search(
            r"(?:manufacturing|mfg|manufactured)\.?\s*(?:date)?\s*:?\s*"
            r"((?:January|February|March|April|May|June|July|August|September|October|November|December"
            r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}"
            r"|\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})",
            text,
            re.IGNORECASE,
        )
        manufacturing_date = _normalise_date(mfg_match.group(1).strip()) if mfg_match else None

    # ── Expiry date ───────────────────────────────────────────────────────────
    exp_match = re.search(
        r"(?:expiry|expiration|exp)\s*(?:date)?\s*:\s*([^\n\r]+)",
        text,
        re.IGNORECASE,
    )
    if exp_match:
        expiry_date = _normalise_date(exp_match.group(1).strip())
    else:
        exp_match = re.search(
            r"(?:expiry|expiration|exp|expires?)\.?\s*(?:date)?\s*:?\s*"
            r"((?:January|February|March|April|May|June|July|August|September|October|November|December"
            r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}"
            r"|\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})",
            text,
            re.IGNORECASE,
        )
        expiry_date = _normalise_date(exp_match.group(1).strip()) if exp_match else None

    # ── Complaint category ────────────────────────────────────────────────────
    lowered = text.lower()
    if any(k in lowered for k in ["foreign", "particle", "contamina"]):
        category = "Foreign Particles"
    elif any(k in lowered for k in ["broken", "cracked", "crack"]):
        category = "Broken Tablets"
    elif any(k in lowered for k in ["discolor", "colour", "color variation"]):
        category = "Color Variation"
    elif any(k in lowered for k in ["leak", "leakage"]):
        category = "Leakage"
    elif any(k in lowered for k in ["damaged pack", "damaged packaging"]):
        category = "Damaged Packaging"
    elif any(k in lowered for k in ["wrong medicine", "wrong product"]):
        category = "Wrong Medicine Received"
    elif any(k in lowered for k in ["label", "labeling", "mislabel"]):
        category = "Incorrect Labeling"
    elif any(k in lowered for k in ["expired", "expiry"]):
        category = "Expired Medicine"
    else:
        category = "Other"

    return ExtractedFields(
        customer_name=customer_name,
        product_name=product_name,
        batch_number=batch_number,
        manufacturing_date=manufacturing_date,
        expiry_date=expiry_date,
        complaint_category=category,
    )


# ─── Date Normalisation ───────────────────────────────────────────────────────

_MONTH_MAP = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}


def _normalise_date(raw: str) -> str | None:
    """Convert common date representations to YYYY-MM-DD."""
    raw = raw.strip()
    # Already YYYY-MM-DD
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw
    # DD-MM-YYYY or DD/MM/YYYY
    m1 = re.fullmatch(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", raw)
    if m1:
        return f"{m1.group(3)}-{int(m1.group(2)):02d}-{int(m1.group(1)):02d}"
    # "Month YYYY" or "Mon YYYY"  e.g. "March 2026", "Mar 2026"
    m = re.fullmatch(
        r"(January|February|March|April|May|June|July|August|September|October|November|December"
        r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*(\d{4})",
        raw,
        re.IGNORECASE,
    )
    if m:
        month_key = m.group(1).lower()
        month = _MONTH_MAP.get(month_key)
        if month:
            return f"{m.group(2)}-{month}-01"
    # MM/YYYY or MM-YYYY
    m2 = re.fullmatch(r"(\d{1,2})[/-](\d{4})", raw)
    if m2:
        return f"{m2.group(2)}-{int(m2.group(1)):02d}-01"
    return None

