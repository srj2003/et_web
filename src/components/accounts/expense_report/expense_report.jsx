import React, { useState, useEffect } from "react";
import "./expense_report.css";

const ExpenseDetailsModal = ({ expense, visible, onClose }) => {
  if (!expense || !visible) return null;

  // Status determination logic remains the same
  let statusLabel = expense.expense_track_status;
  let statusStyle = "";

  switch (statusLabel) {
    case "Approved":
      statusStyle = "status-approved";
      break;
    case "Pending":
      statusStyle = "status-pending";
      break;
    case "Rejected":
      statusStyle = "status-rejected";
      break;
    default:
      statusStyle = "";
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="back-button" onClick={onClose}>
          ← Back
        </button>

        <div className="scroll-container">
          <div className="details-card">
            <div className="card-header">
              <h2 className="details-title">{expense.expense_track_title}</h2>
              <span className={`status-badge ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>

            <div className="amount-container">
              <p className="amount-label">Total Amount</p>
              <p className="amount-value">
                ₹{expense.expense_total_amount}
              </p>
            </div>

            {/* Other details... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ExpenseReport() {
  // Add all required state declarations
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedHead, setSelectedHead] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFilters = () => setIsFiltersVisible(!isFiltersVisible);

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/expense_report.php?fetch_roles=true"
        );
        const data = await response.json();

        if (response.ok && data.status === "success" && data.roles) {
          setRoles(data.roles);
        } else {
          alert("Failed to load roles.");
        }
      } catch (error) {
        alert("Network error. Please try again.");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch users when a role is selected
  useEffect(() => {
    if (selectedRoleId) {
      fetchUsersByRole(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchUsersByRole = async (roleId) => {
    try {
      setLoadingUsers(true);
      setUsers([]);
      setSelectedUserId("");

      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/expense_report.php?role_id=${roleId}`
      );
      const result = await response.json();

      if (response.ok && result.status === "success" && result.users) {
        setUsers(
          result.users.map((user) => ({
            id: user.u_id.toString(),
            name: user.name,
          }))
        );
      } else {
        alert("No users found for this role.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch expense types
  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        setLoadingExpenseTypes(true);
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/expense_types_fetcher.php"
        );
        const data = await response.json();
        setExpenseTypes(data);
      } catch (error) {
        alert("Failed to load expense types");
      } finally {
        setLoadingExpenseTypes(false);
      }
    };

    fetchExpenseTypes();
  }, []);

  const handleDownload = async () => {
    if (!selectedHead || !selectedUserId) {
      alert("Please select both Expense Head and Name first.");
      return;
    }

    try {
      const downloadUrl = `https://demo-expense.geomaticxevs.in/ET-api/expense_report_download.php?expense_type=${selectedHead}&creator_id=${selectedUserId}`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download expense report. Please try again.");
    }
  };

  const fetchData = async () => {
    if (!selectedHead) {
      alert("Please select an Expense Head.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        expense_type: parseInt(selectedHead),
        ...(selectedRoleId && selectedUserId && { creator_id: parseInt(selectedUserId) }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/expense_report.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const result = await response.json();
      if (Array.isArray(result)) {
        setData(result);
      } else {
        alert("Unexpected data format received.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedHead("");
    setSelectedRoleId("");
    setSelectedUserId("");
    setStartDate(null);
    setEndDate(null);
    setData([]);
    setUsers([]);
    setSelectedExpense(null);
    setShowExpenseDetails(false);
    setSearchQuery("");
  };

  const formatDate = (date) => {
    if (!date) return "Select Date";
    return date.toLocaleDateString("en-GB");
  };

  const handleStartDateChange = (e) => {
    if (e.target.value) {
      setStartDate(new Date(e.target.value));
    }
  };

  const handleEndDateChange = (e) => {
    if (e.target.value) {
      setEndDate(new Date(e.target.value));
    }
  };

  const totalAmount = data.reduce(
    (sum, item) => sum + item.expense_total_amount,
    0
  );

  const getSelectedRoleName = () => {
    const role = roles.find(role => role.value === selectedRoleId);
    return role ? role.label : "Select Role";
  };

  const getSelectedUserName = () => {
    const user = users.find(user => user.id === selectedUserId);
    return user ? user.name : "Select Name";
  };

  return (
    <div className="expense-report-container">
      <div className="header-container">
        <h1 className="header">Expense Report</h1>
        <div className="header-actions">
          <button className="filter-toggle" onClick={toggleFilters}>
            {isFiltersVisible ? '▼ Hide Filters' : '▲ Show Filters'}
          </button>
          <button
            className={`download-button ${!data.length ? 'disabled' : ''}`}
            onClick={handleDownload}
            disabled={!data.length}
          >
            Download Excel
          </button>
        </div>
      </div>

      <div className={`filters ${isFiltersVisible ? 'visible' : 'hidden'}`}>
        <div className="filters-content">
          {/* Head Selection */}
          <div className="form-group">
            <label>Select Head *</label>
            <div
              className="select-box"
              onClick={() => setShowHeadModal(true)}
            >
              {selectedHead
                ? expenseTypes.find(t => t.expense_type_id === selectedHead)?.expense_type_name
                : "Select Head"}
            </div>

            {showHeadModal && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="search-bar-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search Head..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery.length > 0 && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="options-list">
                    {expenseTypes
                      .filter(type =>
                        type.expense_type_name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(type => (
                        <div
                          key={type.expense_type_id}
                          className="option-item"
                          onClick={() => {
                            setSelectedHead(type.expense_type_id);
                            setShowHeadModal(false);
                          }}
                        >
                          {type.expense_type_name}
                        </div>
                      ))}
                  </div>

                  <button
                    className="modal-close"
                    onClick={() => setShowHeadModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role Dropdown */}
          <div className="form-group">
            <label>Select Role *</label>
            <div 
              className="select-box"
              onClick={() => setShowRoleModal(true)}
            >
              {getSelectedRoleName()}
            </div>

            {showRoleModal && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="search-bar-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="options-list">
                    {roles
                      .filter(role => 
                        role.label.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(role => (
                        <div
                          key={role.value}
                          className="option-item"
                          onClick={() => {
                            setSelectedRoleId(role.value);
                            setShowRoleModal(false);
                            setSearchQuery("");
                          }}
                        >
                          {role.label}
                        </div>
                      ))}
                  </div>

                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSearchQuery("");
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name Dropdown */}
          <div className="form-group">
            <label>Select Name *</label>
            <div 
              className="select-box"
              onClick={() => setShowNameModal(true)}
            >
              {getSelectedUserName()}
            </div>

            {showNameModal && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="search-bar-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="options-list">
                    {users
                      .filter(user => 
                        user.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          className="option-item"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setShowNameModal(false);
                            setSearchQuery("");
                          }}
                        >
                          {user.name}
                        </div>
                      ))}
                  </div>

                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowNameModal(false);
                      setSearchQuery("");
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Pickers */}
          <div className="date-pickers-container">
            <div className="date-picker-row">
              <div className="date-picker-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="date-input"
                  value={startDate?.toISOString().split('T')[0] || ''}
                  onChange={handleStartDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="date-arrow">→</div>

              <div className="date-picker-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="date-input"
                  value={endDate?.toISOString().split('T')[0] || ''}
                  onChange={handleEndDateChange}
                  min={startDate?.toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={!startDate}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="filters-footer">
          <div className="action-buttons">
            <button className="reset-button" onClick={handleReset}>
              Reset All Filters
            </button>
            <button
              className={`fetch-button ${!selectedHead ? "disabled" : ""}`}
              onClick={fetchData}
              disabled={!selectedHead}
            >
              Fetch Data
            </button>
          </div>

          {data.length > 0 && (
            <div className="total-amount-container">
              <span className="total-label">Total Amount:</span>
              <span className="total-value">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading...</div>
      ) : data.length > 0 ? (
        <div className="expense-list">
          {data.map(item => (
            <div
              key={item.expense_track_id}
              className="expense-card"
              onClick={() => {
                setSelectedExpense(item);
                setShowExpenseDetails(true);
              }}
            >
              <h3 className="card-title">{item.expense_track_title}</h3>
              <p className="card-detail">
                Amount: ₹{item.expense_total_amount}
              </p>
              <p className="card-detail">
                Status: {item.expense_track_status}
              </p>
              <p className="card-detail">
                Created By: {item.created_by_full_name}
              </p>
              <p className="card-detail">
                Role: {item.role_name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No expense reports found</p>
      )}

      <ExpenseDetailsModal
        expense={selectedExpense}
        visible={showExpenseDetails}
        onClose={() => setShowExpenseDetails(false)}
      />
    </div>
  );
}