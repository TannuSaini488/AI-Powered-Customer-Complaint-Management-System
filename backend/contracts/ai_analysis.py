AI_ANALYSIS_RESPONSE_EXAMPLE = {
    "summary": "Customer reported a pharmaceutical product quality complaint requiring QA review.",
    "risk_level": "Medium",
    "risk_reason": "The complaint may affect product quality and requires documented investigation.",
    "root_cause": "Unknown",
    "root_cause_reason": "Available complaint details are insufficient to confirm a specific root cause.",
    "corrective_action": "Quarantine affected units and initiate QA investigation.",
    "preventive_action": "Review batch records, packaging controls, and complaint trend history.",
    "missing_information": [],
    "duplicate_probability": "Unique",
    "confidence": 0.85,
}

AI_ANALYSIS_RESPONSE_FIELDS = tuple(AI_ANALYSIS_RESPONSE_EXAMPLE.keys())
