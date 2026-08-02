# API Reference

Base URL: `http://localhost:8000`  
All request and response bodies are JSON.  
Full interactive docs: `http://localhost:8000/docs`

---

## Complaints

### POST `/api/complaints/analyze`

Run the LangGraph AI workflow against a complaint text. Does **not** save to the database.

**Request body**

```json
{
  "complaint_text": "Customer reported broken tablets in batch AMX240602 ...",
  "customer_name": "Apollo Pharmacy",
  "product_name": "Amoxicillin Capsules 500mg",
  "batch_number": "AMX240602"
}
```

`customer_name`, `product_name`, and `batch_number` are optional hints that the AI merges with whatever it extracts from the text.

**Response `200 OK`**

```json
{
  "summary": "Apollo Pharmacy reported broken tablets in Amoxicillin Capsules 500mg ...",
  "risk_level": "High",
  "risk_reason": "Visible tablet fractures indicate a packaging or storage integrity failure ...",
  "root_cause": "Packaging",
  "root_cause_reason": "The complaint is consistent with primary packaging damage during transit.",
  "corrective_action": "Quarantine affected batch and request complaint sample return.",
  "preventive_action": "Review packaging qualification and transport damage trends.",
  "missing_information": [],
  "duplicate_probability": "Unique",
  "confidence": 0.84,
  "extracted_fields": {
    "customer_name": "Apollo Pharmacy",
    "product_name": "Amoxicillin Capsules 500mg",
    "batch_number": "AMX240602",
    "manufacturing_date": "2026-03-01",
    "expiry_date": "2028-02-01",
    "complaint_category": "Broken Tablets"
  },
  "analysis_provider": "groq"
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | `complaint_text` is empty |
| 504 | Groq API timed out or returned invalid JSON |
| 500 | Unexpected internal error |

---

### POST `/api/complaints/upload`

Extract text from a PDF or image file. Returns the extracted text; does **not** run analysis.

**Request**: `multipart/form-data` with a field named `file`.

**Supported types**: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`

**Response `200 OK`**

```json
{
  "filename": "complaint_report.pdf",
  "content_type": "application/pdf",
  "extracted_text": "Customer Name: Rahul Sharma\nProduct: Paracetamol 500mg ...",
  "warning": null
}
```

**Error responses**

| Status | When |
|---|---|
| 415 | File type is not supported |
| 422 | File is valid type but could not be parsed or has no readable text |

---

### POST `/api/complaints/save`

Save a complaint record to the database. Call this after `/analyze` once the analyst has reviewed and confirmed the AI output.

**Request body**

```json
{
  "customer_name": "Apollo Pharmacy",
  "product_name": "Amoxicillin Capsules 500mg",
  "batch_number": "AMX240602",
  "manufacturing_date": "2026-03-01",
  "expiry_date": "2028-02-01",
  "complaint_category": "Broken Tablets",
  "complaint_description": "Customer reported broken tablets ...",
  "summary": "Apollo Pharmacy reported broken tablets ...",
  "risk_level": "High",
  "risk_reason": "Visible tablet fractures indicate ...",
  "root_cause": "Packaging",
  "corrective_action": "Quarantine affected batch ...",
  "preventive_action": "Review packaging qualification ...",
  "duplicate_probability": "Unique",
  "complaint_status": "Open"
}
```

**Response `201 Created`**

```json
{
  "id": 42,
  "customer_name": "Apollo Pharmacy",
  ...
  "created_at": "2026-08-02T09:15:00Z",
  "updated_at": "2026-08-02T09:15:00Z"
}
```

**Error responses**

| Status | When |
|---|---|
| 422 | Pydantic validation failed (missing required field, wrong type) |
| 500 | Database write error |

---

### GET `/api/complaints`

List all complaints, ordered by `created_at` descending.

**Response `200 OK`**: Array of `ComplaintResponse` objects.

---

### GET `/api/complaints/{id}`

Fetch a single complaint by ID.

**Response `200 OK`**: `ComplaintResponse` object.

**Error responses**

| Status | When |
|---|---|
| 404 | No complaint with that ID |

---

### DELETE `/api/complaints/{id}`

Delete a complaint from the database.

**Response `204 No Content`**: Empty body.

**Error responses**

| Status | When |
|---|---|
| 404 | No complaint with that ID |

---

## Risk Level Values

| Value | Meaning |
|---|---|
| `Low` | Minor defect; no direct patient safety impact |
| `Medium` | Quality issue requiring QA review |
| `High` | Packaging, labelling, or visible defect with potential safety impact |
| `Critical` | Contamination, wrong medicine, or expired product |

## Duplicate Probability Values

| Value | Meaning |
|---|---|
| `Unique` | No indication of a prior complaint |
| `Probably Duplicate` | Language suggests a previous report |
| `Duplicate` | Strongly matches a known complaint |
