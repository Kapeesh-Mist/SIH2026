import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Filter,
  Layers,
  Sparkles,
  Info,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Alert } from '../api/client';

interface AlertsPanelProps {
  alerts: Alert[];
  onResolveAlert: (alertId: string) => Promise<void>;
  loading?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onResolveAlert,
  loading = false,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedLayer !== 'all' && a.layer !== selectedLayer) return false;
    if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) return false;
    return true;
  });

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolveAlert(id);
    } finally {
      setResolvingId(null);
    }
  };

  const getLayerBadge = (layer: string) => {
    switch (layer) {
      case 'layer0':
        return { label: 'L0 Legitimacy', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
      case 'layer1':
        return { label: 'L1 Variance', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
      case 'layer2':
        return { label: 'L2 Peer Comp', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
      case 'layer3':
        return { label: 'L3 Dup/Ghost/Delay', bg: 'rgba(244, 63, 94, 0.15)', color: '#f87171' };
      case 'layer4':
        return { label: 'L4 ML Isolation Forest', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
      default:
        return { label: layer, bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              AI Anomaly & Risk Detection Engine
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Multi-Tier fraud, duplicate invoice, and budget variance watchdog
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
          >
            <option value="all">All Layers (0-4)</option>
            <option value="layer0">Layer 0 (Legitimacy)</option>
            <option value="layer1">Layer 1 (Variance)</option>
            <option value="layer2">Layer 2 (Peer Comparison)</option>
            <option value="layer3">Layer 3 (Duplicate/Ghost)</option>
            <option value="layer4">Layer 4 (Unsupervised ML)</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 12px', color: 'var(--accent-emerald)', opacity: 0.8 }} />
          <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>All Clear! No Active Anomalies</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            All multi-tier expenditure logs and progress documents match baseline constraints.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAlerts.map((alert) => {
            const layerInfo = getLayerBadge(alert.layer);
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: alert.resolved
                    ? 'rgba(30, 41, 59, 0.3)'
                    : isCritical
                    ? 'rgba(244, 63, 94, 0.08)'
                    : isWarning
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(56, 189, 248, 0.08)',
                  border: `1px solid ${
                    alert.resolved
                      ? 'rgba(255, 255, 255, 0.05)'
                      : isCritical
                      ? 'rgba(244, 63, 94, 0.3)'
                      : isWarning
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(56, 189, 248, 0.3)'
                  }`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  opacity: alert.resolved ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div
                    style={{
                      padding: '6px',
                      borderRadius: '8px',
                      background: alert.resolved
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isCritical
                        ? 'rgba(244, 63, 94, 0.2)'
                        : isWarning
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(56, 189, 248, 0.2)',
                      color: alert.resolved
                        ? 'var(--accent-emerald)'
                        : isCritical
                        ? 'var(--accent-rose)'
                        : isWarning
                        ? 'var(--accent-amber)'
                        : 'var(--accent-cyan)',
                      marginTop: '2px',
                    }}
                  >
                    {alert.resolved ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: layerInfo.bg,
                          color: layerInfo.color,
                        }}
                      >
                        {layerInfo.label}
                      </span>

                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>

                      {alert.resolved && <span className="badge badge-success">Resolved</span>}

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.4 }}>
                      {alert.message}
                    </p>

                    {alert.escalated_to_node_id && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={12} /> Escalated to authority node {alert.escalated_to_node_id}
                      </p>
                    )}
                  </div>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {resolvingId === alert.id ? 'Resolving...' : 'Acknowledge / Resolve'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
