# Architecture

## Overview

The system follows a clean three-tier architecture. The React frontend communicates exclusively with the FastAPI backend over HTTP. The backend owns all business logic, AI orchestration, and database access.

```
┌──────────────────────────────────────┐
│           React Frontend             │
│  Redux Toolkit  •  React Router      │
│  http://localhost:5173               │
└─────────────────┬────────────────────┘
                  │  HTTP / JSON
┌─────────────────▼────────────────────┐
│           FastAPI Backend            │
│  api/  ──► services/  ──► langgraph/ │
│  http://localhost:8000               │
└──────┬──────────────────────┬────────┘
       │                      │
┌──────▼──────┐      ┌────────▼────────┐
│  PostgreSQL  │      │   Groq Cloud    │
│  complaints  │      │  gemma2-9b-it   │
└─────────────┘      └─────────────────┘
```

---

## Request Lifecycle — Complaint Analysis

This is the most important flow in the application.

```
Browser                 FastAPI              LangGraph Graph         Groq API
  │                       │                       │                      │
  │  POST /api/complaints  │                       │                      │
  │  /analyze              │                       │                      │
  │──────────────────────► │                       │                      │
  │                        │  complaint_service     │                      │
  │                        │  .analyze(payload)     │                      │
  │                        │──────────────────────► │                      │
  │                        │                        │  input_node          │
  │                        │                        │  document_parser_node│
  │                        │                        │  text_cleaner_node   │
  │                        │                        │  complaint_           │
  │                        │                        │  understanding_node  │
  │                        │                        │──────────────────────► extraction
  │                        │                        │◄────────────────────── JSON
  │                        │                        │──────────────────────► summary
  │                        │                        │◄────────────────────── text
  │                        │                        │──────────────────────► risk
  │                        │                        │◄────────────────────── JSON
  │                        │                        │──────────────────────► root_cause
  │                        │                        │◄────────────────────── JSON
  │                        │                        │──────────────────────► capa
  │                        │                        │◄────────────────────── JSON
  │                        │                        │──────────────────────► completeness
  │                        │                        │◄────────────────────── JSON
  │                        │                        │──────────────────────► duplicate
  │                        │                        │◄────────────────────── JSON
  │                        │                        │  formatter_node      │
  │                        │◄────────────────────── │  ComplaintAnalysis   │
  │                        │                        │  Response            │
  │◄────────────────────── │                        │                      │
  │  JSON response          │                        │                      │
```

---

## Request Lifecycle — Save Complaint

```
Browser                 FastAPI              PostgreSQL
  │                       │                      │
  │  POST /api/complaints  │                      │
  │  /save                 │                      │
  │  {ComplaintCreate}     │                      │
  │──────────────────────► │                      │
  │                        │  complaint_service   │
  │                        │  .save(db, payload)  │
  │                        │─────────────────────►│
  │                        │                      │  INSERT complaints
  │                        │◄─────────────────────│  RETURNING *
  │                        │  ComplaintResponse   │
  │◄────────────────────── │  {id: 42, ...}       │
  │                        │                      │
  │  navigate('/complaints/42')                   │
  │  GET /api/complaints/42                       │
  │──────────────────────► │                      │
  │                        │─────────────────────►│  SELECT * WHERE id=42
  │◄────────────────────── │◄─────────────────────│
  │  Complaint Detail Page │                      │
```

---

## Backend Layer Responsibilities

| Layer | Path | Responsibility |
|---|---|---|
| API Routes | `api/complaints.py` | HTTP binding only — no logic |
| Services | `services/complaint_service.py` | Orchestrates analysis and DB operations |
| AI Client | `services/groq_client.py` | Groq SDK wrapper with JSON mode |
| Mock Fallback | `services/mock_analysis_service.py` | Regex-based fallback when API key is absent |
| LangGraph | `langgraph/` | Stateful AI workflow — nodes and graph |
| Prompts | `prompts/` | One file per AI task |
| Models | `models/complaint.py` | SQLAlchemy ORM table definition |
| Schemas | `schemas/complaint.py` | Pydantic request/response models |
| Config | `config/settings.py` | Environment variable loading |

---

## Frontend Layer Responsibilities

| Layer | Path | Responsibility |
|---|---|---|
| Pages | `pages/` | Route-level components |
| Components | `components/` | Reusable UI — badges, panels, tables |
| Features | `features/` | Redux slices grouped by domain |
| Services | `services/complaintApi.ts` | All HTTP calls in one file |
| Types | `types/complaint.ts` | TypeScript types mirroring backend schemas |
| Layouts | `layouts/AppLayout.tsx` | Shell with Sidebar, Navbar, Toast container |

---

## State Management

Redux Toolkit manages two domains:

- **`analysis` slice** (`features/complaints/analysisSlice.ts`): Holds the current AI analysis result, loading/error status, extracted text from uploads, and upload warnings.
- **`ui` slice** (`features/ui/uiSlice.ts`): Holds the toast notification queue. Any component can dispatch `addToast({ type, message })` and it will render in the global `ToastContainer`.

Form state (the complaint fields the user is editing) lives in local component state inside `ComplaintSubmissionPage`, not in Redux, because it doesn't need to be shared.

---

## Error Handling Strategy

| Scenario | Backend | Frontend |
|---|---|---|
| Empty complaint text | 400 Bad Request | Toast warning |
| Unsupported file type | 415 Unsupported Media | Toast error |
| Invalid PDF / no text | 422 Unprocessable Entity | Toast error |
| Groq API timeout/failure | 504 Gateway Timeout | Toast error with message |
| Database error | 500 Internal Server Error | Toast error |
| Complaint not found | 404 Not Found | Toast + redirect to `/complaints` |
| Network offline | fetch throws | Toast error |