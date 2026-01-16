import React, { useState, useEffect } from 'react';
import { getAllClicks } from '../services/api';
import './DataTable.css';

const DataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllClicks();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err.error || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="data-table-loading">Loading...</div>;
  }

  if (error) {
    return <div className="data-table-error">Error: {error}</div>;
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <h2>Clicks Data</h2>
        <button onClick={fetchData} className="refresh-button">
          Refresh
        </button>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Sub ID 2</th>
              <th>Country Flag</th>
              <th>Datetime</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  <td>{row.source}</td>
                  <td>{row.sub_id_2}</td>
                  <td>{row.country_flag}</td>
                  <td>{new Date(row.datetime).toLocaleString()}</td>
                  <td>{new Date(row.updated_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="data-table-footer">
        Total records: {data.length}
      </div>
    </div>
  );
};

export default DataTable;

