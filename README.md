# AI-Powered Customer Complaint Management System

A production-quality web application for managing customer complaints in the pharmaceutical manufacturing industry. The AI is the primary feature — every complaint is automatically summarised, risk-classified, root-cause-reasoned, and CAPA-recommended by a LangGraph workflow that calls the Groq API.

---

## Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Groq API key | [console.groq.com](https://console.groq.com) |

### 1. Clone and configure

```bash
git clone <repo-url>
cd "AI-Powered Customer Complaint Management System"
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/complaint_qms
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=gemma2-9b-it
FRONTEND_URL=http://localhost:5173
APP_ENV=development
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create the database
createdb complaint_qms

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --port 8000
```

API is now available at `http://localhost:8000`  
Swagger UI at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` (or 5174 if port is busy).

---

## What the Application Does

A QA analyst opens the app, pastes or uploads a complaint, and clicks **Analyse with AI**. Within seconds, the LangGraph pipeline:

1. Extracts structured fields (customer, product, batch, dates)
2. Generates a professional complaint summary
3. Classifies the risk level (Low / Medium / High / Critical) with reasoning
4. Recommends the most likely root cause
5. Generates corrective and preventive actions (CAPA)
6. Checks for missing required information
7. Detects potential duplicate complaints

The analyst reviews the AI output, adjusts any fields, and saves. The complaint is stored in PostgreSQL and immediately visible on the Dashboard and History page.

---

## Project Structure

```
.
├── backend/          # FastAPI + LangGraph + PostgreSQL
├── frontend/         # React + Redux + Vite
└── docs/             # Phase documentation
```

See [FolderStructure.md](./FolderStructure.md) for the full tree.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, React Router, Vite |
| Styling | Vanilla CSS, Inter font |
| Backend | Python 3.11, FastAPI |
| AI Orchestration | LangGraph |
| LLM | Groq API — `gemma2-9b-it` |
| Database | PostgreSQL 14 |
| ORM | SQLAlchemy 2, Alembic |
| Validation | Pydantic v2 |

---

## Fallback Behaviour

If `GROQ_API_KEY` is not set, the backend falls back to `mock_analysis_service.py` — a deterministic rule-based analyser that still produces the same JSON contract. Every API response includes `analysis_provider: "groq"` or `analysis_provider: "mock"` so you can verify which path was taken.

---

## Key Design Decisions

- **Routes are thin**: `api/complaints.py` delegates immediately to `complaint_service.py`. No business logic in routes.
- **Prompts are isolated**: Each AI task has its own prompt file in `backend/prompts/`. They are never mixed.
- **One schema, two providers**: Both Groq and mock return the identical `ComplaintAnalysisResponse` Pydantic model. Switching providers requires no frontend change.
- **JSON mode enforced**: All Groq calls use `response_format={"type": "json_object"}` plus explicit prompt instructions to prevent the model from returning code or prose.
