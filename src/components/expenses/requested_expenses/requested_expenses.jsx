import React, { useState, useEffect, useCallback } from 'react';
import './requested_expenses.css';
import { Search, Filter, Calendar, ArrowRight, AlertCircle, Clock, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';


// Define status types
const ExpenseStatus = {
    Unattended: "Unattended",
    Pending: "Pending",
    Approved: "Approved",
    Rejected: "Rejected"
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
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

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
            minute: "2-digit"
        });
    }, []);

    // Helper function to map expense types
    const getExpenseType = useCallback((typeCode) => {
        switch (typeCode) {
            case 0: return "Travel";
            case 1: return "Food";
            case 2: return "Accommodation";
            case 3: return "Office Supplies";
            default: return "Other";
        }
    }, []);

    // Helper function to map status
    const getStatus = useCallback((statusCode) => {
        if (statusCode === null) return ExpenseStatus.Unattended;
        switch (statusCode) {
            case 0: return ExpenseStatus.Rejected;
            case 1: return ExpenseStatus.Approved;
            case 2: return ExpenseStatus.Pending;
            default: return ExpenseStatus.Unattended;
        }
    }, []);

    // Data transformer function
    const transformExpenseData = useCallback((apiData) => {
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
    }, [formatDate, getExpenseType, getStatus]);

    // Fetch data from PHP endpoint
    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = localStorage.getItem("userid");
            if (!userId) {
                throw new Error("User ID not found");
            }

            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/manage_expense.php"
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();
            const filteredData = apiData.filter(
                (expense) => expense.expense_track_submitted_to === parseInt(userId, 10)
            );
            const transformedData = transformExpenseData(filteredData);
            setExpenses(transformedData);

            // Calculate stats
            setStats({
                total: transformedData.length,
                pending: transformedData.filter(exp => exp.status === ExpenseStatus.Pending).length,
                approved: transformedData.filter(exp => exp.status === ExpenseStatus.Approved).length,
                rejected: transformedData.filter(exp => exp.status === ExpenseStatus.Rejected).length
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
        const storedRoleId = localStorage.getItem("roleId");
        setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
    }, [fetchExpenses]);

    const handleAction = async (expense_id, action) => {
        try {
            const userId = localStorage.getItem("userid");
            if (!userId) {
                throw new Error("User ID not found");
            }

            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_expense.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        expense_track_id: expense_id,
                        action,
                        user_id: parseInt(userId, 10),
                    }),
                }
            );

            const data = await response.json();
            if (data.status === "success") {
                setExpenses((prevExpenses) =>
                    prevExpenses.map((expense) =>
                        expense.expense_id === expense_id
                            ? {
                                ...expense,
                                status: action === "approve" ? ExpenseStatus.Approved : ExpenseStatus.Rejected,
                            }
                            : expense
                    )
                );

                if (selectedExpense?.expense_id === expense_id) {
                    setSelectedExpense((prev) =>
                        prev
                            ? {
                                ...prev,
                                status: action === "approve" ? ExpenseStatus.Approved : ExpenseStatus.Rejected,
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
                expense.expense_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    if (loading && expenses.length === 0) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading expenses...</p>
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
        <div className="expenses-container">
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
                <div className="filter-container">
                    <button
                        className="filter-button"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                        <Filter size={20} color="#64748b" />
                        Filter
                    </button>
                    {showFilterDropdown && (
                        <div className="filter-dropdown">
                            <button onClick={() => handleFilterSelect("All")}>All</button>
                            <button onClick={() => handleFilterSelect("Unattended")}>Unattended</button>
                            <button onClick={() => handleFilterSelect("Pending")}>Pending</button>
                            <button onClick={() => handleFilterSelect("Approved")}>Approved</button>
                            <button onClick={() => handleFilterSelect("Rejected")}>Rejected</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="date-filter-container">
                <div className="date-filter-buttons">
                    <button
                        className={`date-filter-button ${dateRangeType === "today" ? "active" : ""}`}
                        onClick={() => handleDateRangeSelect("today")}
                    >
                        Today
                    </button>
                    <button
                        className={`date-filter-button ${dateRangeType === "lastMonth" ? "active" : ""}`}
                        onClick={() => handleDateRangeSelect("lastMonth")}
                    >
                        Last Month
                    </button>
                    <button
                        className={`date-filter-button ${dateRangeType === "custom" ? "active" : ""}`}
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

            <div className="expenses-grid">
                {paginatedExpenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="expense-card"
                        onClick={() => {
                            setSelectedExpense(expense);
                            setShowExpenseDetails(true);
                        }}
                    >
                        <div className="expense-header">
                            <div className="submission-flow">
                                <div className="name-container">
                                    <h3 className="employee-name">{expense.employee}</h3>
                                    <div className="submission-arrow">
                                        <ArrowRight size={16} color="#6366f1" />
                                        <span className="submitted-to-name">
                                            {expense.submitted_to || "Not submitted"}
                                        </span>
                                    </div>
                                </div>
                                <span className={`status-badge ${expense.status.toLowerCase()}`}>
                                    {expense.status}
                                </span>
                            </div>
                        </div>
                        <div className="expense-details">
                            <h4 className="expense-title">{expense.expense_title}</h4>
                            <span className="amount">₹{expense.amount.toFixed(2)}</span>
                        </div>
                        <div className="expense-meta">
                            <span className="expense-type">{expense.expense_type}</span>
                            <span className="date">{expense.date}</span>
                        </div>
                        {expense.remarks && (
                            <p className="remarks">{expense.remarks}</p>
                        )}
                        {expense.status === "Unattended" && roleId !== null && (roleId < 5 || roleId === 8) && (
                            <div className="expense-actions">
                                <button
                                    className="action-button approve"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(expense.expense_id, "approve");
                                    }}
                                >
                                    <Check size={16} />
                                    Approve
                                </button>
                                <button
                                    className="action-button reject"
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

            <div className="pagination">
                <button
                    className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="pagination-text">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className={`page-button ${currentPage === totalPages ? "disabled" : ""}`}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

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
                                    <span className="detail-value">{selectedExpense.expense_type}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date</span>
                                    <span className="detail-value">{selectedExpense.date}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`detail-value status ${selectedExpense.status.toLowerCase()}`}>
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
                                                                onClick={() => window.open(detail.expense_product_photo_path, '_blank')}
                                                                title="View Product Image"
                                                            >
                                                                <img src="/product-icon.png" alt="Product" />
                                                            </button>
                                                        )}
                                                        {detail.expense_product_bill_photo_path && (
                                                            <button
                                                                className="view-button bill"
                                                                onClick={() => window.open(detail.expense_product_bill_photo_path, '_blank')}
                                                                title="View Bill Image"
                                                            >
                                                                <img src="/bill-icon.png" alt="Bill" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {selectedExpense.status === "Unattended" && roleId !== null && (roleId < 5 || roleId === 8) && (
                                <div className="modal-actions">
                                    <button
                                        className="modal-button approve"
                                        onClick={() => handleAction(selectedExpense.expense_id, "approve")}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="modal-button reject"
                                        onClick={() => handleAction(selectedExpense.expense_id, "reject")}
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