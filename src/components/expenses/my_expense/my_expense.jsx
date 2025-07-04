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
  const [expenseTypeItems, setExpenseTypeItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    Unattended: 0,
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
      console.log("Fetched Expenses Data:", data);

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
          Unattended: data.filter((exp) => exp.expense_status === "Unattended")
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle size={20} color="#10b981" />;
      case "Unattended":
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
      case "Unattended":
        return "status-Unattended";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  // Helper to get expense type name from ID
  const getExpenseTypeName = (typeId) => {
    const found = expenseTypeItems.find(
      (item) =>
        item.id === typeId ||
        item.value === typeId ||
        item.expense_type_id === typeId ||
        String(item.id) === String(typeId) ||
        String(item.value) === String(typeId) ||
        String(item.expense_type_id) === String(typeId)
    );
    return found
      ? found.label || found.name || found.expense_type_name
      : typeId;
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
      <h1 className="myexpenses-myexpensepage-title">My Expense</h1>
      <div className="myexpenses-stats-grid">
        <div className="myexpenses-stat-card">
          <div className="myexpenses-stat-icon">
            <DollarSign size={24} color="#6366f1" />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Total Expenses</h3>
            <p className="myexpenses-stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div className="myexpenses-stat-icon">
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Approved</h3>
            <p className="myexpenses-stat-value">{stats.approved}</p>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div className="myexpenses-stat-icon">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Unatteended</h3>
            <p className="myexpenses-stat-value">{stats.Unattended}</p>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div className="myexpenses-stat-icon">
            <XCircle size={24} color="#ef4444" />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Rejected</h3>
            <p className="myexpenses-stat-value">{stats.rejected}</p>
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
          value={filter || "All"}
          onChange={(e) =>
            setFilter(e.target.value === "All" ? null : e.target.value)
          }
          className="myleavesfilter-button"
        >
          <option>All</option>
          <option>Approved</option>
          <option>Unattended</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="myexpenses-expenses-grid">
        {paginatedExpenses.map((expense) => (
          <div
            key={expense.expense_id}
            className="myexpenses-leave-card"
            data-status={expense.expense_status}
            style={{ position: "relative" }}
          >
            <div className="myexpenses-leave-header">
              <div className="myexpenses-leave-header-content">
                <h3 className="myexpenses-employee-name">
                  {expense.expense_title}
                </h3>
              </div>
              <span
                className={`myexpenses-status-badge myexpenses-status-${expense.expense_status.toLowerCase()}`}
              >
                {expense.expense_status}
              </span>
            </div>
            <div className="myexpenses-leave-details">
              <div className="myexpenses-leave-title-section">
                {expense.expense_comment && (
                  <p className="myexpenses-leave-comment">
                    {expense.expense_comment}
                  </p>
                )}
              </div>
              <div className="myexpenses-leave-dates">
                <div className="myexpenses-date-item">
                  <span className="myexpenses-date-label">Date:</span>
                  <span className="myexpenses-date-value">
                    {expense.expense_date}
                  </span>
                </div>
                <div className="myexpenses-date-item">
                  <span className="myexpenses-date-label">Amount:</span>
                  <span className="myexpenses-date-value">
                    ₹{expense.expense_amount}
                  </span>
                </div>
                <div className="myexpenses-date-item">
                  <span className="myexpenses-date-label">Status:</span>
                  <span className="myexpenses-date-value">
                    {expense.expense_status}
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
                {expense.expense_created_at && (
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Created At:</span>
                    <span className="myexpenses-date-value">
                      {expense.expense_created_at}
                    </span>
                  </div>
                )}
                {expense.expense_approved_by && (
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Approved By:</span>
                    <span className="myexpenses-date-value">
                      {expense.expense_approved_by}
                    </span>
                  </div>
                )}
                {expense.expense_rejected_by && (
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Rejected By:</span>
                    <span className="myexpenses-date-value">
                      {expense.expense_rejected_by}
                    </span>
                  </div>
                )}
                {expense.expense_submitted_to && (
                  <div className="myexpenses-date-item">
                    <span className="myexpenses-date-label">Submitted To:</span>
                    <span className="myexpenses-date-value">
                      {expense.expense_submitted_to}
                    </span>
                  </div>
                )}
                {expense.expense_documents &&
                  expense.expense_documents.length > 0 && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">Documents:</span>
                      <span className="myexpenses-date-value">
                        {expense.expense_documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginRight: 8 }}
                          >
                            {doc.name || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </span>
                    </div>
                  )}
              </div>
            </div>
            {/* Amount breakdown badge at bottom right */}
            {Array.isArray(expense.expense_details) &&
              expense.expense_details.length > 0 && (
                <div className="myexpenses-breakdown-badge myexpenses-breakdown-bottom">
                  <span className="myexpenses-breakdown-equation">
                    {expense.expense_details
                      .map((detail) => `₹${detail.expense_product_amount}`)
                      .join(" + ")}
                    {expense.expense_details.length > 1 && (
                      <>
                        {" = "}₹
                        {expense.expense_details.reduce(
                          (sum, detail) =>
                            sum + Number(detail.expense_product_amount),
                          0
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}
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
