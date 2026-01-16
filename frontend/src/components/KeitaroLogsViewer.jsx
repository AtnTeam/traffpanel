import React, { useState, useEffect } from 'react';
import { getKeitaroLogs } from '../services/api';
import './KeitaroLogsViewer.css';

const KeitaroLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    source: '',
    found: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [pagination.offset, filters]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.source && { source: filters.source }),
        ...(filters.found && { found: filters.found })
      };
      
      const response = await getKeitaroLogs(params);
      setLogs(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore
      }));
    } catch (err) {
      setError(err.error || err.message || 'Failed to load logs');
      console.error('Error loading Keitaro logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (direction) => {
    setPagination(prev => {
      const newOffset = direction === 'next' 
        ? prev.offset + prev.limit
        : Math.max(0, prev.offset - prev.limit);
      return { ...prev, offset: newOffset };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA');
  };

  const formatResponse = (response) => {
    if (!response) return 'N/A';
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return response;
      }
    }
    return JSON.stringify(response, null, 2);
  };

  return (
    <div className="keitaro-logs-viewer">
      <div className="logs-header">
        <h2>Keitaro API Logs</h2>
        <button onClick={loadLogs} className="refresh-button" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="logs-filters">
        <div className="filter-group">
          <label>Source:</label>
          <input
            type="text"
            placeholder="Search source..."
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Found:</label>
          <select
            value={filters.found}
            onChange={(e) => handleFilterChange('found', e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Found</option>
            <option value="false">Not Found</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Method</th>
              <th>Source</th>
              <th>Found</th>
              <th>Response Time</th>
              <th>IP</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="loading-cell">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">No logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className={log.found ? 'log-found' : 'log-not-found'}>
                  <td>{log.id}</td>
                  <td>{formatDate(log.created_at)}</td>
                  <td><span className={`method-badge method-${log.method.toLowerCase()}`}>{log.method}</span></td>
                  <td className="source-cell" title={log.source}>{log.source || 'N/A'}</td>
                  <td>
                    <span className={`found-badge ${log.found ? 'found-yes' : 'found-no'}`}>
                      {log.found ? '✓ Found' : '✗ Not Found'}
                    </span>
                  </td>
                  <td>{log.response_time}ms</td>
                  <td>{log.ip_address}</td>
                  <td>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="view-details-button"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="logs-pagination">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={pagination.offset === 0 || loading}
        >
          Previous
        </button>
        <span>
          Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
        </span>
        <button
          onClick={() => handlePageChange('next')}
          disabled={!pagination.hasMore || loading}
        >
          Next
        </button>
      </div>

      {selectedLog && (
        <div className="log-details-modal" onClick={() => setSelectedLog(null)}>
          <div className="log-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="log-details-header">
              <h3>Keitaro Request Details - ID: {selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="close-button">×</button>
            </div>
            <div className="log-details-body">
              <div className="detail-section">
                <h4>Request</h4>
                <div className="detail-item">
                  <strong>Method:</strong> {selectedLog.method}
                </div>
                <div className="detail-item">
                  <strong>URL:</strong> {selectedLog.url}
                </div>
                <div className="detail-item">
                  <strong>Source:</strong> {selectedLog.source || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>IP Address:</strong> {selectedLog.ip_address}
                </div>
                <div className="detail-item">
                  <strong>User Agent:</strong> {selectedLog.user_agent}
                </div>
                {selectedLog.params && (
                  <div className="detail-item">
                    <strong>Parameters:</strong>
                    <pre>{formatResponse(selectedLog.params)}</pre>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Response</h4>
                <div className="detail-item">
                  <strong>Found:</strong> 
                  <span className={`found-badge ${selectedLog.found ? 'found-yes' : 'found-no'}`}>
                    {selectedLog.found ? '✓ Found' : '✗ Not Found'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Response Time:</strong> {selectedLog.response_time}ms
                </div>
                {selectedLog.response && (
                  <div className="detail-item">
                    <strong>Response Data:</strong>
                    <pre>{formatResponse(selectedLog.response)}</pre>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Metadata</h4>
                <div className="detail-item">
                  <strong>Created At:</strong> {formatDate(selectedLog.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeitaroLogsViewer;

