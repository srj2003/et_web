import React, { useState, useEffect, useCallback } from "react";
import "./all_expenses.css";
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
    pending: 0,
    approved: 0,
    rejected: 0,
  });

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
      case 2:
        return "Pending";
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
        expense_type: getExpenseType(item.expense_type_id),
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
      const transformedData = transformExpenseData(apiData);
      setExpenses(transformedData);

      // Calculate stats
      setStats({
        total: transformedData.length,
        pending: transformedData.filter((exp) => exp.status === "Pending")
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
            <h3>Pending</h3>
            <p className="stat-value">{stats.pending}</p>
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
      <div className="myleavesfilters-section">
        <div className="myleavessearch-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="myleavessearch-input"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="myleavesfilter-button"
        >
          <option>All</option>
          <option>Unattended</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="allexpense-date-filter-container">
        <div className="allexpense-date-filter-buttons">
          <button
            className={`allexpense-date-filter-button ${
              dateRangeType === "today" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("today")}
          >
            Today
          </button>
          <button
            className={`allexpense-date-filter-button ${
              dateRangeType === "lastMonth" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("lastMonth")}
          >
            Last Month
          </button>
          <button
            className={`allexpense-date-filter-button ${
              dateRangeType === "custom" ? "active" : ""
            }`}
            onClick={() => handleDateRangeSelect("custom")}
          >
            <Calendar size={16} />
            Custom
          </button>
          {dateRangeType && (
            <button
              className="allexpense-clear-button"
              onClick={() => handleDateRangeSelect(null)}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="allexpense-expenses-grid">
        {currentItems.map((expense) => (
          <div
            key={expense.id}
            className="allexpense-expense-card"
            onClick={() => {
              setSelectedExpense(expense);
              setShowExpenseDetails(true);
            }}
          >
            <div className="allexpense-expense-header">
              <div className="allexpense-submission-flow">
                <div className="allexpense-name-container">
                  <h3 className="allexpense-employee-name">
                    {expense.employee}
                  </h3>
                  <div className="allexpense-submission-arrow">
                    <ArrowRight size={16} color="#6366f1" />
                    <span className="allexpense-submitted-to-name">
                      {expense.submitted_to || "Not submitted"}
                    </span>
                  </div>
                </div>
                <span
                  className={`allexpense-status-badge ${expense.status.toLowerCase()}`}
                >
                  {expense.status}
                </span>
              </div>
            </div>
            <div className="allexpense-expense-details">
              <h4 className="allexpense-expense-title">
                {expense.expense_title}
              </h4>
              <span className="allexpense-amount">
                ₹{expense.amount.toFixed(2)}
              </span>
            </div>
            <div className="allexpense-expense-meta">
              <span className="allexpense-expense-type">
                {expense.expense_type}
              </span>
              <span className="allexpense-date">{expense.date}</span>
            </div>
            {expense.remarks && (
              <p className="allexpense-remarks">{expense.remarks}</p>
            )}
          </div>
        ))}
      </div>

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
