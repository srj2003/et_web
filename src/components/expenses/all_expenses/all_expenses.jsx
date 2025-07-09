import React, { useState, useEffect, useCallback } from "react";
import "./all_expenses.css";
import {
  Search,
  CheckCircle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import moment from "moment";

const AllExpensesWeb = () => {
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
  const itemsPerPage = 16;
  const [stats, setStats] = useState({
    total: 0,
    Unattended: 0,
    approved: 0,
    rejected: 0,
  });
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Helper function to format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
    if (statusCode === null) return "Unattended";
    switch (statusCode) {
      case 0:
        return "Rejected";
      case 1:
        return "Approved";
      default:
        return "Unattended";
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

  // Fetch data from PHP endpoint
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userid");

      if (!token || !userId) {
        alert("You have been logged out. Please login again.");
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/all-expense.php",
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
      const transformedData = transformExpenseData(apiData);
      setExpenses(transformedData);

      // Calculate stats
      setStats({
        total: transformedData.length,
        Unattended: transformedData.filter((exp) => exp.status === "Unattended")
          .length,
        approved: transformedData.filter((exp) => exp.status === "Approved")
          .length,
        rejected: transformedData.filter((exp) => exp.status === "Rejected")
          .length,
      });
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [transformExpenseData]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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

  // Filter expenses based on search, status, and date range (using fromDate/toDate from UI)
  // Filtered expenses and stats based on all filters (search, status, date)
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

      // Use fromDate/toDate from date pickers if set, else fallback to startDate/endDate (quick-selects)
      let filterFrom = fromDate
        ? moment(fromDate, "YYYY-MM-DD").startOf("day")
        : startDate
        ? moment(startDate).startOf("day")
        : null;
      let filterTo = toDate
        ? moment(toDate, "YYYY-MM-DD").endOf("day")
        : endDate
        ? moment(endDate).endOf("day")
        : null;
      let matchesDate = true;
      if (filterFrom && filterTo) {
        const expenseDate = moment(expense.date, "MMM D, YYYY");
        matchesDate =
          expenseDate.isSameOrAfter(filterFrom) &&
          expenseDate.isSameOrBefore(filterTo);
      } else if (filterFrom) {
        const expenseDate = moment(expense.date, "MMM D, YYYY");
        matchesDate = expenseDate.isSameOrAfter(filterFrom);
      } else if (filterTo) {
        const expenseDate = moment(expense.date, "MMM D, YYYY");
        matchesDate = expenseDate.isSameOrBefore(filterTo);
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    expenses,
    searchQuery,
    selectedStatus,
    fromDate,
    toDate,
    startDate,
    endDate,
  ]);

  // Stats for filtered expenses
  const filteredStats = (() => {
    const filtered = filteredExpenses();
    return {
      total: filtered.length,
      Unattended: filtered.filter((exp) => exp.status === "Unattended").length,
      approved: filtered.filter((exp) => exp.status === "Approved").length,
      rejected: filtered.filter((exp) => exp.status === "Rejected").length,
    };
  })();

  const handleFilterSelect = (status) => {
    setSelectedStatus(status);
    setShowFilterDropdown(false);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpenses().slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredExpenses().length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <AlertCircle size={48} color="#ef4444" />
        <p className="error-text">{error}</p>
        <button className="retry-button" onClick={fetchExpenses}>
          Retry
        </button>
      </div>
    );
  }

  if (!loading && expenses.length === 0) {
    return (
      <div className="empty-container">
        <p className="empty-text">No expenses found</p>
        <button className="retry-button" onClick={fetchExpenses}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="allexpense-page-title">All Expenses</h1>
      <div className="allexpense-stats-grid">
        <div className="allexpense-stat-card">
          <div
            className="allexpense-stat-icon"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
            }}
          >
            <DollarSign size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Total Expenses</h3>
            <div className="allexpense-stat-value">{filteredStats.total}</div>
          </div>
        </div>
        <div className="allexpense-stat-card">
          <div
            className="allexpense-stat-icon"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff",
            }}
          >
            <CheckCircle size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Approved</h3>
            <div className="allexpense-stat-value">
              {filteredStats.approved}
            </div>
          </div>
        </div>
        <div className="allexpense-stat-card">
          <div
            className="allexpense-stat-icon"
            style={{
              background: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
              color: "#fff",
            }}
          >
            <Clock size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Unattended</h3>
            <div className="allexpense-stat-value">
              {filteredStats.Unattended}
            </div>
          </div>
        </div>
        <div className="allexpense-stat-card">
          <div
            className="allexpense-stat-icon"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "#fff",
            }}
          >
            <X size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Rejected</h3>
            <div className="allexpense-stat-value">
              {filteredStats.rejected}
            </div>
          </div>
        </div>
      </div>
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
          <option>Approved</option>
          <option>Rejected</option>
        </select>
        <div>
          <button
            className="requestedrequesitionfilter-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("All");
              setFromDate("");
              setToDate("");
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="myrequisition-filter-row">
        <div className="requestedrequesitiondatefilter-container requestedrequesitiondatefilter-row">
          <label className="requestedrequesitiondatefilter-label label-margin-right">
            From:
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="requestedrequesitiondatefilter-input requestedrequesitiondatefilter-input-from input-margin-right"
            max={toDate || undefined}
          />
          <label className="requestedrequesitiondatefilter-label label-margin-right">
            To:
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="requestedrequesitiondatefilter-input requestedrequesitiondatefilter-input-to"
            min={fromDate || undefined}
          />
        </div>
        <div className="myexpenses-view-toggle view-toggle-align">
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
      </div>
      {viewMode === "card" ? (
        <div className="all_expenses-expenses-grid">
          {currentItems.map((expense) => (
            <div
              key={expense.id}
              className="all_expenses-leave-card"
              data-status={expense.status}
              style={{ position: "relative" }}
              onClick={() => {
                setSelectedExpense(expense);
                setShowExpenseDetails(true);
              }}
            >
              <div className="all_expenses-leave-header">
                <div className="all_expenses-leave-header-content">
                  <h3 className="all_expenses-employee-name">
                    {expense.expense_type_name || expense.expense_type}
                  </h3>
                  <span className="all_expenses-leave-type">
                    {expense.expense_title}
                  </span>
                </div>
                <span
                  className={`all_expenses-status-badge all_expenses-status-${expense.status.toLowerCase()}`}
                >
                  {expense.status}
                </span>
              </div>
              <div className="all_expenses-leave-details">
                <div className="all_expenses-leave-title-section">
                  {expense.remarks && (
                    <p className="all_expenses-leave-comment">
                      {expense.remarks}
                    </p>
                  )}
                </div>
                <div className="all_expenses-leave-dates">
                  <div className="all_expenses-date-item">
                    <span className="all_expenses-date-label">Date:</span>
                    <span className="all_expenses-date-value">
                      {expense.date}
                    </span>
                  </div>
                  <div className="all_expenses-date-item">
                    <span className="all_expenses-date-label">Amount:</span>
                    <span className="all_expenses-date-value">
                      ₹{expense.amount}
                    </span>
                  </div>
                  <div className="all_expenses-date-item">
                    <span className="all_expenses-date-label">Status:</span>
                    <span className="all_expenses-date-value">
                      {expense.status}
                    </span>
                  </div>
                  <div className="all_expenses-date-item">
                    <span className="all_expenses-date-label">Created By:</span>
                    <span className="all_expenses-date-value">
                      {expense.employee}
                    </span>
                  </div>
                  {expense.expense_id && (
                    <div className="all_expenses-date-item">
                      <span className="all_expenses-date-label">
                        Expense ID:
                      </span>
                      <span className="all_expenses-date-value">
                        {expense.expense_id}
                      </span>
                    </div>
                  )}
                  {expense.submitted_to && (
                    <div className="all_expenses-date-item">
                      <span className="all_expenses-date-label">
                        Submitted To:
                      </span>
                      <span className="all_expenses-date-value">
                        {expense.submitted_to}
                      </span>
                    </div>
                  )}
                  {expense.approved_by && (
                    <div className="all_expenses-date-item">
                      <span className="all_expenses-date-label">
                        Approved/Rejected By:
                      </span>
                      <span className="all_expenses-date-value">
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
                  // Group by expense_head_name and sum amounts
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
              <button
                className="view-details-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExpense(expense);
                  setShowExpenseDetails(true);
                }}
              >
                View Details
              </button>
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
                <th>Created By</th>
                <th>Submitted To</th>
                <th>Approved/Rejected By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((expense) => (
                <tr key={expense.expense_id}>
                  <td>{expense.expense_id}</td>
                  <td>{expense.expense_title}</td>
                  <td>{expense.expense_type_name || expense.expense_type}</td>
                  <td>{expense.date}</td>
                  <td>{expense.status}</td>
                  <td>₹{expense.amount}</td>
                  <td>{expense.employee}</td>
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

      {/* Pagination Controls */}
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
        <div className="allexpense-modal-overlay">
          <div className="allexpense-modal-content">
            <div className="allexpense-modal-header">
              <h2>Expense Details</h2>
              <button
                className="allexpense-close-button"
                onClick={() => setShowExpenseDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="allexpense-modal-body">
              <div className="allexpense-details-section">
                <h3>{selectedExpense.expense_title}</h3>
                <p className="allexpense-employee-name">
                  {selectedExpense.employee}
                </p>
              </div>
              <div className="allexpense-details-grid">
                <div className="allexpense-detail-item">
                  <span className="allexpense-detail-label">Amount</span>
                  <span className="allexpense-detail-value allexpense-amount">
                    ₹{selectedExpense.amount.toFixed(2)}
                  </span>
                </div>
                <div className="allexpense-detail-item">
                  <span className="allexpense-detail-label">Type</span>
                  <span className="allexpense-detail-value">
                    {selectedExpense.expense_type}
                  </span>
                </div>
                <div className="allexpense-detail-item">
                  <span className="allexpense-detail-label">Date</span>
                  <span className="allexpense-detail-value">
                    {selectedExpense.date}
                  </span>
                </div>
                <div className="allexpense-detail-item">
                  <span className="allexpense-detail-label">Status</span>
                  <span
                    className={`allexpense-detail-value allexpense-status ${selectedExpense.status.toLowerCase()}`}
                  >
                    {selectedExpense.status}
                  </span>
                </div>
              </div>
              {selectedExpense.remarks && (
                <div className="allexpense-remarks-section">
                  <h4>Remarks</h4>
                  <p>{selectedExpense.remarks}</p>
                </div>
              )}
              <div className="allexpense-expense-breakdown">
                <h4>Expense Breakdown</h4>
                <div className="allexpense-breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Bill</th>
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
                          <td className="allexpense-action-buttons">
                            {detail.expense_product_photo_path && (
                              <button
                                className="allexpense-view-button allexpense-product"
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
                                className="allexpense-view-button allexpense-bill"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllExpensesWeb;
