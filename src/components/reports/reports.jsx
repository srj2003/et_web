import React, { useState } from "react";
import "./reports.css";
import { FaUser, FaCalendarAlt, FaGlobe, FaRedo, FaSearch } from 'react-icons/fa';

const dummyUsers = [
  { id: 1, name: "Alice Smith" },
  { id: 2, name: "Bob Johnson" },
  { id: 3, name: "Charlie Lee" },
];
const dummyDomains = [
  { id: 1, name: "Finance" },
  { id: 2, name: "HR" },
  { id: 3, name: "IT" },
];

const Reports = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleReset = () => {
    setSelectedUser("");
    setSelectedDomain("");
    setDateFrom("");
    setDateTo("");
  };

  const handleFetch = () => {
    // For now, just log the selected values
    alert(`User: ${selectedUser}\nDomain: ${selectedDomain}\nFrom: ${dateFrom}\nTo: ${dateTo}`);
  };

  return (
    <div className="reports-container">
      <div className="header">
        <h1 className="title gradient-text">Reports</h1>
      </div>
      <div className="filters-section card modern-card">
        <h2 className="section-title">Filter Your Report</h2>
        <div className="form-row">
          <div className="form-group floating-label">
            <FaUser className="input-icon" />
            <select
              id="user-select"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="input-select modern-input"
            >
              <option value="">Select user</option>
              {dummyUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <label htmlFor="user-select">Username</label>
          </div>
          <div className="form-group floating-label date-group">
            <FaCalendarAlt className="input-icon" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="input-date modern-input"
              placeholder="From"
            />
            <span className="date-range-separator">to</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="input-date modern-input"
              placeholder="To"
            />
            <label>Date Range</label>
          </div>
          <div className="form-group floating-label">
            <FaGlobe className="input-icon" />
            <select
              id="domain-select"
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              className="input-select modern-input"
            >
              <option value="">Select domain</option>
              {dummyDomains.map(domain => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
            <label htmlFor="domain-select">Domain</label>
          </div>
        </div>
        <div className="form-actions">
          <button className="reset-button modern-btn" onClick={handleReset}><FaRedo /> Reset</button>
          <button className="fetch-button modern-btn" onClick={handleFetch}><FaSearch /> Fetch Data</button>
        </div>
      </div>
      <div className="results-section card modern-card">
        <h2 className="section-title">Results</h2>
        <div className="results-placeholder">
          <p className="results-text">No data to display. Please use the filters above and click <b>Fetch Data</b> to view your report.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
