import React, { useState, useEffect } from 'react';
import './my_expense.css';
import { DollarSign, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

const ExpenseDetailsWeb = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noRecords, setNoRecords] = useState(false);
    const [filter, setFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchExpenses = async () => {
            const userId = localStorage.getItem('userid');
            if (!userId) {
                console.error('User ID not found');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`https://demo-expense.geomaticxevs.in/ET-api/my-expenses.php?userId=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.status === 'error') {
                    console.error('API Error:', data.message);
                    setExpenses([]);
                    setNoRecords(true);
                } else if (Array.isArray(data)) {
                    setExpenses(data);
                    setNoRecords(false);
                    // Calculate stats
                    setStats({
                        total: data.length,
                        approved: data.filter(exp => exp.expense_status === 'Approved').length,
                        pending: data.filter(exp => exp.expense_status === 'Pending').length,
                        rejected: data.filter(exp => exp.expense_status === 'Rejected').length
                    });
                } else {
                    console.error('Unexpected response format:', data);
                }
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle size={20} color="#10b981" />;
            case 'Pending':
                return <Clock size={20} color="#f59e0b" />;
            case 'Rejected':
                return <XCircle size={20} color="#ef4444" />;
            default:
                return null;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved':
                return 'status-approved';
            case 'Pending':
                return 'status-pending';
            case 'Rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    const filteredExpenses = expenses.filter((expense) => {
        const matchesFilter = filter ? expense.expense_status === filter : true;
        const matchesSearch = expense.expense_title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
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
        <div className="expense-details-container">
            <h1 className="page-title">My Expense</h1>
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
                        className={`filter-button ${filter === null ? 'active' : ''}`}
                        onClick={() => setFilter(null)}
                    >
                        All
                    </button>
                    <button
                        className={`filter-button ${filter === 'Approved' ? 'active' : ''}`}
                        onClick={() => setFilter('Approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={`filter-button ${filter === 'Pending' ? 'active' : ''}`}
                        onClick={() => setFilter('Pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-button ${filter === 'Rejected' ? 'active' : ''}`}
                        onClick={() => setFilter('Rejected')}
                    >
                        Rejected
                    </button>
                </div>
            </div>

            <div className="expenses-grid">
                {filteredExpenses.map((expense) => (
                    <div key={expense.expense_id} className="expense-card">
                        <div className="expense-header">
                            <h3 className="expense-title">{expense.expense_title}</h3>
                            <span className={`status-badge ${getStatusClass(expense.expense_status)}`}>
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
                                <span className="info-value amount">₹{expense.expense_amount}</span>
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
        </div>
    );
};

export default ExpenseDetailsWeb;