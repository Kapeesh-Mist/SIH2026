import React from 'react';
import { ShieldCheck, Search, Bell, User } from 'lucide-react';
import { HealthStatus } from '../api/client';

interface AppHeaderProps {
  health: HealthStatus | null;
  isLoadingHealth: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ health, isLoadingHealth }) => {
  const isOnline = health?.status === 'healthy';

  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand Logo & Name */}
        <div className="logo-section">
          <div className="logo-badge">
            <ShieldCheck />
          </div>
          <div>
            <div className="brand-title">FinTrack</div>
            <div className="brand-subtitle">Public Fund Governance</div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="header-center">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search scheme, project ID, sanction order, or contractor..."
            />
          </div>
        </div>

        {/* Live System Status & User Profile */}
        <div className="header-right">
          {/* Backend Status Indicator */}
          <div
            className={`status-badge ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? `Backend Connected: ${health?.app_name} v${health?.version}` : 'Connecting to API server...'}
          >
            <span className="status-dot" />
            <span>{isLoadingHealth ? 'Checking...' : isOnline ? 'Backend Online' : 'Offline'}</span>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.65rem', borderRadius: '50%' }}
            title="Notifications & System Alerts"
          >
            <Bell size={16} />
          </button>

          {/* User Profile */}
          <div className="user-profile-badge">
            <div className="avatar-circle">
              <User size={16} />
            </div>
            <div className="user-info">
              <span className="user-name">Finance Controller</span>
              <span className="user-role">Ministry Auditor</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
