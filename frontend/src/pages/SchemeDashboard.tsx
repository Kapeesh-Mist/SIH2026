import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  IndianRupee,
  Plus,
  ArrowLeft,
  Building2,
  Users,
  CheckCircle,
  FileCheck2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Hierarchy, Node, api, Alert } from '../api/client';
import { TreeView } from '../components/TreeView';
import { NodeDetail } from './NodeDetail';

interface SchemeDashboardProps {
  hierarchy: Hierarchy;
  onBack: () => void;
  onNavigateToRoadmap: () => void;
}

export const SchemeDashboard: React.FC<SchemeDashboardProps> = ({
  hierarchy,
  onBack,
  onNavigateToRoadmap,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add node modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [role, setRole] = useState<string>('');
  const [allocatedBudget, setAllocatedBudget] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  const [templateCategory, setTemplateCategory] = useState<string>('materials');
  const [submittingNode, setSubmittingNode] = useState<boolean>(false);

  const loadTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await api.getNodeTree(hierarchy.id);
      setNodes(tree);
      if (tree.length > 0 && !selectedNode) {
        setSelectedNode(tree[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hierarchy tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [hierarchy.id]);

  const handleOpenAddModal = (parent?: Node) => {
    setParentNode(parent || null);
    setRole('');
    setAllocatedBudget('');
    setJustification('');
    setShowAddModal(true);
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !allocatedBudget || Number(allocatedBudget) <= 0) {
      setError('Please provide role and a valid budget allocation');
      return;
    }

    setSubmittingNode(true);
    setError(null);

    try {
      const currentUser = api.getCurrentUser();
      const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

      if (parentNode) {
        // Submit request to parent
        await api.requestNewNode(parentNode.id, {
          role,
          allocated_budget: Number(allocatedBudget),
          template_category: templateCategory,
          justification_text: justification || `Sub-node allocation for ${role}`,
        });
      } else {
        // Direct root node creation
        await api.createNode({
          hierarchy_id: hierarchy.id,
          role,
          allocated_budget: Number(allocatedBudget),
          user_id: currentUserId,
        });
      }

      await loadTree();
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create node');
    } finally {
      setSubmittingNode(false);
    }
  };

  const totalAllocatedToNodes = nodes.reduce((sum, n) => sum + Number(n.allocated_budget || 0), 0);
  const remainingBudget = Math.max(0, Number(hierarchy.initial_budget) - totalAllocatedToNodes);

  return (
    <div style={{ padding: '32px', maxWidth: '1500px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-sm" title="Back to Portfolio">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {hierarchy.name}
              </h1>
              <span className="badge badge-info">{hierarchy.status}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Hierarchical Breakdown & Multi-Tier Audit View
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onNavigateToRoadmap} className="btn btn-secondary">
            <FileCheck2 size={16} color="var(--accent-cyan)" />
            <span>Review AI Roadmap</span>
          </button>
          <button onClick={() => handleOpenAddModal()} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Authority Node</span>
          </button>
        </div>
      </div>

      {/* Budget Summary Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Scheme Sanction Total
          </span>
          <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{Number(hierarchy.initial_budget).toLocaleString()}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Allocated Across Nodes
          </span>
          <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            ₹{totalAllocatedToNodes.toLocaleString()}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Unallocated Buffer
          </span>
          <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
            ₹{remainingBudget.toLocaleString()}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Registered Nodes
          </span>
          <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {nodes.length}
          </p>
        </div>
      </div>

      {/* Main Split Content: Left Tree vs Right Node Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Tree View Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderTree size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Hierarchy Structure
              </h3>
            </div>
            <button
              onClick={() => handleOpenAddModal()}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            >
              <Plus size={12} /> Root Node
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading hierarchy tree...
            </div>
          ) : (
            <TreeView
              nodes={nodes}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={(node) => setSelectedNode(node)}
              onRequestChildNode={(parent) => handleOpenAddModal(parent)}
            />
          )}
        </div>

        {/* Right: Selected Node Details & Ledger */}
        <div>
          {selectedNode ? (
            <NodeDetail
              node={selectedNode}
              hierarchy={hierarchy}
              onNodeUpdated={() => loadTree()}
            />
          ) : (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Building2 size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Select a Node to Inspect Ledger
              </h3>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Select any authority node in the tree to review expenses, upload receipts, and verify proofs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--gradient-brand)', color: '#fff' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {parentNode ? `Add Sub-Node under ${parentNode.role}` : 'Create Root Node'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sub-allocates sanctioned budget with multi-tier cumulative validation
                </p>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateNode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Node Role / Authority Title *
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. District Project Officer - Zone 1"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Allocated Budget (₹) *
                </label>
                <input
                  type="number"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="input-field"
                  required
                  min="1"
                />
              </div>

              {parentNode && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Template Category
                    </label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="input-field"
                    >
                      <option value="materials">Materials & Construction</option>
                      <option value="labour">Labour & Works</option>
                      <option value="equipment">Equipment & Supply</option>
                      <option value="transportation">Logistics & Supply</option>
                      <option value="administration">Admin Supervision</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Budget Split Justification (Layer 0 Check)
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Explain justification for this allocation..."
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNode}
                  className="btn btn-primary"
                >
                  {submittingNode ? 'Creating Node...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
