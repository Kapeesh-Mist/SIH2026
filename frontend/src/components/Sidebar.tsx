import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  AlertTriangle,
  FileCheck2,
  LogOut,
  ShieldAlert,
  Layers,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { User, Hierarchy } from '../api/client';

interface SidebarProps {
  currentTab: 'dashboard' | 'scheme' | 'roadmap' | 'alerts';
  setCurrentTab: (tab: 'dashboard' | 'scheme' | 'roadmap' | 'alerts') => void;
  user: User | null;
  onLogout: () => void;
  hierarchies: Hierarchy[];
  selectedHierarchyId: string | null;
  onSelectHierarchy: (id: string) => void;
  unresolvedAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  hierarchies,
  selectedHierarchyId,
  onSelectHierarchy,
  unresolvedAlertsCount = 0,
}) => {
  return (
    <aside
      style={{
        width: '280px',
        minHeight: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
          }}
        >
          <ShieldAlert size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
            FinTrack <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            SIH26102 Multi-Tier Monitor
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '0 12px 6px',
            fontWeight: '700',
          }}
        >
          Platform Views
        </p>

        <button
          onClick={() => setCurrentTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: currentTab === 'dashboard' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: currentTab === 'dashboard' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontWeight: currentTab === 'dashboard' ? '600' : '500',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
        >
          <LayoutDashboard size={18} />
          <span>Schemes Portfolio</span>
        </button>

        <button
          onClick={() => setCurrentTab('scheme')}
          disabled={!selectedHierarchyId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: currentTab === 'scheme' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: currentTab === 'scheme' ? 'var(--accent-cyan)' : selectedHierarchyId ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: currentTab === 'scheme' ? '600' : '500',
            cursor: selectedHierarchyId ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            opacity: selectedHierarchyId ? 1 : 0.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FolderTree size={18} />
            <span>Hierarchy Tree</span>
          </div>
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => setCurrentTab('roadmap')}
          disabled={!selectedHierarchyId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: currentTab === 'roadmap' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: currentTab === 'roadmap' ? 'var(--accent-cyan)' : selectedHierarchyId ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: currentTab === 'roadmap' ? '600' : '500',
            cursor: selectedHierarchyId ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            opacity: selectedHierarchyId ? 1 : 0.6,
          }}
        >
          <FileCheck2 size={18} />
          <span>Roadmap Review</span>
        </button>

        <button
          onClick={() => setCurrentTab('alerts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: currentTab === 'alerts' ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
            color: currentTab === 'alerts' ? 'var(--accent-rose)' : 'var(--text-secondary)',
            fontWeight: currentTab === 'alerts' ? '600' : '500',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} />
            <span>Anomaly Alerts</span>
          </div>
          {unresolvedAlertsCount > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                color: 'var(--accent-rose)',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(244, 63, 94, 0.3)',
              }}
            >
              {unresolvedAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* Scheme Quick Switcher */}
      {hierarchies.length > 0 && (
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Layers size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '700' }}>
              Active Schemes ({hierarchies.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {hierarchies.map((h) => {
              const isSelected = h.id === selectedHierarchyId;
              return (
                <div
                  key={h.id}
                  onClick={() => onSelectHierarchy(h.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Budget: ₹{Number(h.initial_budget).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Profile & Logout */}
      <div
        style={{
          marginTop: 'auto',
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <UserIcon size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Authority User'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
