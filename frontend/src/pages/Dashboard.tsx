import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  FileText, 
  Server, 
  ArrowUpRight, 
  ShieldAlert 
} from 'lucide-react';
import { HealthStatus, ProjectSummary } from '../api/client';

// Initial foundation sample data
const INITIAL_PROJECTS: ProjectSummary[] = [
  {
    id: 'proj-001',
    project_code: 'NAT-INFRA-2026-001',
    title: 'National High-Speed Transit Corridor - Phase 2',
    department: 'Ministry of Road Transport and Highways',
    sanction_date: '2026-01-15',
    total_sanctioned_budget: 500000000.0,
    disbursed_budget: 320000000.0,
    utilized_budget: 248500000.0,
    status: 'IN_PROGRESS',
    progress_percentage: 58,
    active_anomalies: [
      {
        id: 'anom-101',
        type: 'RAPID_DEPLETION',
        severity: 'HIGH',
        description: 'Tunneling sub-project expense burn rate exceeds civil excavation progress by 28%',
        date_flagged: '2026-08-10',
      },
    ],
  },
  {
    id: 'proj-002',
    project_code: 'RUR-WTR-2026-042',
    title: 'Clean Tap Water Mission (Jal Jeevan) - Marathwada District',
    department: 'Department of Drinking Water & Sanitation',
    sanction_date: '2026-02-01',
    total_sanctioned_budget: 180000000.0,
    disbursed_budget: 120000000.0,
    utilized_budget: 95000000.0,
    status: 'IN_PROGRESS',
    progress_percentage: 72,
    active_anomalies: [],
  },
  {
    id: 'proj-003',
    project_code: 'HLT-MOD-2026-019',
    title: 'District Primary Health Center Digitization & ICU Upgrades',
    department: 'Ministry of Health & Family Welfare',
    sanction_date: '2026-03-10',
    total_sanctioned_budget: 95000000.0,
    disbursed_budget: 45000000.0,
    utilized_budget: 18200000.0,
    status: 'IN_PROGRESS',
    progress_percentage: 30,
    active_anomalies: [
      {
        id: 'anom-102',
        type: 'VENDOR_PRICE_DISCREPANCY',
        severity: 'MEDIUM',
        description: 'Invoice unit rate for Ventilator Unit Type-B exceeds Central GeM schedule by 14%',
        date_flagged: '2026-08-15',
      },
    ],
  },
];

interface DashboardProps {
  health: HealthStatus | null;
  isLoadingHealth: boolean;
  onRefreshHealth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ health, isLoadingHealth, onRefreshHealth }) => {
  const [projects] = useState<ProjectSummary[]>(INITIAL_PROJECTS);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const totalSanctioned = projects.reduce((acc, p) => acc + p.total_sanctioned_budget, 0);
  const totalDisbursed = projects.reduce((acc, p) => acc + p.disbursed_budget, 0);
  const totalUtilized = projects.reduce((acc, p) => acc + p.utilized_budget, 0);
  const totalAnomalies = projects.reduce((acc, p) => acc + (p.active_anomalies?.length || 0), 0);

  return (
    <div className="dashboard-page">
      {/* Top Banner & Actions */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Executive Fund & Project Governance</h1>
          <p className="page-subtitle">
            Hierarchical tracking, budget milestone utilization, and AI anomaly auditing
          </p>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-secondary" 
            onClick={onRefreshHealth}
            disabled={isLoadingHealth}
          >
            <RefreshCw size={15} className={isLoadingHealth ? 'spin' : ''} />
            Refresh Status
          </button>
          <button className="btn btn-primary">
            <FileText size={15} />
            Audit Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        {/* Metric 1 */}
        <div className="metric-card" style={{ '--card-accent': '#6366f1' } as React.CSSProperties}>
          <div className="metric-top">
            <span className="metric-title">Total Sanctioned Budget</span>
            <div className="metric-icon-box" style={{ color: '#818cf8' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalSanctioned)}</div>
          <div className="metric-footer">
            <span className="metric-trend-up">Across 3 Major Schemes</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="metric-card" style={{ '--card-accent': '#06b6d4' } as React.CSSProperties}>
          <div className="metric-top">
            <span className="metric-title">Disbursed Funds</span>
            <div className="metric-icon-box" style={{ color: '#22d3ee' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalDisbursed)}</div>
          <div className="metric-footer">
            <span>{((totalDisbursed / totalSanctioned) * 100).toFixed(1)}% of total sanction</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="metric-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
          <div className="metric-top">
            <span className="metric-title">Utilized (Verified Claims)</span>
            <div className="metric-icon-box" style={{ color: '#34d399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalUtilized)}</div>
          <div className="metric-footer">
            <span className="metric-trend-up">{((totalUtilized / totalDisbursed) * 100).toFixed(1)}% burn rate</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="metric-card" style={{ '--card-accent': '#f43f5e' } as React.CSSProperties}>
          <div className="metric-top">
            <span className="metric-title">AI Anomaly Alerts</span>
            <div className="metric-icon-box" style={{ color: '#fb7185' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#fb7185' }}>{totalAnomalies}</div>
          <div className="metric-footer">
            <span className="metric-trend-alert">Requires Auditor Review</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Main Projects Table + AI Risk Stream */}
      <div className="dashboard-columns">
        {/* Left Column: Projects Overview */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={20} style={{ color: 'var(--cyan-accent)' }} />
              Active Public Infrastructure Schemes
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {projects.length} Hierarchies
            </span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project & Code</th>
                  <th>Department</th>
                  <th>Sanctioned / Disbursed</th>
                  <th>Progress & Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id}>
                    <td>
                      <div className="project-name-cell">
                        <span className="project-title">{proj.title}</span>
                        <span className="project-code">{proj.project_code}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                      {proj.department}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(proj.total_sanctioned_budget)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Rel: {formatCurrency(proj.disbursed_budget)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                        <span>{proj.progress_percentage}% Physical</span>
                        <span style={{ color: 'var(--cyan-accent)' }}>
                          {((proj.utilized_budget / proj.disbursed_budget) * 100).toFixed(0)}% Util
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${proj.progress_percentage}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="status-badge online" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Anomaly Alerts & Backend Connection Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Anomaly Alerts Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <ShieldAlert size={20} style={{ color: 'var(--rose)' }} />
                AI Risk Alerts
              </div>
            </div>
            <div className="panel-body">
              <div className="alerts-list">
                {projects.flatMap(p => p.active_anomalies || []).map((alert) => (
                  <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                    <div className="alert-header">
                      <span className={`alert-tag ${alert.severity}`}>{alert.severity} RISK</span>
                      <span className="alert-time">{alert.date_flagged}</span>
                    </div>
                    <p className="alert-desc">{alert.description}</p>
                    <a href="#audit" style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Inspect audit records <ArrowUpRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backend Health Diagnostics Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Server size={18} style={{ color: 'var(--primary-light)' }} />
                Runtime Diagnostics
              </div>
            </div>
            <div className="panel-body">
              <div className="connection-info-card">
                <div className="connection-row">
                  <span className="connection-key">Backend Gateway</span>
                  <span className="connection-val" style={{ color: health ? 'var(--emerald)' : 'var(--rose)' }}>
                    {health ? 'FastAPI 0.1.0 (Online)' : 'Connecting / Offline'}
                  </span>
                </div>
                <div className="connection-row">
                  <span className="connection-key">Environment</span>
                  <span className="connection-val">{health?.environment || 'development'}</span>
                </div>
                <div className="connection-row">
                  <span className="connection-key">Database State</span>
                  <span className="connection-val">{health?.database || 'PostgreSQL 16'}</span>
                </div>
                <div className="connection-row">
                  <span className="connection-key">API Base URI</span>
                  <span className="connection-val">/api/v1/health</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
