import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from './components/AppHeader';
import { Dashboard } from './pages/Dashboard';
import { apiClient, HealthStatus } from './api/client';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const data = await apiClient.getHealth();
      setHealth(data);
    } catch {
      // Graceful fallback for offline mode
      setHealth(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="app-container">
      <AppHeader health={health} isLoadingHealth={isLoadingHealth} />
      <main className="main-content">
        <Dashboard
          health={health}
          isLoadingHealth={isLoadingHealth}
          onRefreshHealth={fetchHealth}
        />
      </main>
      <footer className="footer">
        <p>
          FinTrack &copy; {new Date().getFullYear()} &mdash; Intelligent Public Fund Governance & Anomaly Detection System
        </p>
      </footer>
    </div>
  );
}

export default App;
