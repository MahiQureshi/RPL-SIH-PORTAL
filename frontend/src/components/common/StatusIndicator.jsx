import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import './Controls.css';

export default function StatusIndicator({ isSyncing = false, pendingCount = 0 }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`status-pill ${
        !isOnline ? 'status-offline' : isSyncing ? 'status-syncing' : 'status-online'
      }`}
      title={
        !isOnline
          ? 'Working Offline (Changes will sync automatically once reconnected)'
          : isSyncing
          ? 'Synchronizing local changes with central server...'
          : 'Connected to Central RPL Server'
      }
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} className="text-crimson" />
          <span className="status-text">Offline Mode</span>
          {pendingCount > 0 && <span className="sync-count-tag">{pendingCount}</span>}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={14} className="sync-spinner text-sky" />
          <span className="status-text">Syncing...</span>
        </>
      ) : (
        <>
          <Wifi size={14} className="text-emerald" />
          <span className="status-text">Online</span>
        </>
      )}
    </div>
  );
}
