# Database

## Technology

| Component | Choice |
|---|---|
| Database | PostgreSQL 14+ |
| ORM | SQLAlchemy 2.x (declarative, typed `Mapped` columns) |
| Migrations | Alembic |
| Driver | psycopg2-binary |

---

## Connection

Configured via the `DATABASE_URL` environment variable in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/complaint_qms
```

The session factory lives in `backend/database/session.py` and is injected into routes via FastAPI's `Depends(get_db)`.

---

## Schema

### Table: `complaints`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `SERIAL` (PK) | No | Auto-increment primary key |
| `customer_name` | `VARCHAR(255)` | No | Indexed |
| `product_name` | `VARCHAR(255)` | No | Indexed |
| `batch_number` | `VARCHAR(100)` | Yes | Indexed |
| `manufacturing_date` | `DATE` | Yes | |
| `expiry_date` | `DATE` | Yes | |
| `complaint_category` | `VARCHAR(150)` | No | Indexed |
| `complaint_description` | `TEXT` | No | |
| `attachment_url` | `VARCHAR(500)` | Yes | Future use |
| `summary` | `TEXT` | Yes | AI-generated |
| `risk_level` | `VARCHAR(50)` | No | Default: `"Medium"`. Indexed. |
| `risk_reason` | `TEXT` | Yes | AI-generated |
| `root_cause` | `VARCHAR(150)` | Yes | AI-generated |
| `corrective_action` | `TEXT` | Yes | AI-generated |
| `preventive_action` | `TEXT` | Yes | AI-generated |
| `duplicate_probability` | `VARCHAR(50)` | No | Default: `"Unique"` |
| `complaint_status` | `VARCHAR(50)` | No | Default: `"Open"`. Indexed. |
| `created_at` | `TIMESTAMPTZ` | No | `server_default=now()` |
| `updated_at` | `TIMESTAMPTZ` | No | `server_default=now()`, `onupdate=now()` |

---

## SQLAlchemy Model

Defined in `backend/models/complaint.py`:

```python
class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # ... all other columns
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

---

## Migrations (Alembic)

Alembic is configured in `backend/alembic.ini`. Migration scripts live in `backend/migrations/versions/`.

### Run all migrations (fresh install)

```bash
cd backend
alembic upgrade head
```

### Generate a new migration after model changes

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

### Roll back one migration

```bash
alembic downgrade -1
```

---

## Database Setup (First Time)

```bash
# Create the database (run as postgres user or adjust credentials)
createdb complaint_qms

# Apply migrations
cd backend
alembic upgrade head
```

---

## Service Layer Operations

All database access goes through `backend/services/complaint_service.py`. Direct ORM calls never appear in routes or LangGraph nodes.

| Method | SQL |
|---|---|
| `save(db, payload)` | `INSERT INTO complaints ... RETURNING *` |
| `list_all(db)` | `SELECT * FROM complaints ORDER BY created_at DESC` |
| `get(db, id)` | `SELECT * FROM complaints WHERE id = ?` |
| `delete(db, id)` | `DELETE FROM complaints WHERE id = ?` |

All write operations wrap in a `db.commit()` + `db.refresh()` pattern. SQLAlchemy errors are caught and re-raised as `HTTPException(500)`.
