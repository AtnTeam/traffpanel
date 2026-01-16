import React from 'react';
import './LogViewer.css';

const LogViewer = ({ logData, loading }) => {
  if (loading) {
    return (
      <div className="log-viewer">
        <div className="log-viewer-loading">Processing...</div>
      </div>
    );
  }

  if (!logData) {
    return null;
  }

  return (
    <div className="log-viewer">
      <h3>Processing Results</h3>
      {logData.success ? (
        <div className="log-viewer-success">
          <div className="log-stat">
            <span className="stat-label">Message:</span>
            <span className="stat-value">{logData.message}</span>
          </div>
          {logData.stats && (
            <div className="log-stats">
              <div className="log-stat">
                <span className="stat-label">Total from API:</span>
                <span className="stat-value">{logData.stats.totalFromAPI}</span>
              </div>
              <div className="log-stat">
                <span className="stat-label">Processed:</span>
                <span className="stat-value">{logData.stats.processed}</span>
              </div>
              <div className="log-stat">
                <span className="stat-label">Inserted:</span>
                <span className="stat-value stat-success">{logData.stats.inserted}</span>
              </div>
              <div className="log-stat">
                <span className="stat-label">Updated:</span>
                <span className="stat-value stat-info">{logData.stats.updated}</span>
              </div>
              <div className="log-stat">
                <span className="stat-label">Sources processed:</span>
                <span className="stat-value">{logData.stats.sourcesProcessed}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="log-viewer-error">
          <div className="error-message">
            Error: {logData.error || 'Unknown error'}
          </div>
          {logData.details && (
            <div className="error-details">{logData.details}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogViewer;

