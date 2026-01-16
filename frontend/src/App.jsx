import React, { useState } from 'react';
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
      
      // Trigger data refresh
      setRefreshTrigger(prev => prev + 1);
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

