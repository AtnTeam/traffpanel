import React, { useState, useEffect } from 'react';
import { getRequestLogs } from '../services/api';
import './RequestLogsViewer.css';

const RequestLogsViewer = () => {
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
    method: '',
    statusCode: '',
    path: ''
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
        ...(filters.method && { method: filters.method }),
        ...(filters.statusCode && { statusCode: filters.statusCode }),
        ...(filters.path && { path: filters.path })
      };
      
      const response = await getRequestLogs(params);
      setLogs(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore
      }));
    } catch (err) {
      setError(err.error || err.message || 'Failed to load logs');
      console.error('Error loading logs:', err);
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

  const getStatusClass = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-redirect';
    if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
    if (statusCode >= 500) return 'status-server-error';
    return '';
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
    <div className="request-logs-viewer">
      <div className="logs-header">
        <h2>Request Logs</h2>
        <button onClick={loadLogs} className="refresh-button" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="logs-filters">
        <div className="filter-group">
          <label>Method:</label>
          <select
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
          >
            <option value="">All</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status Code:</label>
          <input
            type="text"
            placeholder="e.g., 200, 404"
            value={filters.statusCode}
            onChange={(e) => handleFilterChange('statusCode', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Path:</label>
          <input
            type="text"
            placeholder="Search path..."
            value={filters.path}
            onChange={(e) => handleFilterChange('path', e.target.value)}
          />
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
              <th>Path</th>
              <th>Status</th>
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
                <tr key={log.id} className={getStatusClass(log.status_code)}>
                  <td>{log.id}</td>
                  <td>{formatDate(log.created_at)}</td>
                  <td><span className={`method-badge method-${log.method.toLowerCase()}`}>{log.method}</span></td>
                  <td className="path-cell" title={log.path}>{log.path}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(log.status_code)}`}>
                      {log.status_code}
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
              <h3>Request Details - ID: {selectedLog.id}</h3>
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
                  <strong>Path:</strong> {selectedLog.path}
                </div>
                <div className="detail-item">
                  <strong>IP Address:</strong> {selectedLog.ip_address}
                </div>
                <div className="detail-item">
                  <strong>User Agent:</strong> {selectedLog.user_agent}
                </div>
                {selectedLog.headers && (
                  <div className="detail-item">
                    <strong>Headers:</strong>
                    <pre>{JSON.stringify(selectedLog.headers, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.body && (
                  <div className="detail-item">
                    <strong>Body:</strong>
                    <pre>{formatResponse(selectedLog.body)}</pre>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Response</h4>
                <div className="detail-item">
                  <strong>Status Code:</strong> 
                  <span className={`status-badge ${getStatusClass(selectedLog.status_code)}`}>
                    {selectedLog.status_code}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Response Time:</strong> {selectedLog.response_time}ms
                </div>
                {selectedLog.response && (
                  <div className="detail-item">
                    <strong>Response:</strong>
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

export default RequestLogsViewer;

