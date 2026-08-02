# Prompt Design

Every AI task has exactly one prompt file. They are never combined into a single mega-prompt. This makes each prompt independently testable, versionable, and replaceable.

---

## Prompt File Locations

```
backend/prompts/
├── extraction.py      # Field extraction
├── summary.py         # Complaint summary
├── risk.py            # Risk classification
├── root_cause.py      # Root cause category
├── capa.py            # Corrective + Preventive actions
├── completeness.py    # Missing information check
└── duplicate.py       # Duplicate detection
```

---

## Design Principles

### 1. One prompt per task
Each prompt covers exactly one responsibility. The risk prompt does not ask about CAPA. The CAPA prompt does not ask about risk.

### 2. JSON output is mandatory
Every prompt that expects a structured response contains:
- An explicit example of the JSON keys expected
- The instruction: *"Return ONLY a valid JSON object. Do not include markdown formatting, code blocks, or python code."*

This is enforced at two levels:
- **Prompt level**: explicit instruction
- **SDK level**: `response_format={"type": "json_object"}` passed to every `complete_json()` call

### 3. No invented facts
Every prompt includes a constraint: *"Use only the information in the complaint. Do not invent facts."*

### 4. Constrained vocabularies for enum fields
Where a field must come from a fixed set of values, the prompt lists them explicitly. For example:

```
risk_level: "Low | Medium | High | Critical"
root_cause: "Manufacturing | Packaging | Storage | Transportation | Labeling | Unknown"
duplicate_probability: "Unique | Probably Duplicate | Duplicate"
```

This prevents the model from inventing new categories.

---

## Prompt Details

### Extraction (`extraction.py`)

**Purpose**: Extract structured metadata from free-form complaint text.

**Input**: Raw complaint text (after cleaning).

**Output JSON keys**:
```json
{
  "customer_name": "string or null",
  "product_name": "string or null",
  "batch_number": "string or null",
  "manufacturing_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "complaint_category": "one of the predefined categories"
}
```

**Special rule**: Dates must be normalised to `YYYY-MM-DD`. If only month/year is given, use the 1st as the day.

---

### Summary (`summary.py`)

**Purpose**: Generate a professional 2–3 sentence business summary of the complaint.

**Input**: Cleaned complaint text + structured hints (customer, product, batch).

**Output**: Plain text string (not JSON). Returned directly by `complete_text()`.

**Constraint**: Maximum 3 sentences. Do not invent any details not present in the complaint.

---

### Risk (`risk.py`)

**Purpose**: Classify the complaint severity.

**Input**: Cleaned complaint text + structured hints.

**Output JSON**:
```json
{
  "risk_level": "Low | Medium | High | Critical",
  "risk_reason": "brief QA rationale"
}
```

**Guidance provided to the model**:
- Patient safety impact
- Contamination or foreign particles
- Wrong medicine or product identity
- Broken packaging or leakage
- Label mismatch
- Expired medicine
- Visible product defect

---

### Root Cause (`root_cause.py`)

**Purpose**: Identify the most likely cause category.

**Input**: Cleaned complaint text + structured hints.

**Output JSON**:
```json
{
  "root_cause": "Manufacturing | Packaging | Storage | Transportation | Labeling | Unknown",
  "root_cause_reason": "brief evidence-based rationale"
}
```

---

### CAPA (`capa.py`)

**Purpose**: Recommend corrective and preventive actions.

**Input**: Complaint context + risk level + root cause reasoning.

**Output JSON**:
```json
{
  "corrective_action": "action addressing the current complaint/batch",
  "preventive_action": "action to reduce recurrence"
}
```

**Rules**:
- Corrective action addresses the current situation.
- Preventive action addresses systemic process improvement.
- Actions must be practical for a QA team; no invented details.

---

### Completeness (`completeness.py`)

**Purpose**: Identify which required fields are missing from the complaint.

**Input**: Cleaned complaint text + structured hints.

**Output JSON**:
```json
{
  "missing_information": ["Batch Number", "Expiry Date"]
}
```

**Required items the model checks for**:
- Customer Information
- Product Name
- Batch Number
- Manufacturing Date
- Expiry Date
- Complaint Description

---

### Duplicate (`duplicate.py`)

**Purpose**: Assess whether the complaint resembles a previously filed one.

**Input**: Complaint context + instruction that previous complaint history is not available in the current phase (so detection relies on internal language cues only, e.g. "same issue again", "repeat complaint", "same batch").

**Output JSON**:
```json
{
  "duplicate_probability": "Unique | Probably Duplicate | Duplicate",
  "confidence": 0.75
}
```

---

## How Prompts Are Called

Each node in the LangGraph workflow calls one of two methods on `groq_client`:

```python
# For tasks that need structured JSON
data = groq_client.complete_json(RISK_PROMPT, complaint_context)

# For summary which returns plain text
text = groq_client.complete_text(SUMMARY_PROMPT, complaint_context)

# For extraction (self-contained prompt, no separate system message needed)
data = groq_client.complete_json_raw(extraction_prompt_with_text_embedded)
```

The `complete_json()` path always passes `response_format={"type": "json_object"}` to the Groq SDK, enforcing structured output at the API level.
