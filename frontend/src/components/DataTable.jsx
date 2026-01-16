import React, { useEffect, useState } from 'react';
import { getAllClicks } from '../services/api';
import './DataTable.css';

const DataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllClicks();
      setData(response.data || []);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="data-table-loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="data-table-error">
        <p>{error}</p>
        <button onClick={fetchData} className="retry-button">
          Попробовать еще раз
        </button>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <h2>Актуальные данные</h2>
        <button onClick={fetchData} className="refresh-button">
          Обновить
        </button>
      </div>
      {data.length === 0 ? (
        <div className="data-table-empty">Нет данных</div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Sub ID 2</th>
                <th>Country Flag</th>
                <th>Datetime</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{row.source}</td>
                  <td>{row.sub_id_2}</td>
                  <td>{row.country_flag}</td>
                  <td>{new Date(row.datetime).toLocaleString('ru-RU')}</td>
                  <td>{new Date(row.updated_at).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="data-table-footer">
        Всего записей: <strong>{data.length}</strong>
      </div>
    </div>
  );
};

export default DataTable;

