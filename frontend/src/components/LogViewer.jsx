import React from 'react';
import './LogViewer.css';

const LogViewer = ({ logData, loading }) => {
  if (loading) {
    return (
      <div className="log-viewer">
        <div className="log-viewer-header">
          <h2>Логи запроса</h2>
        </div>
        <div className="log-viewer-content loading">
          Обработка запроса...
        </div>
      </div>
    );
  }

  if (!logData) {
    return (
      <div className="log-viewer">
        <div className="log-viewer-header">
          <h2>Логи запроса</h2>
        </div>
        <div className="log-viewer-content empty">
          Выполните запрос для отображения логов
        </div>
      </div>
    );
  }

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h2>Логи запроса</h2>
        {logData.stats && (
          <div className="log-stats">
            <span>Обработано: {logData.stats.processed}</span>
            <span>Добавлено: {logData.stats.inserted}</span>
            <span>Обновлено: {logData.stats.updated}</span>
          </div>
        )}
      </div>
      <div className="log-viewer-content">
        <pre className="log-json">
          {JSON.stringify(logData.rawResponse || logData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default LogViewer;

