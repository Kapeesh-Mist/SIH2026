# FinTrack AI — Hierarchical Financial Monitoring & Fraud Surveillance Platform (SIH26102)

FinTrack AI is an end-to-end multi-tier public financial monitoring platform designed to enforce accountability, transparent budget cascading, automated OCR invoice extraction, and 4-layer AI anomaly detection across national and state schemes.

---

## 🏛️ System Architecture & Schema

The platform implements the multi-tier hierarchy model:

- **Users**: Authentication with bcrypt password hashing and optional masked Aadhaar references.
- **Hierarchies (Schemes)**: Root financial programs with sanctioned initial capital and baseline allocations.
- **Roadmap Versions**: AI-extracted ground truth baselines from uploaded sanction documents with human-in-the-loop review.
- **Nodes**: Authority tree nodes (e.g., Central Apex → State Directorate → District Project Office → Block Execution Unit) with strict budget split validation.
- **Node Creation Requests**: Lower-tier budget split requests requiring upper-tier consensus.
- **Expenses & Documents**: Claims with attached PDF/image vouchers processed via OCR and LLM data extraction.
- **Alerts**: Multi-tier anomaly flags across 4 independent detection layers.
- **Embeddings**: 384-dimensional vector representations for semantic duplicate document detection via pgvector.

---

## 🧠 AI & LLM Engine

### Multi-Tier Anomaly Detection Layers (0–4)
1. **Layer 0 (Legitimacy)**: Rule-based and text plausibility check during sub-node budget allocation.
2. **Layer 1 (Variance)**: Real-time expenditure-to-progress ratio comparison against the approved roadmap baseline.
3. **Layer 2 (Peer Comparison)**: Outlier detection comparing expenditure velocity across sibling nodes at the same tier.
4. **Layer 3 (Duplicate & Ghost Detection)**: Exact hash & vector cosine similarity for duplicate invoices + fuzzy matching for ghost contractors.
5. **Layer 4 (Unsupervised ML)**: Multi-feature isolation forest anomaly scoring across the scheme.

### Dual LLM Integration (Gemini + NVIDIA NIM Fallback)
All OCR document parsing and roadmap blueprint extraction use **Google Gemini API** (`gemini-1.5-flash`) as the primary engine, with an automatic fallback to **NVIDIA NIM API** (`meta/llama-3.1-70b-instruct`) if rate limits or network issues occur.

---

## 🚀 Quickstart & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL database (Supabase or local Postgres)

---

### Step 1: Backend Setup & Launch

1. Open a terminal and navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```

2. Activate the virtual environment:
   - **Windows PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```

3. Ensure dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file (already configured with database connection):
   ```env
   # Database
   database_url=postgresql://postgres.hewyofebvuvnxjlinfwd:Sih2026gk.!@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres

   # Auth
   jwt_secret=superrrrrrsectretttttkey
   jwt_algorithm=HS256
   access_token_expire_minutes=1440

   # LLM API Keys (Gemini with NVIDIA NIM Fallback)
   gemini_api_key=YOUR_GEMINI_API_KEY
   gemini_model=gemini-1.5-flash
   nvidia_api_key=YOUR_NVIDIA_API_KEY
   nvidia_model=meta/llama-3.1-70b-instruct
   ```

5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Swagger API Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### Step 2: Seed Demo Synthetic Scheme & Anomalies

To populate the database with a pre-configured multi-tier hierarchy, sample expenses, and simulated fraud anomalies across all 4 AI layers, run:

```powershell
python ..\seed-data\generate_synthetic_scheme.py
```

**Default Admin Credentials:**
- **Email:** `admin@sih26102.gov.in`
- **Password:** `password123`

---

### Step 3: Frontend Setup & Launch

1. Open a second terminal and navigate to the `frontend/` directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 💻 Frontend Views & Capabilities

- **Login / Register**: Secure authentication with JWT token management and masked Aadhaar support.
- **Schemes Portfolio (`/`)**: National program overview, total sanctioned budgets, search filters, and new scheme creation with plan document attachment.
- **Hierarchy Command Center**: Interactive tree visualization of authority nodes, allocated buffers, and sub-tier allocation requests.
- **Node Ledger & Claim Inspector**: Upload invoices/claims, trigger automatic OCR data parsing, and sign-off / reject proof documents.
- **Roadmap Review**: Human-in-the-loop review interface to verify and calibrate AI-extracted milestone baselines.
- **AI Anomaly Feed**: Real-time ticker of Layer 0–4 risk flags, severity levels (Info, Warning, Critical), and resolution workflows.

---

## 📦 Project Structure

```
SIH2026/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint & router registry
│   │   ├── config.py              # Pydantic Settings & environment loader
│   │   ├── db/session.py          # SQLAlchemy session engine
│   │   ├── models/                # User, Hierarchy, Node, Expense, Alert, Document models
│   │   ├── schemas/               # Pydantic v2 validation schemas
│   │   ├── api/routes/            # Auth, Hierarchies, Nodes, Expenses, Alerts, Verification
│   │   ├── services/
│   │   │   ├── llm.py             # Gemini -> NVIDIA NIM dual fallback service
│   │   │   ├── document_parsing.py# OCR & invoice field extraction
│   │   │   ├── roadmap_extraction.py # Blueprint roadmap parsing
│   │   │   └── budget_validation.py  # Cumulative budget split checks
│   │   └── ai/
│   │       ├── detection_engine.py# Anomaly Detection Orchestrator
│   │       ├── layer1_variance.py # Variance from baseline
│   │       ├── layer2_peer_comparison.py # Peer node comparison
│   │       ├── layer3_duplicate_ghost.py # Duplicate invoices & ghost workers
│   │       └── layer4_unsupervised.py    # Isolation Forest ML detection
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/                 # Login, Dashboard, SchemeDashboard, NodeDetail, RoadmapReview
│   │   ├── components/            # TreeView, AlertsPanel, ExpenseUploadForm, DocumentCard, Sidebar
│   │   ├── api/client.ts          # Typed fetch client
│   │   └── styles/index.css       # Design tokens & glassmorphic aesthetics
│   └── vite.config.ts
├── ai/
│   └── embeddings/embed_utils.py  # SentenceTransformers & cosine similarity
├── seed-data/
│   └── generate_synthetic_scheme.py # Synthetic tree & anomaly generator
└── README.md
```