# FinTrack 🏛️💼

> **Intelligent Public Fund & Hierarchical Project Tracking Platform**

FinTrack is an enterprise-grade platform engineered to provide end-to-end transparency, auditability, and governance for hierarchical government and public sector infrastructure projects. It integrates budget allocations, real-time expense ingestion, milestone tracking, multi-tier verification workflows, and AI-assisted document parsing with anomaly detection.

---

## 🏗️ Architecture Overview

```
               ┌──────────────────────────────┐
               │    React + TypeScript UI     │ (Port: 5173)
               │    (Vite / Tailwind / CSS)   │
               └──────────────┬───────────────┘
                              │ REST API
                              ▼
               ┌──────────────────────────────┐
               │      FastAPI Backend         │ (Port: 8000)
               │  (Python 3.11+, SQLAlchemy)  │
               └───────┬──────────────┬───────┘
                       │              │
        ┌──────────────▼───┐     ┌────▼─────────────────┐
        │  PostgreSQL 16   │     │ AI Document & Anomaly│
        │  (AsyncPG / ORM) │     │ Detection Engine     │
        └──────────────────┘     └──────────────────────┘
```

---

## 📁 Repository Structure

```
sih26102-fintrack/
├── backend/                  # FastAPI Application, SQLAlchemy ORM, routes & tests
│   ├── app/
│   │   ├── api/              # API endpoints, dependencies & routes
│   │   ├── core/             # App configs & security
│   │   ├── db/               # Database engine & session managers
│   │   ├── models/           # Declarative DB models
│   │   ├── schemas/          # Pydantic schemas / DTOs
│   │   ├── services/         # Business logic layer
│   │   └── ai/               # Backend AI service connectors
│   ├── tests/                # Pytest automated test suite
│   ├── requirements.txt      # Core Python dependencies
│   ├── requirements-dev.txt  # Dev/test Python dependencies
│   └── Dockerfile
├── frontend/                 # React 18+, TypeScript, Vite modern frontend
│   ├── src/
│   │   ├── api/              # Axios / API client
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # View pages (Dashboard, Projects, etc.)
│   │   └── styles/           # Modern design tokens & global CSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── ai/                       # Machine learning workspace & prompt engineering
│   ├── notebooks/            # Jupyter notebooks for document OCR & anomaly models
│   ├── prompts/              # Production prompt templates for LLM extraction
│   └── embeddings/           # Vector embeddings & cosine similarity utilities
├── seed-data/                # Mock public project data & sample schemas
│   └── sample_projects.json
├── docs/                     # Specifications, DB Schema, API contracts
│   ├── schema.sql
│   ├── architecture.md
│   └── API_CONTRACT.md
├── .github/                  # CI/CD workflows & PR templates
├── docker-compose.yml        # Multi-container orchestration
├── .env.example              # Environment variables template
├── Makefile                  # Developer workflow automation
└── README.md
```

---

## 🚀 Quickstart

### Option 1: Docker Compose (Recommended)

1. **Clone & setup environment**:
   ```bash
   cp .env.example .env
   ```

2. **Launch all services**:
   ```bash
   docker compose up --build
   ```

3. **Access applications**:
   - **Frontend UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Alternative API Docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Option 2: Local Development

#### 1. Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Run backend test suite
pytest -v

# Run backend development server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

```bash
# Backend pytest suite
make test

# Or directly in backend/
cd backend && pytest
```

---

## 📄 License & Team
Developed for Smart India Hackathon (SIH 2026).