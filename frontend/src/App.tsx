import React, { useState, useEffect } from 'react';
import { api, User, Hierarchy, Alert } from './api/client';
import { Sidebar } from './components/Sidebar';
import { AlertsPanel } from './components/AlertsPanel';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SchemeDashboard } from './pages/SchemeDashboard';
import { RoadmapReview } from './pages/RoadmapReview';
import './styles/index.css';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'scheme' | 'roadmap' | 'alerts'>('dashboard');
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [selectedHierarchyId, setSelectedHierarchyId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = api.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      loadGlobalData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const [hList, aList] = await Promise.all([
        api.getHierarchies().catch(() => []),
        api.getAlerts().catch(() => []),
      ]);
      setHierarchies(hList);
      setAlerts(aList);
      if (hList.length > 0 && !selectedHierarchyId) {
        setSelectedHierarchyId(hList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    loadGlobalData();
  };

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
    setSelectedHierarchyId(null);
    setCurrentTab('dashboard');
  };

  const handleSelectHierarchy = (id: string) => {
    setSelectedHierarchyId(id);
    setCurrentTab('scheme');
  };

  const handleResolveAlert = async (alertId: string) => {
    await api.resolveAlert(alertId);
    const updated = await api.getAlerts().catch(() => []);
    setAlerts(updated);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedHierarchy = hierarchies.find((h) => h.id === selectedHierarchyId) || (hierarchies.length > 0 ? hierarchies[0] : null);
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        hierarchies={hierarchies}
        selectedHierarchyId={selectedHierarchyId}
        onSelectHierarchy={handleSelectHierarchy}
        unresolvedAlertsCount={unresolvedCount}
      />

      {/* Main App Content View */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {currentTab === 'dashboard' && (
          <Dashboard
            hierarchies={hierarchies}
            onSelectHierarchy={handleSelectHierarchy}
            onRefreshHierarchies={loadGlobalData}
            unresolvedAlertsCount={unresolvedCount}
          />
        )}

        {currentTab === 'scheme' && selectedHierarchy && (
          <SchemeDashboard
            hierarchy={selectedHierarchy}
            onBack={() => setCurrentTab('dashboard')}
            onNavigateToRoadmap={() => setCurrentTab('roadmap')}
          />
        )}

        {currentTab === 'roadmap' && selectedHierarchy && (
          <RoadmapReview
            hierarchy={selectedHierarchy}
            onBack={() => setCurrentTab('scheme')}
            onRoadmapApproved={() => setCurrentTab('scheme')}
          />
        )}

        {currentTab === 'alerts' && (
          <div style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>
            <AlertsPanel
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
