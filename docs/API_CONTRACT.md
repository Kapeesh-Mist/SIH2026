# FinTrack API Contract Specification

Base URL: `/api/v1`

---

## 1. System & Health Endpoints

### `GET /health`
Returns runtime status, version, and component health.

- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "app_name": "FinTrack",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-08-24T22:00:00Z",
  "database": "connected"
}
```

### `GET /ready`
Readiness probe for container orchestration / Kubernetes.

- **Response `200 OK`**:
```json
{
  "ready": true,
  "services": {
    "database": true,
    "cache": true
  }
}
```

---

## 2. Projects Endpoints (Contract Preview)

### `GET /projects`
Retrieve list of hierarchical public projects with budget rollups.

- **Query Parameters**:
  - `organization_id` (optional, UUID)
  - `status` (optional, string: `PLANNED`, `IN_PROGRESS`, `COMPLETED`)
  - `page` (optional, int, default: 1)
  - `limit` (optional, int, default: 20)

- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "7b0a1d82-823b-4172-b5e1-5e82f7c001a1",
      "project_code": "MH-WTR-2026-01",
      "title": "Smart Rural Water Supply Grid - Phase 1",
      "organization_name": "Ministry of Jal Shakti",
      "status": "IN_PROGRESS",
      "total_sanctioned_budget": 125000000.00,
      "disbursed_budget": 80000000.00,
      "utilized_budget": 52400000.00,
      "completion_percentage": 65
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### `POST /projects`
Create a new project entry.

- **Request Body**:
```json
{
  "project_code": "MH-WTR-2026-02",
  "title": "Solar Pumping Sub-Station Package",
  "organization_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parent_project_id": "7b0a1d82-823b-4172-b5e1-5e82f7c001a1",
  "sanction_order_number": "SO/2026/JS/881",
  "total_sanctioned_budget": 35000000.00,
  "start_date": "2026-09-01",
  "target_completion_date": "2027-03-31"
}
```

---

## 3. Expenses & Verification Endpoints (Contract Preview)

### `POST /expenses`
Submit an expense claim with supporting document.

### `POST /expenses/{id}/verify`
Perform verification action (Approve, Reject, Flag).

- **Request Body**:
```json
{
  "action": "APPROVED",
  "approved_amount": 1250000.00,
  "remarks": "Invoices and physical progress cross-verified with field measurement book."
}
```

---

## 4. Anomaly Alerts Endpoints (Contract Preview)

### `GET /alerts`
Retrieve active risk and anomaly alerts detected by the AI rule engine.
