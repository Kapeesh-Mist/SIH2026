import React, { useState, useEffect } from 'react';
import {
  Building2,
  IndianRupee,
  Upload,
  FileCheck2,
  AlertTriangle,
  FileText,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Node, Hierarchy, Expense, Document, api, Alert } from '../api/client';
import { ExpenseUploadForm } from '../components/ExpenseUploadForm';
import { DocumentCard } from '../components/DocumentCard';

interface NodeDetailProps {
  node: Node;
  hierarchy: Hierarchy;
  onNodeUpdated: () => void;
}

export const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  hierarchy,
  onNodeUpdated,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [nodeAlerts, setNodeAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNodeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const exps = await api.getNodeExpenses(node.id);
      setExpenses(exps);

      const alerts = await api.getAlerts({ node_id: node.id });
      setNodeAlerts(alerts);
    } catch (err: any) {
      setError(err.message || 'Failed to load node ledger details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNodeData();
    setShowUploadForm(false);
  }, [node.id]);

  const handleExpenseSuccess = async (newExpense: Expense) => {
    setShowUploadForm(false);
    await loadNodeData();
    onNodeUpdated();
  };

  const handleVerifyDocument = async (docId: string) => {
    await api.verifyDocument(docId);
    await loadNodeData();
    onNodeUpdated();
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    await api.rejectDocument(docId, reason);
    await loadNodeData();
    onNodeUpdated();
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const budgetUtilization = Number(node.allocated_budget) > 0
    ? (totalSpent / Number(node.allocated_budget)) * 100
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Node Header Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
              }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {node.role}
                </h2>
                <span className="badge badge-info">{node.status}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Node Path: <strong style={{ color: 'var(--text-secondary)' }}>{node.path}</strong> • ID: {node.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="btn btn-primary"
          >
            <Upload size={16} />
            <span>{showUploadForm ? 'Close Form' : 'Log Expenditure'}</span>
          </button>
        </div>

        {/* Financial Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Allocated Budget
            </span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
              ₹{Number(node.allocated_budget).toLocaleString()}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Claimed Expenditure
            </span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: totalSpent > Number(node.allocated_budget) ? 'var(--accent-rose)' : 'var(--accent-cyan)', marginTop: '2px' }}>
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Utilization
            </span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: budgetUtilization > 90 ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginTop: '2px' }}>
              {budgetUtilization.toFixed(1)}%
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Node Alerts
            </span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: nodeAlerts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '2px' }}>
              {nodeAlerts.filter(a => !a.resolved).length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '16px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, budgetUtilization)}%`,
              background: budgetUtilization > 100 ? 'var(--accent-rose)' : 'var(--gradient-brand)',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Upload Form (when triggered) */}
      {showUploadForm && (
        <ExpenseUploadForm
          nodeId={node.id}
          onSuccess={handleExpenseSuccess}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Expenses Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Expenditure Claims & Proof Log ({expenses.length})
            </h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading expenditures...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.88rem', fontWeight: '500' }}>No expenditure records submitted yet for this node.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
              Click "Log Expenditure" above to upload an invoice or milestone proof.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {exp.category.toUpperCase()}
                      </h4>
                      <span
                        className={`badge ${
                          exp.status === 'verified'
                            ? 'badge-success'
                            : exp.status === 'rejected'
                            ? 'badge-critical'
                            : 'badge-warning'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Claim: <strong style={{ color: 'var(--text-primary)' }}>₹{Number(exp.amount).toLocaleString()}</strong>
                      </span>
                      {exp.progress_value && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                          • Progress: {exp.progress_value} {exp.progress_unit || ''}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        • {new Date(exp.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleVerifyDocument(exp.id)}
                    className="btn btn-success btn-sm"
                    title="Upper Node Sign-off"
                  >
                    <CheckCircle size={13} /> Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
