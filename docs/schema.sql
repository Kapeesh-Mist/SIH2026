-- FinTrack Public Fund Tracking Relational Schema
-- Target: PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations / Ministries / Departments
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Central Ministry, State Department, Municipal Corp
    parent_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hierarchical Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    parent_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sanction_order_number VARCHAR(100),
    sanction_date DATE,
    start_date DATE,
    target_completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
    total_sanctioned_budget NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    disbursed_budget NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    utilized_budget NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Budget Allocations & Tranches
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(20) NOT NULL, -- e.g., 2026-2027
    tranche_number INT NOT NULL DEFAULT 1,
    allocated_amount NUMERIC(18, 2) NOT NULL,
    release_date DATE NOT NULL,
    utilization_deadline DATE,
    conditions_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Milestones / Roadmaps
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    allocated_weightage NUMERIC(5, 2) DEFAULT 0.00, -- percentage
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, DELAYED
    completion_percentage INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Expense Records & Invoices
CREATE TABLE IF NOT EXISTS expense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_gstin VARCHAR(50),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    claim_amount NUMERIC(18, 2) NOT NULL,
    approved_amount NUMERIC(18, 2) DEFAULT 0.00,
    category VARCHAR(100) NOT NULL, -- Civil Works, Procurement, Manpower, Contingency
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, FLAGGED, REJECTED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Supporting Expense Documents (OCR/AI Parsing)
CREATE TABLE IF NOT EXISTS expense_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_record_id UUID REFERENCES expense_records(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_hash_sha256 VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    ocr_extracted_text TEXT,
    ai_extracted_metadata JSONB,
    confidence_score NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Verification Workflows & Audit Logs
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_record_id UUID NOT NULL REFERENCES expense_records(id) ON DELETE CASCADE,
    officer_id UUID, -- References user
    officer_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- APPROVED, REJECTED, REQUESTED_CLARIFICATION, ESCALATED
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Anomaly & Risk Alerts
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expense_record_id UUID REFERENCES expense_records(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL, -- BUDGET_OVERRUN, DUPLICATE_INVOICE, VENDOR_MISMATCH, RAPID_DEPLETION
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    ai_risk_score NUMERIC(5, 2),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_expense_project ON expense_records(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_status ON expense_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON anomaly_alerts(severity, is_resolved);
