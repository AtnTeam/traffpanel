import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DateRangePicker from './components/DateRangePicker';
import DataTable from './components/DataTable';
import LogViewer from './components/LogViewer';
import KeitaroLogsViewer from './components/KeitaroLogsViewer';
import { processClicks } from './services/api';
import './App.css';

const AppContent = () => {
  const { isAuthenticated, loading, login, logout } = useAuth();
  const [from, setFrom] = useState('2026-01-14');
  const [to, setTo] = useState('2026-01-15');
  const [logData, setLogData] = useState(null);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'keitaro'
  
  // Auto-refresh states
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState(60);
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);
  const lastRefreshTimeRef = useRef(null);
  const countdownRef = useRef(null);
  const loadingProcessRef = useRef(false);

  // Predefined interval options (in minutes)
  const intervalOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' },
    { value: 360, label: '6 hours' },
    { value: 480, label: '8 hours' },
  ];

  // Update loading ref when loadingProcess changes
  useEffect(() => {
    loadingProcessRef.current = loadingProcess;
  }, [loadingProcess]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefreshEnabled || !from || !to) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
      return;
    }

    // Function to perform auto-refresh
    const performAutoRefresh = async () => {
      if (loadingProcessRef.current) {
        console.log('Skipping auto-refresh: previous request still in progress');
        return;
      }

      try {
        loadingProcessRef.current = true;
        setLoadingProcess(true);
        setError(null);
        const response = await processClicks(from, to);
        setLogData(response);
        setRefreshTrigger(prev => prev + 1);
        lastRefreshTimeRef.current = new Date();
      } catch (err) {
        setError(err.error || err.message || 'Auto-refresh error');
        console.error('Error during auto-refresh:', err);
      } finally {
        loadingProcessRef.current = false;
        setLoadingProcess(false);
      }
    };

    // Function to update countdown
    const updateCountdown = () => {
      if (!lastRefreshTimeRef.current) {
        setCountdown(null);
        return;
      }
      
      const now = new Date();
      const lastRefresh = lastRefreshTimeRef.current;
      const intervalMs = refreshIntervalMinutes * 60 * 1000;
      const nextRefresh = new Date(lastRefresh.getTime() + intervalMs);
      const timeUntil = nextRefresh - now;
      
      if (timeUntil <= 0) {
        setCountdown('Refreshing...');
      } else {
        const minutes = Math.floor(timeUntil / 60000);
        const seconds = Math.floor((timeUntil % 60000) / 1000);
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    // Perform initial refresh immediately when enabled
    performAutoRefresh();

    // Set up interval
    const intervalMs = refreshIntervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(performAutoRefresh, intervalMs);

    // Set up countdown timer
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
    };
  }, [isAutoRefreshEnabled, refreshIntervalMinutes, from, to]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  const handleProcess = async () => {
    if (!from || !to) {
      setError('Please select both dates');
      return;
    }

    setLoadingProcess(true);
    setError(null);
    setLogData(null);

    try {
      const response = await processClicks(from, to);
      setLogData(response);
      setRefreshTrigger(prev => prev + 1);
      lastRefreshTimeRef.current = new Date();
    } catch (err) {
      setError(err.error || err.message || 'Request error');
      console.error('Error processing clicks:', err);
    } finally {
      setLoadingProcess(false);
    }
  };


  return (
    <div className="app">
      <header className="app-header">
        <h1>Trafic Back Panel</h1>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
      
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          Main
        </button>
        <button
          className={`tab-button ${activeTab === 'keitaro' ? 'active' : ''}`}
          onClick={() => setActiveTab('keitaro')}
        >
          Keitaro Logs
        </button>
      </div>
      
      <main className="app-main">
        {activeTab === 'main' && (
          <>
            <div className="control-panel">
              <DateRangePicker
                from={from}
                to={to}
                onFromChange={setFrom}
                onToChange={setTo}
              />
              
              <div className="auto-refresh-controls">
                <div className="auto-refresh-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isAutoRefreshEnabled}
                      onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                      disabled={loadingProcess}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Enable Auto-Refresh</span>
                </div>
                
                {isAutoRefreshEnabled && (
                  <div className="interval-selector">
                    <label htmlFor="refresh-interval">Refresh Interval:</label>
                    <select
                      id="refresh-interval"
                      value={refreshIntervalMinutes}
                      onChange={(e) => setRefreshIntervalMinutes(Number(e.target.value))}
                      disabled={loadingProcess}
                      className="interval-select"
                    >
                      {intervalOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {countdown && (
                      <span className="next-refresh-info">
                        Next refresh in: {countdown}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleProcess}
                disabled={loadingProcess}
                className="process-button"
              >
                {loadingProcess ? 'Processing...' : 'Process Data'}
              </button>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>

            <LogViewer logData={logData} loading={loadingProcess} />
            <DataTable key={refreshTrigger} />
          </>
        )}

        {activeTab === 'keitaro' && (
          <KeitaroLogsViewer />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

