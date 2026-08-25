import React, { useState } from 'react';
import {
  FileCheck,
  FileX,
  FileText,
  Calendar,
  UserCheck,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Document } from '../api/client';

interface DocumentCardProps {
  document: Document;
  onVerify?: (docId: string) => Promise<void>;
  onReject?: (docId: string, reason: string) => Promise<void>;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onVerify,
  onReject,
}) => {
  const [showParsed, setShowParsed] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleVerify = async () => {
    if (!onVerify) return;
    setLoading(true);
    try {
      await onVerify(document.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectReason) return;
    setLoading(true);
    try {
      await onReject(document.id, rejectReason);
      setRejecting(false);
    } finally {
      setLoading(false);
    }
  };

  const isVerified = Boolean(document.verified_by);

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(30, 41, 59, 0.45)',
        border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: isVerified ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {document.doc_type.toUpperCase()} Proof Document
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Uploaded on {new Date(document.uploaded_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          {isVerified ? (
            <span className="badge badge-success">
              <UserCheck size={12} /> Verified
            </span>
          ) : (
            <span className="badge badge-warning">Pending Review</span>
          )}
        </div>
      </div>

      {/* AI Parsed Data Preview */}
      {document.parsed_data && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            onClick={() => setShowParsed(!showParsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: '600',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Parsed Extracted Metadata
            </span>
            {showParsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>

          {showParsed && (
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                marginTop: '8px',
                overflowX: 'auto',
                padding: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
              }}
            >
              {JSON.stringify(document.parsed_data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Verification Actions */}
      {!isVerified && onVerify && onReject && (
        <div>
          {!rejecting ? (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejecting(true)}
                disabled={loading}
                className="btn btn-danger btn-sm"
              >
                <FileX size={14} /> Reject
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="btn btn-success btn-sm"
              >
                <FileCheck size={14} /> Verify & Confirm
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '8px' }}>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason / remarks..."
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '6px 10px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading || !rejectReason}
                  className="btn btn-danger btn-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
