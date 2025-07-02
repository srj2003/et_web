import React, { useState, useEffect, useCallback } from "react";
import "./my_expense.css";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ExpenseDetailsWeb = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noRecords, setNoRecords] = useState(false);
  const [filter, setFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchExpenses = useCallback(async () => {
    const userId = localStorage.getItem("userid");
    const token = localStorage.getItem("authToken");

    if (!userId || !token) {
      alert("You have been logged out. Please login again.");
      window.location.href = "/";
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/my-expenses.php",
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

      const data = await response.json();

      if (data.status === "error") {
        console.error("API Error:", data.message);
        setExpenses([]);
        setNoRecords(true);
      } else if (Array.isArray(data)) {
        setExpenses(data);
        setNoRecords(false);
        // Calculate stats
        setStats({
          total: data.length,
          approved: data.filter((exp) => exp.expense_status === "Approved")
            .length,
          pending: data.filter((exp) => exp.expense_status === "Pending")
            .length,
          rejected: data.filter((exp) => exp.expense_status === "Rejected")
            .length,
        });
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setNoRecords(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle size={20} color="#10b981" />;
      case "Pending":
        return <Clock size={20} color="#f59e0b" />;
      case "Rejected":
        return <XCircle size={20} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Pending":
        return "status-pending";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesFilter = filter ? expense.expense_status === filter : true;
    const matchesSearch = expense.expense_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-loading-spinner"></div>
        <div className="requestedleaves-loading-text">Loading expenses...</div>
      </div>
    );
  }

  if (noRecords) {
    return (
      <div className="no-records-container">
        <div className="no-records-content">
          <DollarSign size={48} color="#64748b" />
          <h2>No Expense Records</h2>
          <p>You haven't submitted any expenses yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="myexpensepage-title">My Expense</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>Total Expenses</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <h3>Approved</h3>
            <p className="stat-value">{stats.approved}</p>
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
            <XCircle size={24} color="#ef4444" />
          </div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-button ${filter === null ? "active" : ""}`}
            onClick={() => setFilter(null)}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === "Approved" ? "active" : ""}`}
            onClick={() => setFilter("Approved")}
          >
            Approved
          </button>
          <button
            className={`filter-button ${filter === "Pending" ? "active" : ""}`}
            onClick={() => setFilter("Pending")}
          >
            Pending
          </button>
          <button
            className={`filter-button ${filter === "Rejected" ? "active" : ""}`}
            onClick={() => setFilter("Rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="expenses-grid">
        {paginatedExpenses.map((expense) => (
          <div key={expense.expense_id} className="expense-card">
            <div className="expense-header">
              <h3 className="expense-title">{expense.expense_title}</h3>
              <span
                className={`status-badge ${getStatusClass(
                  expense.expense_status
                )}`}
              >
                {getStatusIcon(expense.expense_status)}
                {expense.expense_status}
              </span>
            </div>
            <div className="expense-details">
              <div className="expense-info">
                <span className="info-label">Type:</span>
                <span className="info-value">{expense.expense_type}</span>
              </div>
              <div className="expense-info">
                <span className="info-label">Amount:</span>
                <span className="info-value amount">
                  ₹{expense.expense_amount}
                </span>
              </div>
              <div className="expense-info">
                <span className="info-label">Date:</span>
                <span className="info-value">{expense.expense_date}</span>
              </div>
              {expense.expense_comment && (
                <div className="expense-info full-width">
                  <span className="info-label">Comment:</span>
                  <span className="info-value">{expense.expense_comment}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 0 && (
        <div className="allexpense-pagination-container">
          <button
            className="allexpense-pagination-button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailsWeb;
