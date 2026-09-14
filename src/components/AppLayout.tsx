import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { isOnline, subscribeToNetworkStatus } from '../services/native';
import { getSyncStats, onSyncProgress } from '../services/sync';

export default function AppLayout() {
  const navigate = useNavigate();
  const [online, setOnline] = useState<boolean>(true);
  const [stats, setStats] = useState({ pending: 0, succeeded: 0, failed: 0 });

  useEffect(() => {
    let mounted = true;

    isOnline().then((v) => mounted && setOnline(v));
    getSyncStats().then((v) => mounted && setStats(v));

    const unsubNet = subscribeToNetworkStatus((v) => mounted && setOnline(v));
    const unsubSync = onSyncProgress((v) => mounted && setStats(v));

    return () => {
      mounted = false;
      unsubNet();
      unsubSync();
    };
  }, []);

  const handleNewClick = () => navigate('/new');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">
            <span>📋</span>
            <span>VKU Survey</span>
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className={`network-badge ${online ? 'online' : 'offline'}`}>
              <span>{online ? '🟢' : '🔴'}</span>
              <span>{online ? 'Online' : 'Offline'}</span>
            </span>
            {(stats.pending > 0 || stats.failed > 0) && (
              <div className="sync-stats">
                {stats.pending > 0 && <span className="sync-chip">⏳ {stats.pending}</span>}
                {stats.failed > 0 && <span className="sync-chip">⚠ {stats.failed}</span>}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <button className="fab" onClick={handleNewClick} aria-label="New survey">
        +
      </button>
    </div>
  );
}
