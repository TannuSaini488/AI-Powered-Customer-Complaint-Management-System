# LangGraph Workflow

The LangGraph workflow is the AI engine of the application. It processes complaint text through a directed acyclic graph (DAG) where each node has exactly one responsibility.

---

## Graph Overview

```
START
  │
  ▼
InputNode               Validates that text is not empty.
  │
  ▼
DocumentParserNode      Passes text through (normalised upstream by the upload endpoint).
  │
  ▼
TextCleanerNode         Collapses whitespace into single spaces.
  │
  ▼
ComplaintUnderstandingNode   Merges user-provided hints (customer, product, batch)
  │                          with the cleaned text into a "understanding" dict.
  ▼
ExtractionNode          Calls Groq to extract structured fields (customer, product,
  │                     batch, dates, category). Result is stored in state and merged
  │                     back into understanding if user did not supply those hints.
  ▼
SummaryNode             Calls Groq for a 2–3 sentence professional summary.
  │
  ▼
RiskNode                Calls Groq to classify risk level + reason.
  │
  ▼
RootCauseNode           Calls Groq to identify most likely root cause + reasoning.
  │
  ▼
CAPANode                Calls Groq with risk + root cause context to generate
  │                     corrective and preventive actions.
  ▼
CompletenessNode        Calls Groq to check which required fields are missing.
  │
  ▼
DuplicateNode           Calls Groq to assess duplicate probability + confidence.
  │
  ▼
FormatterNode           Assembles all state keys into a validated
  │                     ComplaintAnalysisResponse Pydantic object.
  ▼
END
```

---

## File Locations

```
backend/langgraph/
├── state.py        # ComplaintState TypedDict
├── nodes.py        # All 12 node functions
└── workflow.py     # Graph assembly + run_complaint_workflow()
```

---

## State

The graph uses a `TypedDict` called `ComplaintState` defined in `langgraph/state.py`. Each node receives the full state dict and returns a partial dict with only the keys it writes.

```python
class ComplaintState(TypedDict, total=False):
    request: ComplaintAnalyzeRequest   # Input from route
    raw_input: str                     # After input_node
    parsed_text: str                   # After document_parser_node
    clean_text: str                    # After text_cleaner_node
    understanding: dict                # After complaint_understanding_node
    extracted_fields: ExtractedFields  # After extraction_node
    summary: str                       # After summary_node
    risk_level: str                    # After risk_node
    risk_reason: str                   # After risk_node
    root_cause: str                    # After root_cause_node
    root_cause_reason: str             # After root_cause_node
    corrective_action: str             # After capa_node
    preventive_action: str             # After capa_node
    missing_information: list[str]     # After completeness_node
    duplicate_probability: str         # After duplicate_node
    confidence: float                  # After duplicate_node
    final_response: ComplaintAnalysisResponse  # After formatter_node
```

---

## Node Details

### `input_node`
Reads `state["request"].complaint_text`. Raises `LangGraphWorkflowError` if empty.

### `document_parser_node`
Passes `raw_input` through as `parsed_text`. In a future version, this node could handle format detection (HTML, MIME, etc.).

### `text_cleaner_node`
Applies `re.sub(r"\s+", " ", text).strip()` to normalise whitespace.

### `complaint_understanding_node`
Builds the `understanding` dict from the request's optional hint fields. This dict is enriched by `extraction_node` later.

### `extraction_node`
- Formats `EXTRACTION_PROMPT` with the clean text and calls `groq_client.complete_json_raw()`.
- Wraps the result in an `ExtractedFields` Pydantic object.
- Merges any newly-discovered fields back into `understanding` if the user did not supply them.
- Never raises: extraction is best-effort; on failure it returns an empty `ExtractedFields()`.

### `summary_node`
Calls `groq_client.complete_text(SUMMARY_PROMPT, context)`. Returns plain text — no JSON parsing needed.

### `risk_node`
Calls `groq_client.complete_json(RISK_PROMPT, context)`. Extracts `risk_level` and `risk_reason` with `_require_string()` validation.

### `root_cause_node`
Calls `groq_client.complete_json(ROOT_CAUSE_PROMPT, context)`. Extracts `root_cause` and `root_cause_reason`.

### `capa_node`
Calls `groq_client.complete_json(CAPA_PROMPT, analysis_context)`. The analysis context includes risk level and root cause reasoning already computed in previous nodes.

### `completeness_node`
Calls `groq_client.complete_json(COMPLETENESS_PROMPT, context)`. Validates that the result is a list of strings.

### `duplicate_node`
Calls `groq_client.complete_json(DUPLICATE_PROMPT, context)`. Clamps `confidence` to `[0.0, 1.0]`.

### `formatter_node`
Assembles all state keys into a `ComplaintAnalysisResponse`. If any required key is missing or invalid, raises `LangGraphWorkflowError` so the error is caught by the service layer.

---

## Error Handling Inside the Graph

- **`extraction_node`**: Silently swallowed — extraction failure yields empty fields rather than aborting the whole workflow.
- **All other nodes**: Raise `LangGraphWorkflowError`, which propagates up to `complaint_service.analyze()`, which catches it and raises a FastAPI `HTTPException(504)`.
- **Groq SDK / network errors**: Caught by `groq_client.complete_text()` and re-raised as `GroqAnalysisError`, which the service layer also maps to 504.

---

## Running the Workflow

```python
from langgraph.workflow import run_complaint_workflow
from schemas.complaint import ComplaintAnalyzeRequest

payload = ComplaintAnalyzeRequest(complaint_text="Customer reported ...")
result = run_complaint_workflow(payload)
# result is a fully validated ComplaintAnalysisResponse
```
