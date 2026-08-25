import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Save,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Hierarchy, RoadmapVersion, api } from '../api/client';

interface RoadmapReviewProps {
  hierarchy: Hierarchy;
  onBack: () => void;
  onRoadmapApproved: () => void;
}

export const RoadmapReview: React.FC<RoadmapReviewProps> = ({
  hierarchy,
  onBack,
  onRoadmapApproved,
}) => {
  const [latestRoadmap, setLatestRoadmap] = useState<RoadmapVersion | null>(null);
  const [categories, setCategories] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New category row modal/state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatAmount, setNewCatAmount] = useState<string>('');
  const [newCatProgress, setNewCatProgress] = useState<string>('');
  const [newCatUnit, setNewCatUnit] = useState<string>('percent');

  const fetchRoadmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const roadmap = await api.getLatestRoadmap(hierarchy.id);
      setLatestRoadmap(roadmap);
      if (roadmap && roadmap.extracted_json?.categories) {
        setCategories(roadmap.extracted_json.categories);
      } else {
        setCategories({});
      }
    } catch (err: any) {
      setError(err.message || 'No roadmap generated yet for this scheme');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [hierarchy.id]);

  const handleUpdateCategoryField = (catName: string, field: string, value: any) => {
    setCategories((prev) => ({
      ...prev,
      [catName]: {
        ...prev[catName],
        [field]: value,
      },
    }));
  };

  const handleDeleteCategory = (catName: string) => {
    setCategories((prev) => {
      const copy = { ...prev };
      delete copy[catName];
      return copy;
    });
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    setCategories((prev) => ({
      ...prev,
      [newCatName]: {
        amount: Number(newCatAmount) || 0,
        expected_progress: Number(newCatProgress) || 0,
        progress_unit: newCatUnit || 'percent',
        expected_range: [0, Number(newCatAmount) || 0],
      },
    }));
    setNewCatName('');
    setNewCatAmount('');
    setNewCatProgress('');
  };

  const handleSaveAndApprove = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.submitRoadmapReview(hierarchy.id, {
        edited_json: { categories },
      });
      setSuccessMsg('Roadmap baseline successfully approved & versioned!');
      await fetchRoadmap();
      setTimeout(() => {
        onRoadmapApproved();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save roadmap review');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryEntries = Object.entries(categories);
  const totalRoadmapBudget = categoryEntries.reduce((sum, [_, val]) => sum + Number(val?.amount || 0), 0);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Roadmap Human Review & Approval
              </h1>
              {latestRoadmap && (
                <span className="badge badge-info">v{latestRoadmap.version_no} Baseline</span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Scheme: <strong style={{ color: 'var(--text-secondary)' }}>{hierarchy.name}</strong> • AI Extracted Ground Truth
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAndApprove}
          disabled={submitting}
          className="btn btn-success"
        >
          <Save size={16} />
          <span>{submitting ? 'Saving & Finalizing...' : 'Approve Baseline'}</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            AI Baseline Calibration
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          The values below were extracted from the sanction plan document by Gemini / NVIDIA NIM.
          Review and calibrate category budgets, expected progress quantities, and units before this roadmap becomes the baseline against which all variance and anomaly layers evaluate.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scheme Sanction</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              ₹{Number(hierarchy.initial_budget).toLocaleString()}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Roadmapped Categories</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: totalRoadmapBudget > Number(hierarchy.initial_budget) ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
              ₹{totalRoadmapBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Table / Editor */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Budget Categories & Progress Quantities
        </h3>

        {categoryEntries.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No categories in this roadmap draft yet. Add one below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryEntries.map(([catName, catData]) => (
              <div
                key={catName}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr 140px 140px 40px',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Category</span>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{catName}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Expected Allocation (₹)</span>
                  <input
                    type="number"
                    value={catData?.amount ?? ''}
                    onChange={(e) => handleUpdateCategoryField(catName, 'amount', Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Expected Progress</span>
                  <input
                    type="number"
                    value={catData?.expected_progress ?? ''}
                    onChange={(e) => handleUpdateCategoryField(catName, 'expected_progress', Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Unit</span>
                  <input
                    type="text"
                    value={catData?.progress_unit ?? ''}
                    onChange={(e) => handleUpdateCategoryField(catName, 'progress_unit', e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(catName)}
                  title="Remove Category"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Category Row */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="New Category Name (e.g. equipment)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="input-field"
            style={{ width: '220px', fontSize: '0.85rem' }}
          />
          <input
            type="number"
            placeholder="Amount (₹)"
            value={newCatAmount}
            onChange={(e) => setNewCatAmount(e.target.value)}
            className="input-field"
            style={{ width: '160px', fontSize: '0.85rem' }}
          />
          <input
            type="number"
            placeholder="Progress (Qty)"
            value={newCatProgress}
            onChange={(e) => setNewCatProgress(e.target.value)}
            className="input-field"
            style={{ width: '140px', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            placeholder="Unit (e.g. km)"
            value={newCatUnit}
            onChange={(e) => setNewCatUnit(e.target.value)}
            className="input-field"
            style={{ width: '120px', fontSize: '0.85rem' }}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>
    </div>
  );
};
