# Folder Structure

## Root

```
AI-Powered Customer Complaint Management System/
├── backend/                    # FastAPI application
├── frontend/                   # React application
├── docs/                       # Phase-level design notes
├── README.md
├── Architecture.md
├── API.md
├── PromptDesign.md
├── LangGraph.md
├── Database.md
└── FolderStructure.md          # This file
```

---

## Backend

```
backend/
├── .env                        # Environment variables (not committed)
├── main.py                     # FastAPI app factory + CORS + router mount
├── requirements.txt
├── alembic.ini                 # Migration tool configuration
│
├── api/
│   ├── __init__.py
│   └── complaints.py           # Route handlers — thin, delegates to services
│
├── config/
│   ├── __init__.py
│   └── settings.py             # Pydantic Settings — reads .env
│
├── contracts/
│   ├── __init__.py
│   └── ai_analysis.py          # AI response JSON example (used in schema docs)
│
├── database/
│   ├── __init__.py             # Exports get_db dependency
│   ├── base.py                 # SQLAlchemy declarative Base
│   └── session.py              # Engine + SessionLocal factory
│
├── langgraph/
│   ├── __init__.py
│   ├── nodes.py                # All 12 node functions
│   ├── state.py                # ComplaintState TypedDict
│   └── workflow.py             # Graph assembly + run_complaint_workflow()
│
├── migrations/
│   ├── env.py                  # Alembic environment config
│   ├── script.py.mako          # Migration template
│   └── versions/
│       └── 20260802_001_*.py   # Initial schema migration
│
├── models/
│   ├── __init__.py
│   └── complaint.py            # Complaint SQLAlchemy ORM model
│
├── prompts/
│   ├── __init__.py             # Re-exports all prompts
│   ├── capa.py
│   ├── completeness.py
│   ├── duplicate.py
│   ├── extraction.py
│   ├── risk.py
│   ├── root_cause.py
│   └── summary.py
│
├── schemas/
│   ├── __init__.py
│   └── complaint.py            # Pydantic models: request, response, enums
│
├── services/
│   ├── __init__.py
│   ├── complaint_service.py    # Business logic: analyze, save, list, get, delete
│   ├── groq_client.py          # Groq SDK wrapper with JSON mode
│   └── mock_analysis_service.py  # Regex fallback when GROQ_API_KEY not set
│
└── utils/
    └── __init__.py
```

---

## Frontend

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
│
└── src/
    ├── main.tsx                # React DOM root
    ├── App.tsx                 # React Router routes
    ├── styles.css              # All CSS — design system + components
    ├── vite-env.d.ts
    │
    ├── components/             # Reusable, stateless UI components
    │   ├── AnalysisPanel.tsx   # AI result display (summary, risk, CAPA)
    │   ├── ComplaintTable.tsx  # History table with delete action
    │   ├── ErrorCard.tsx       # Inline error state component
    │   ├── FileUploader.tsx    # Drag-and-drop PDF/image upload
    │   ├── LoadingSkeleton.tsx # Animated placeholder lines
    │   ├── MetricCard.tsx      # Dashboard stat card
    │   ├── Navbar.tsx          # Top navigation bar
    │   ├── RiskBadge.tsx       # Coloured risk level pill
    │   ├── Sidebar.tsx         # Left nav with route links
    │   ├── StatusBadge.tsx     # Open / Closed status pill
    │   └── ToastContainer.tsx  # Renders the global toast queue from Redux
    │
    ├── features/               # Redux slices grouped by domain
    │   ├── auth/               # Auth state (mock login)
    │   ├── complaints/
    │   │   └── analysisSlice.ts  # AI analysis state machine
    │   ├── dashboard/          # Dashboard metrics slice
    │   └── ui/
    │       └── uiSlice.ts      # Toast notification queue
    │
    ├── hooks/
    │   └── redux.ts            # Typed useAppDispatch + useAppSelector
    │
    ├── layouts/
    │   └── AppLayout.tsx       # Shell: Sidebar + Navbar + <Outlet> + ToastContainer
    │
    ├── pages/                  # Route-level page components
    │   ├── AIAnalysisPage.tsx
    │   ├── ComplaintDetailsPage.tsx  # Fetches real complaint by :id from DB
    │   ├── ComplaintHistoryPage.tsx  # Lists + deletes complaints
    │   ├── ComplaintSubmissionPage.tsx  # Form + AI copilot + save
    │   ├── DashboardPage.tsx   # Metrics + recent complaints table
    │   └── LoginPage.tsx
    │
    ├── redux/
    │   └── store.ts            # Redux store configuration
    │
    ├── services/
    │   ├── authService.ts      # Mock login logic
    │   └── complaintApi.ts     # All HTTP calls to the FastAPI backend
    │
    ├── types/
    │   ├── aiContract.ts       # AI response TypeScript types
    │   └── complaint.ts        # ComplaintRecord, ComplaintAnalysis types
    │
    └── utils/                  # Utility helpers (empty — reserved)
```

---

## Key Conventions

| Convention | Rule |
|---|---|
| Routes stay thin | `api/complaints.py` calls `complaint_service` only |
| One prompt per file | Never merge prompts across tasks |
| One API file | All HTTP calls live in `complaintApi.ts` |
| Redux for global state | Local form state stays in component |
| Toast for feedback | No `alert()` or `console.error()` for user-facing messages |
| Types mirror backend | `complaint.ts` matches `schemas/complaint.py` field-for-field |
