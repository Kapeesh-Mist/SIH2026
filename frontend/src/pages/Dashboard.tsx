import React, { useState } from 'react';
import {
  Plus,
  Layers,
  IndianRupee,
  Calendar,
  AlertTriangle,
  FolderTree,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Hierarchy, api } from '../api/client';

interface DashboardProps {
  hierarchies: Hierarchy[];
  onSelectHierarchy: (id: string) => void;
  onRefreshHierarchies: () => Promise<void>;
  unresolvedAlertsCount?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  hierarchies,
  onSelectHierarchy,
  onRefreshHierarchies,
  unresolvedAlertsCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [initialBudget, setInitialBudget] = useState<string>('');
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filteredHierarchies = hierarchies.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSanctionedBudget = hierarchies.reduce((acc, h) => acc + Number(h.initial_budget || 0), 0);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !initialBudget || Number(initialBudget) <= 0) {
      setError('Please fill in scheme title and valid initial budget');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('initial_budget', initialBudget);
      if (planFile) {
        formData.append('file', planFile);
      }

      await api.createHierarchy(formData);
      await onRefreshHierarchies();
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setInitialBudget('');
      setPlanFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create scheme');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner / Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            National Scheme Monitoring Portfolio
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time multi-tier budget tracing, AI OCR parsing, and anomaly surveillance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>New Financial Scheme</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Sanctioned Capital</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '12px' }}>
            ₹{totalSanctionedBudget.toLocaleString()}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} /> Across {hierarchies.length} active government programs
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Monitored Schemes</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
              <Layers size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '12px' }}>
            {hierarchies.length}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hierarchical multi-tier trees active
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Anomaly Flags</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-rose)', marginTop: '12px' }}>
            {unresolvedAlertsCount}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Flagged across 4 AI detection layers
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemes by title or description..."
            className="input-field"
            style={{ paddingLeft: '42px' }}
          />
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredHierarchies.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
            <Layers size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>No Schemes Found</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '400px', margin: '6px auto 16px' }}>
              Create a new scheme and upload its sanction blueprint to automatically extract the AI roadmap baseline.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} /> Create Scheme
            </button>
          </div>
        ) : (
          filteredHierarchies.map((h) => (
            <div
              key={h.id}
              onClick={() => onSelectHierarchy(h.id)}
              className="glass-panel glass-panel-interactive"
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-info">{h.status || 'Active'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {h.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {h.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sanctioned Budget
                  </span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                    ₹{Number(h.initial_budget).toLocaleString()}
                  </p>
                </div>

                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Scheme Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--gradient-brand)', color: '#fff' }}>
                <Layers size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Create New Financial Scheme
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Attach the plan PDF to trigger Gemini / NVIDIA NIM roadmap extraction
                </p>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateScheme} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Scheme Title / Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. National Rural Drinking Water Program"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Total Sanctioned Initial Budget (₹) *
                </label>
                <input
                  type="number"
                  value={initialBudget}
                  onChange={(e) => setInitialBudget(e.target.value)}
                  placeholder="e.g. 50000000"
                  className="input-field"
                  required
                  min="1"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Scheme Scope & Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key milestones, departmental objectives..."
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Sanction Document / Plan Blueprint (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPlanFile(e.target.files?.[0] || null)}
                  className="input-field"
                  style={{ padding: '8px' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Optional: AI will extract expected category allocations and progress units automatically.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  <Sparkles size={16} />
                  {submitting ? 'Creating & Extracting...' : 'Create & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
