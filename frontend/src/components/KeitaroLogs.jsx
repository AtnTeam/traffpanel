import React, { useState, useEffect } from 'react';
import { getKeitaroLogs } from '../services/api';
import './KeitaroLogs.css';

const KeitaroLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getKeitaroLogs(100, 0);
      setLogs(response.data);
      setStats(response.stats);
    } catch (err) {
      setError(err.error || err.message || 'Ошибка загрузки логов');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusBadge = (status) => {
    const statusMap = {
      success: { class: 'status-success', text: 'Успешно' },
      not_found: { class: 'status-not-found', text: 'Не найдено' },
      error: { class: 'status-error', text: 'Ошибка' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-unknown', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <div className="keitaro-logs">
      <div className="logs-header">
        <h2>Логи обработки кликов Keitaro</h2>
        <div className="logs-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Автообновление (5 сек)
          </label>
          <button onClick={fetchLogs} disabled={loading}>
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="logs-stats">
          <div className="stat-item">
            <span className="stat-label">Всего:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item stat-success">
            <span className="stat-label">Успешно:</span>
            <span className="stat-value">{stats.success_count}</span>
          </div>
          <div className="stat-item stat-not-found">
            <span className="stat-label">Не найдено:</span>
            <span className="stat-value">{stats.not_found_count}</span>
          </div>
          <div className="stat-item stat-error">
            <span className="stat-label">Ошибки:</span>
            <span className="stat-value">{stats.error_count}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading && logs.length === 0 ? (
        <div className="loading">Загрузка логов...</div>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Source</th>
                <th>Оригинальный sub_id_2</th>
                <th>Разрешенный sub_id_2</th>
                <th>Статус</th>
                <th>URL редиректа</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">Нет логов</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                    <td>{log.source || '-'}</td>
                    <td>{log.sub_id_2 || '-'}</td>
                    <td>
                      <strong>{log.resolved_sub_id_2 || 'null'}</strong>
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td className="redirect-url">
                      <a 
                        href={log.redirect_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title={log.redirect_url}
                      >
                        {log.redirect_url?.substring(0, 60)}...
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KeitaroLogs;

