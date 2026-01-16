import React from 'react';
import './DateRangePicker.css';

const DateRangePicker = ({ from, to, onFromChange, onToChange }) => {
  return (
    <div className="date-range-picker">
      <div className="date-input-group">
        <label htmlFor="from-date">От:</label>
        <input
          id="from-date"
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="date-input"
        />
      </div>
      <div className="date-input-group">
        <label htmlFor="to-date">До:</label>
        <input
          id="to-date"
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="date-input"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;

