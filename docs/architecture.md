# FinTrack System Architecture

## 1. High-Level Architecture

FinTrack is structured into modular layers designed for high reliability, scalability, security, and auditable public finance management.

```
+-------------------------------------------------------------+
|                      Client Layer                           |
|  React 18 + TypeScript + Vite Dashboard (Tailwind/CSS)      |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST API
                               v
+-------------------------------------------------------------+
|                    API Gateway & Application                |
|  FastAPI (Python 3.11+)                                      |
|  - Dependency Injection (Database Sessions, Configs, Auth)  |
|  - Pydantic v2 Input/Output Validation                      |
|  - Role-Based Access Control (Admin, Auditor, Officer)      |
|  - Async Route Handlers & Task Management                   |
+---------------+-----------------------------+---------------+
                |                             |
                v                             v
+-------------------------------+  +--------------------------+
|      Data Persistence         |  |   AI & Analytics Engine  |
|  PostgreSQL 16 Relational DB  |  | - OCR & Document Parsing |
|  - Hierarchical Projects      |  | - Anomaly Scoring Engine |
|  - Budget Tranches & Expenses |  | - Embedding Search / RAG |
|  - Audit Trails & Logs        |  | - LLM Milestone Extract  |
+-------------------------------+  +--------------------------+
```

---

## 2. Core Modules

### 2.1 Project Hierarchy Engine
- Enables multi-tier project structuring (e.g. Central Scheme -> State Mission -> District Implementation -> Specific Contractor Package).
- Tracks cascading budget sanctions, release tranches, and utilization metrics in real time.

### 2.2 Expense Ingestion & Verification Pipeline
- Handles invoice & expense claim submission with metadata (vendor, GSTIN, invoice date, claim amount).
- Multi-tier verification workflow: Field Officer -> Finance Officer -> Approving Authority.
- Immutable audit log records every transition, rejection, and approval with timestamped actor metadata.

### 2.3 AI-Assisted Document Parsing & Anomaly Detection
- **Document Parsing**: Extracts structured billing metadata, line items, and invoice dates from scanned PDF/image receipts.
- **Anomaly Detection**: Flags suspicious patterns:
  - Unusually rapid budget burn rates.
  - Duplicate or near-duplicate invoice submissions.
  - Deviation between milestone completion progress and claim percentages.
  - Price anomalies against standard government schedule of rates (SoR).

---

## 3. Security & Compliance
- **Data Protection**: Encrypted database connections (TLS/SSL) and hashed sensitive metadata.
- **Auditability**: Non-destructive logging of all verification actions and budget reallocations.
- **Access Control**: Role-based access control (RBAC) ensuring isolation across departments and organizational hierarchies.
