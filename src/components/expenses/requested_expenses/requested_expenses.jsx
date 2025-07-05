import React, { useState, useEffect, useCallback } from "react";
import "./requested_expenses.css";
import {
  Search,
  Filter,
  Calendar,
  ArrowRight,
  AlertCircle,
  Clock,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Define status types
const ExpenseStatus = {
  Unattended: "Unattended",
  Approved: "Approved",
  Rejected: "Rejected",
};

const ManageExpenseWeb = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRangeType, setDateRangeType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleId, setRoleId] = useState(null);
  const [expenseTypeItems, setExpenseTypeItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    Unattended: 0,
    approved: 0,
    rejected: 0,
  });
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"

  const ITEMS_PER_PAGE = 10;

  // Helper function to format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Helper function to map expense types
  const getExpenseType = useCallback((typeCode) => {
    switch (typeCode) {
      case 0:
        return "Travel";
      case 1:
        return "Food";
      case 2:
        return "Accommodation";
      case 3:
        return "Office Supplies";
      default:
        return "Other";
    }
  }, []);

  // Helper function to map status
  const getStatus = useCallback((statusCode) => {
    if (statusCode === null) return ExpenseStatus.Unattended;
    switch (statusCode) {
      case 0:
        return ExpenseStatus.Rejected;
      case 1:
        return ExpenseStatus.Approved;
      case 2:
        return ExpenseStatus.Unattended;
      default:
        return ExpenseStatus.Unattended;
    }
  }, []);

  // Data transformer function
  const transformExpenseData = useCallback(
    (apiData) => {
      return apiData.map((item) => ({
        id: item.expense_track_id.toString(),
        expense_id: item.expense_track_id,
        employee: item.created_by_full_name,
        expense_title: item.expense_track_title,
        expense_type: item.expense_type_name,
        amount: item.expense_total_amount,
        date: formatDate(item.expense_track_created_at),
        status: getStatus(item.expense_track_status),
        remarks: item.expense_track_app_rej_remarks,
        submitted_to: item.submitted_to_full_name,
        approved_by: item.approved_rejected_by_full_name,
        expense_track_created_by: item.expense_track_created_by.toString(),
        expense_details: item.expense_details,
      }));
    },
    [formatDate, getExpenseType, getStatus]
  );
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const headsResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_heads=true",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const headsData = await headsResponse.json();
        console.log(headsData);
        if (headsData.status === "success") {
          setExpenseTypeItems(headsData.data);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  // Fetch data from PHP endpoint
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        throw new Error("Authentication failed");
      }

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/manage_expense.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      console.log("API Data:", apiData);
      const filteredData = apiData.filter(
        (expense) => expense.expense_track_submitted_to === parseInt(userId, 10)
      );
      const transformedData = transformExpenseData(filteredData);
      setExpenses(transformedData);

      // Calculate stats
      setStats({
        total: transformedData.length,
        Unattended: transformedData.filter(
          (exp) => exp.status === ExpenseStatus.Unattended
        ).length,
        approved: transformedData.filter(
          (exp) => exp.status === ExpenseStatus.Approved
        ).length,
        rejected: transformedData.filter(
          (exp) => exp.status === ExpenseStatus.Rejected
        ).length,
      });
    } catch (err) {
      console.error("Error fetching expenses:", err);
      if (err.message === "Authentication failed") {
        window.location.href = "/";
      }
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [transformExpenseData]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
    const storedRoleId = localStorage.getItem("roleId");
    setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
  }, [fetchExpenses]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      // Not logged in → redirect to login
      window.location.href = "/";
      return;
    }
  }, []);

  const handleAction = async (expense_id, action) => {
    try {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        throw new Error("Authentication failed");
      }

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_expense.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            expense_track_id: expense_id,
            action,
            user_id: parseInt(userId, 10),
          }),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const data = await response.json();
      if (data.status === "success") {
        setExpenses((prevExpenses) =>
          prevExpenses.map((expense) =>
            expense.expense_id === expense_id
              ? {
                  ...expense,
                  status:
                    action === "approve"
                      ? ExpenseStatus.Approved
                      : ExpenseStatus.Rejected,
                }
              : expense
          )
        );

        if (selectedExpense?.expense_id === expense_id) {
          setSelectedExpense((prev) =>
            prev
              ? {
                  ...prev,
                  status:
                    action === "approve"
                      ? ExpenseStatus.Approved
                      : ExpenseStatus.Rejected,
                }
              : null
          );
        }

        alert("Success: " + data.message);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error handling action:", error);
      if (error.message === "Authentication failed") {
        window.location.href = "/";
        return;
      }
      alert("Failed to process the action. Please try again.");
    }
  };

  const handleDateRangeSelect = useCallback((type) => {
    setDateRangeType(type);
    if (type === "today") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else if (type === "lastMonth") {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, []);

  // Filter expenses based on search, status, and date range
  const filteredExpenses = useCallback(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.expense_title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (expense.remarks &&
          expense.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "All" || expense.status === selectedStatus;

      let matchesDate = true;
      if (startDate && endDate) {
        const expenseDate = moment(expense.date, "MMM D, YYYY").toDate();
        matchesDate = expenseDate >= startDate && expenseDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [expenses, searchQuery, selectedStatus, startDate, endDate]);

  const handleFilterSelect = (status) => {
    setSelectedStatus(status);
    setShowFilterDropdown(false);
  };

  const totalPages = Math.ceil(filteredExpenses().length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses().slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Add missing handlePageChange for pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-loading-spinner"></div>
        <div className="requestedleaves-loading-text">Loading expenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button className="retry-button" onClick={fetchExpenses}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="requestedexpensespage-title">Requested Expenses</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <AlertCircle size={24} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>Total Expenses</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <h3>Unattended</h3>
            <p className="stat-value">{stats.Unattended}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Check size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <h3>Approved</h3>
            <p className="stat-value">{stats.approved}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <X size={24} color="#ef4444" />
          </div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters Section - Like Leaves */}
      <div className="requestedexpensesfilters-section">
        <div className="requestedexpensessearch-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="requestedexpensessearch-input"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="requestedexpensesfilter-button"
        >
          <option>All</option>
          <option>Unattended</option>
          <option>Unattended</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="date-filter-container">
        <div className="date-filter-buttons">
          <button
            className={`date-filter-button ${
              dateRangeType === "today" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("today")}
          >
            Today
          </button>
          <button
            className={`date-filter-button ${
              dateRangeType === "lastMonth" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("lastMonth")}
          >
            Last Month
          </button>
          <button
            className={`date-filter-button ${
              dateRangeType === "custom" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("custom")}
          >
            <Calendar size={16} />
            Custom
          </button>
          {dateRangeType && (
            <button
              className="clear-button"
              onClick={() => handleDateRangeSelect(null)}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="myexpenses-view-toggle">
        <button
          className={`myexpenses-view-btn${
            viewMode === "card" ? " active" : ""
          }`}
          onClick={() => setViewMode("card")}
        >
          Card View
        </button>
        <button
          className={`myexpenses-view-btn${
            viewMode === "table" ? " active" : ""
          }`}
          onClick={() => setViewMode("table")}
        >
          Table View
        </button>
      </div>

      {viewMode === "card" ? (
        <div className="myexpenses-expenses-grid">
          {paginatedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="myexpensescard"
              data-status={expense.status}
              style={{ position: "relative" }}
              onClick={() => {
                setSelectedExpense(expense);
                setShowExpenseDetails(true);
              }}
            >
              <div className="myexpensesheader">
                <div
                  className="myexpensesheader-content"
                  style={{ minHeight: 24 }}
                >
                  <h1 className="myexpenses-title-name">
                    {expense.expense_type_name || expense.expense_type}
                  </h1>
                  <h3
                    className="myexpenses-title-name"
                    style={{ minHeight: 24 }}
                  >
                    {expense.expense_title || (
                      <span style={{ visibility: "hidden" }}>.</span>
                    )}
                  </h3>
                </div>
                <span
                  className={`myexpenses-status-badge myexpenses-status-${expense.status.toLowerCase()}`}
                >
                  {expense.status}
                </span>
              </div>
              <div className="myexpensesdetails">
                <div className="myexpensestitle-section">
                  {expense.remarks && (
                    <p className="myexpensescomment">{expense.remarks}</p>
                  )}
                </div>
                <div className="myexpensesdates">
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Date:</span>
                    <span className="myexpenses-date-value">
                      {expense.date}
                    </span>
                  </div>
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Amount:</span>
                    <span className="myexpenses-date-value">
                      ₹{expense.amount}
                    </span>
                  </div>
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Status:</span>
                    <span className="myexpenses-date-value">
                      {expense.status}
                    </span>
                  </div>
                  {expense.expense_id && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">Expense ID:</span>
                      <span className="myexpenses-date-value">
                        {expense.expense_id}
                      </span>
                    </div>
                  )}
                  {expense.submitted_to && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">
                        Submitted To:
                      </span>
                      <span className="myexpenses-date-value">
                        {expense.submitted_to}
                      </span>
                    </div>
                  )}
                  {expense.approved_by && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">
                        Approved By:
                      </span>
                      <span className="myexpenses-date-value">
                        {expense.approved_by}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Amount breakdown badge at bottom right */}
              {Array.isArray(expense.expense_details) &&
                expense.expense_details.length > 0 &&
                (() => {
                  const categoryMap = {};
                  expense.expense_details.forEach((detail) => {
                    const head =
                      detail.expense_head_name ||
                      detail.expense_head_title ||
                      "Other";
                    const amt = Number(detail.expense_product_amount) || 0;
                    if (!categoryMap[head]) categoryMap[head] = 0;
                    categoryMap[head] += amt;
                  });
                  const categories = Object.keys(categoryMap);
                  const values = categories.map(
                    (cat) => `₹${categoryMap[cat]}`
                  );
                  return (
                    <div
                      className="myexpenses-breakdown-badge myexpenses-breakdown-bottom"
                      style={{ "--breakdown-cols": categories.length + 1 }}
                    >
                      <div className="myexpenses-breakdown-categories">
                        {categories.map((cat, idx) => (
                          <span
                            key={cat}
                            className="myexpenses-breakdown-category-label"
                            title={cat}
                          >
                            {cat && cat.length > 8
                              ? cat.slice(0, 8) + "..."
                              : cat}
                          </span>
                        ))}
                        <span className="myexpenses-breakdown-category-label myexpenses-breakdown-category-total">
                          Total
                        </span>
                      </div>
                      <div className="myexpenses-breakdown-category-amounts">
                        {values.map((val, idx) => (
                          <span
                            key={idx}
                            className="myexpenses-breakdown-category-amount"
                          >
                            {val}
                          </span>
                        ))}
                        <span className="myexpenses-breakdown-category-amount myexpenses-breakdown-category-total">{`₹${Object.values(
                          categoryMap
                        ).reduce((a, b) => a + Number(b), 0)}`}</span>
                      </div>
                    </div>
                  );
                })()}
              {expense.status === "Unattended" &&
                roleId !== null &&
                (roleId < 5 || roleId === 8) && (
                  <div className="requestedexpenses-actions">
                    <button
                      className="requestedexpenses-action-button requestedexpenses-approve"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(expense.expense_id, "approve");
                      }}
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      className="requestedexpenses-action-button requestedexpenses-reject"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(expense.expense_id, "reject");
                      }}
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="myexpenses-table-container">
          <table className="myexpenses-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Submitted To</th>
                <th>Approved By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.map((expense) => (
                <tr key={expense.expense_id}>
                  <td>{expense.expense_id}</td>
                  <td>{expense.expense_title}</td>
                  <td>{expense.expense_type_name || expense.expense_type}</td>
                  <td>{expense.date}</td>
                  <td>{expense.status}</td>
                  <td>₹{expense.amount}</td>
                  <td>{expense.submitted_to}</td>
                  <td>{expense.approved_by || "-"}</td>
                  <td>
                    <details>
                      <summary>Show</summary>
                      <table className="myexpenses-details-table">
                        <thead>
                          <tr>
                            <th>Head</th>
                            <th>Amount</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Name</th>
                            <th>Desc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expense.expense_details &&
                            expense.expense_details.map((d, i) => (
                              <tr key={d.expense_id || i}>
                                <td
                                  title={
                                    d.expense_head_name || d.expense_head_title
                                  }
                                >
                                  {(d.expense_head_name ||
                                    d.expense_head_title) &&
                                  (d.expense_head_name || d.expense_head_title)
                                    .length > 8
                                    ? (
                                        d.expense_head_name ||
                                        d.expense_head_title
                                      ).slice(0, 8) + "..."
                                    : d.expense_head_name ||
                                      d.expense_head_title}
                                </td>
                                <td>₹{d.expense_product_amount}</td>
                                <td>{d.expense_product_qty}</td>
                                <td>{d.expense_product_unit}</td>
                                <td>{d.expense_product_name}</td>
                                <td>{d.expense_product_desc}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 0 && (
        <div className="allexpense-pagination-container">
          <button
            className="allexpense-pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <div className="allexpense-pagination-number">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="allexpense-pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {showExpenseDetails && selectedExpense && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Expense Details</h2>
              <button
                className="close-button"
                onClick={() => setShowExpenseDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>{selectedExpense.expense_title}</h3>
                <p className="employee-name">{selectedExpense.employee}</p>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">
                    ₹{selectedExpense.amount.toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    {selectedExpense.expense_type}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{selectedExpense.date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className={`detail-value status ${selectedExpense.status.toLowerCase()}`}
                  >
                    {selectedExpense.status}
                  </span>
                </div>
              </div>
              {selectedExpense.remarks && (
                <div className="remarks-section">
                  <h4>Remarks</h4>
                  <p>{selectedExpense.remarks}</p>
                </div>
              )}
              <div className="expense-breakdown">
                <h4>Expense Breakdown</h4>
                <div className="breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExpense.expense_details.map((detail, index) => (
                        <tr key={index}>
                          <td>{detail.expense_head_title}</td>
                          <td>{detail.expense_product_desc}</td>
                          <td>{detail.expense_product_qty}</td>
                          <td>{detail.expense_product_unit}</td>
                          <td>₹{detail.expense_product_amount}</td>
                          <td>{formatDate(detail.expense_bill_date)}</td>
                          <td className="action-buttons">
                            {detail.expense_product_photo_path && (
                              <button
                                className="view-button product"
                                onClick={() =>
                                  window.open(
                                    `https://demo-expense.geomaticxevs.in/ET-api/${detail.expense_product_photo_path}`,
                                    "_blank"
                                  )
                                }
                                title="View Product Image"
                              >
                                <img
                                  src={`https://demo-expense.geomaticxevs.in/ET-api/${detail.expense_product_photo_path}`}
                                  alt="Product"
                                />
                              </button>
                            )}
                            {detail.expense_product_bill_photo_path && (
                              <button
                                className="view-button bill"
                                onClick={() =>
                                  window.open(
                                    `https://demo-expense.geomaticxevs.in/ET-api/${detail.expense_product_bill_photo_path}`,
                                    "_blank"
                                  )
                                }
                                title="View Bill Image"
                              >
                                <img
                                  src={`https://demo-expense.geomaticxevs.in/ET-api/${detail.expense_product_bill_photo_path}`}
                                  alt="Bill"
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedExpense.status === "Unattended" &&
                roleId !== null &&
                (roleId < 5 || roleId === 8) && (
                  <div className="modal-actions">
                    <button
                      className="modal-button approve"
                      onClick={() =>
                        handleAction(selectedExpense.expense_id, "approve")
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="modal-button reject"
                      onClick={() =>
                        handleAction(selectedExpense.expense_id, "reject")
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExpenseWeb;
