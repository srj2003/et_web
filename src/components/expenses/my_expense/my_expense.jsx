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
  X,
} from "lucide-react";

const ExpenseDetailsWeb = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noRecords, setNoRecords] = useState(false);
  const [filter, setFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expenseTypeItems, setExpenseTypeItems] = useState([]);
  const [headItems, setHeadItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    Unattended: 0,
    rejected: 0,
  });
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --- Capping Info State ---
  const [userCapping, setUserCapping] = useState(null);
  const [todayTotal, setTodayTotal] = useState(0);

  // Fetch capping info and today's total
  useEffect(() => {
    const fetchCappingInfo = async () => {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");
      if (!userId || !token) return;
      // Fetch capping
      const cappingResponse = await fetch("https://demo-expense.geomaticxevs.in/ET-api/capping_amount_api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ u_id: userId })
      });
      const cappingData = await cappingResponse.json();
      if (cappingData.success && cappingData.data) {
        setUserCapping(parseFloat(cappingData.data.total_expense_amount));
      } else {
        setUserCapping(null);
      }
      // Fetch today's expenses
      const todayResponse = await fetch("https://demo-expense.geomaticxevs.in/ET-api/my-expenses.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId })
      });
      const todayData = await todayResponse.json();
      if (todayData.status === "success" && todayData.data) {
        const today = new Date().toISOString().split('T')[0];
        const todayExpensesList = todayData.data.filter(expense => {
          const expenseDate = new Date(expense.expense_date).toISOString().split('T')[0];
          return expenseDate === today;
        });
        const total = todayExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0);
        setTodayTotal(total);
      } else if (Array.isArray(todayData)) {
        const today = new Date().toISOString().split('T')[0];
        const todayExpensesList = todayData.filter(expense => {
          const expenseDate = new Date(expense.expense_date).toISOString().split('T')[0];
          return expenseDate === today;
        });
        const total = todayExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0);
        setTodayTotal(total);
      }
    };
    fetchCappingInfo();
  }, []);

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

  const filteredExpenses = expenses.filter((expense) => {
    const matchesStatus =
      selectedStatus === "All" || expense.expense_status === selectedStatus;
    const matchesFilter = filter ? expense.expense_status === filter : true;
    const matchesSearch = expense.expense_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Date filter logic
    let matchesDate = true;
    if (fromDate && toDate) {
      matchesDate =
        expense.expense_date >= fromDate && expense.expense_date <= toDate;
    } else if (fromDate) {
      matchesDate = expense.expense_date >= fromDate;
    } else if (toDate) {
      matchesDate = expense.expense_date <= toDate;
    }

    return matchesStatus && matchesFilter && matchesSearch && matchesDate;
  });

  // Update stats based on filteredExpenses
  const filteredStats = {
    total: filteredExpenses.length,
    approved: filteredExpenses.filter(
      (exp) => exp.expense_status === "Approved"
    ).length,
    Unattended: filteredExpenses.filter(
      (exp) => exp.expense_status === "Unattended"
    ).length,
    rejected: filteredExpenses.filter(
      (exp) => exp.expense_status === "Rejected"
    ).length,
  };

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
      {userCapping !== null && (
        <div className="capping-info">
          <div className="capping-item">
            <span className="capping-label">Daily Capping Limit:</span>
            <span className="capping-value">₹{userCapping}</span>
          </div>
          <div className="capping-item">
            <span className="capping-label">Today's Submitted:</span>
            <span className="capping-value">₹{todayTotal}</span>
          </div>
          <div className="capping-item">
            <span className="capping-label">Remaining Today:</span>
            <span className={`capping-value ${(userCapping - todayTotal) < 0 ? 'capping-exceeded' : 'capping-remaining'}`}>
              ₹{(userCapping - todayTotal).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      <div className="myexpenses-stats-grid">
        <div className="myexpenses-stat-card">
          <div
            className="myexpenses-stat-icon"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
            }}
          >
            <DollarSign size={28} />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Total Expenses</h3>
            <div className="myexpenses-stat-value">{filteredStats.total}</div>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div
            className="myexpenses-stat-icon"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff",
            }}
          >
            <CheckCircle size={28} />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Approved</h3>
            <div className="myexpenses-stat-value">
              {filteredStats.approved}
            </div>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div
            className="myexpenses-stat-icon"
            style={{
              background: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
              color: "#fff",
            }}
          >
            <Clock size={28} />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Unattended</h3>
            <div className="myexpenses-stat-value">
              {filteredStats.Unattended}
            </div>
          </div>
        </div>
        <div className="myexpenses-stat-card">
          <div
            className="myexpenses-stat-icon"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "#fff",
            }}
          >
            <XCircle size={28} />
          </div>
          <div className="myexpenses-stat-info">
            <h3>Rejected</h3>
            <div className="myexpenses-stat-value">
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
        <div className="myexpenses-expenses-grid">
          {paginatedExpenses.map((expense) => (
            <div
              key={expense.expense_id}
              className="myexpensescard"
              data-status={expense.expense_status}
              style={{ position: "relative" }}
            >
              <div className="myexpensesheader">
                <div
                  className="myexpensesheader-content"
                  style={{ minHeight: 24 }}
                >
                  <h1 className="myexpenses-title-name">
                    {expense.expense_type_name}
                  </h1>
                  {/* Always reserve space for the header, even if title is null */}
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
                  className={`myexpenses-status-badge myexpenses-status-${expense.expense_status.toLowerCase()}`}
                >
                  {expense.expense_status}
                </span>
              </div>
              <div className="myexpensesdetails">
                <div className="myexpensestitle-section">
                  {expense.expense_comment && (
                    <p className="myexpensescomment">
                      {expense.expense_comment}
                    </p>
                  )}
                </div>
                <div className="myexpensesdates">
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
                      <span className="myexpenses-date-label">
                        Approved By:
                      </span>
                      <span className="myexpenses-date-value">
                        {expense.expense_approved_by}
                      </span>
                    </div>
                  )}
                  {expense.expense_rejected_by && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">
                        Rejected By:
                      </span>
                      <span className="myexpenses-date-value">
                        {expense.expense_rejected_by}
                      </span>
                    </div>
                  )}
                  {expense.expense_submitted_to && (
                    <div className="myexpenses-date-item">
                      <span className="myexpenses-date-label">
                        Submitted To:
                      </span>
                      <span className="myexpenses-date-value">
                        {expense.expense_submitted_to}
                      </span>
                    </div>
                  )}
                  {expense.expense_documents &&
                    expense.expense_documents.length > 0 && (
                      <div className="myexpenses-date-item">
                        <span className="myexpenses-date-label">
                          Documents:
                        </span>
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
                  const total =
                    values.length > 1
                      ? `= ₹${Object.values(categoryMap).reduce(
                          (a, b) => a + Number(b),
                          0
                        )}`
                      : "";
                  return (
                    <div
                      className="myexpenses-breakdown-badge myexpenses-breakdown-bottom"
                      style={{
                        "--breakdown-cols": categories.length + 1,
                      }}
                    >
                      <div className="myexpenses-breakdown-categories">
                        {categories.map((cat, idx) => (
                          <span
                            key={cat}
                            className="myexpenses-breakdown-category-label"
                          >
                            {cat}
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
                  <td>{expense.expense_type_name}</td>
                  <td>{expense.expense_date}</td>
                  <td>{expense.expense_status}</td>
                  <td>₹{expense.expense_amount}</td>
                  <td>{expense.expense_submitted_to}</td>
                  <td>{expense.expense_approved_by || "-"}</td>
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
                                <td title={d.expense_head_name}>
                                  {d.expense_head_name &&
                                  d.expense_head_name.length > 8
                                    ? d.expense_head_name.slice(0, 8) + "..."
                                    : d.expense_head_name}
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
