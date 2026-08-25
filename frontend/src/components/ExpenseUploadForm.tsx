import React, { useState } from 'react';
import {
  Upload,
  IndianRupee,
  FileText,
  Percent,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api, Expense } from '../api/client';

interface ExpenseUploadFormProps {
  nodeId: string;
  onSuccess: (expense: Expense) => void;
  onCancel?: () => void;
}

export const ExpenseUploadForm: React.FC<ExpenseUploadFormProps> = ({
  nodeId,
  onSuccess,
  onCancel,
}) => {
  const [category, setCategory] = useState<string>('materials');
  const [amount, setAmount] = useState<string>('');
  const [progressValue, setProgressValue] = useState<string>('');
  const [progressUnit, setProgressUnit] = useState<string>('percent');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }
    if (!file) {
      setError('Please attach an evidencing bill/invoice or completion certificate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('amount', amount);
      if (progressValue) {
        formData.append('progress_value', progressValue);
        formData.append('progress_unit', progressUnit);
      }
      formData.append('file', file);

      const res = await api.uploadExpense(nodeId, formData);
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit expense record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Upload size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Log Node Expenditure & Evidence
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Uploaded documents undergo automatic OCR and AI data verification
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--accent-rose)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
            required
          >
            <option value="materials">Materials & Goods</option>
            <option value="labour">Labour & Contractor Charges</option>
            <option value="equipment">Equipment & Machinery</option>
            <option value="transportation">Transport & Logistics</option>
            <option value="administration">Admin & Contingency</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Amount (INR ₹) *
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 250000"
              className="input-field"
              style={{ paddingLeft: '28px' }}
              required
              min="1"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Progress Accomplished (Optional)
          </label>
          <input
            type="number"
            value={progressValue}
            onChange={(e) => setProgressValue(e.target.value)}
            placeholder="e.g. 15"
            className="input-field"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Unit of Progress
          </label>
          <input
            type="text"
            value={progressUnit}
            onChange={(e) => setProgressUnit(e.target.value)}
            placeholder="e.g. percent, km, units"
            className="input-field"
          />
        </div>
      </div>

      {/* File Upload Box */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Proof Document (PDF or Photo Invoice) *
        </label>
        <div
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 16px',
            textAlign: 'center',
            background: 'rgba(30, 41, 59, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
          <FileText size={32} style={{ margin: '0 auto 8px', color: 'var(--accent-cyan)' }} />
          {file ? (
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--accent-emerald)' }}>
                ✓ Selected: {file.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Click or drag invoice to upload
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Supports PDF invoices, GST vouchers, and scanned receipts
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary">
          <Sparkles size={16} />
          {loading ? 'Processing OCR & AI Verification...' : 'Submit & Analyze'}
        </button>
      </div>
    </form>
  );
};
