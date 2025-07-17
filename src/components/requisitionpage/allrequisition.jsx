// File: AllRequisitions.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./allrequisition.css";
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
  AlertTriangle,
  DollarSign,
  CheckCircle
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "#10b981";
    case "Partially Approved":
      return "#fbbf24";
    case "Rejected":
      return "#ef4444";
    case "Unattended":
      return "#64748b";
    default:
      return "#64748b";
  }
};

const getStatusBg = (status) => {
  switch (status) {
    case "Approved":
      return "linear-gradient(145deg, #f0fdf4, #dcfce7)";
    case "Rejected":
      return "linear-gradient(145deg, #fef2f2, #fee2e2)";
    case "Partially Approved":
      return "linear-gradient(145deg, #fef9c3, #fef08a)";
    case "Unattended":
      return "linear-gradient(145deg, #f1f5f9, #e2e8f0)";
    default:
      return "white";
  }
};

const getStatusText = (status) => {
  // Convert to string for consistent comparison
  status = String(status);

  switch (status) {
    case "2":
      return "Approved";
    case "1":
      return "Partially Approved";
    case "0":
      return "Rejected";
    case "null":
    case null:
      return "Unattended";
    default:
      return "Unattended";
  }
};

export default function AllRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    unattended: 0,
    partiallyApproved: 0,
  });
  const itemsPerPage = 10;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userid");

        if (!token || !userId) {
          window.location.href = "/";
          return;
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/all-requisition.php",
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

        const data = await response.json();
        console.log(data);
        const transformedData = data.map((item) => ({
          ...item,
          requisition_status: getStatusText(item.requisition_status),
        }));
        setRequisitions(transformedData);
        setFiltered(transformedData);

        // Calculate stats
        setStats({
          total: transformedData.length,
          pending: transformedData.filter(
            (r) => r.requisition_status === "Pending"
          ).length,
          approved: transformedData.filter(
            (r) => r.requisition_status === "Approved"
          ).length,
          rejected: transformedData.filter(
            (r) => r.requisition_status === "Rejected"
          ).length,
          unattended: transformedData.filter(
            (r) => r.requisition_status === "Unattended"
          ).length,
          partiallyApproved: transformedData.filter(
            (r) => r.requisition_status === "Partially Approved"
          ).length,
        });
      } catch (err) {
        setError("Failed to fetch requisitions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, []);

  useEffect(() => {
    const filteredData = requisitions.filter((r) => {
      const matchesSearch =
        r.created_by_full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        r.requisition_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "All" || r.requisition_status === selectedStatus;
      const reqDate = new Date(r.requisition_date);
      const fromFilter = fromDate ? new Date(fromDate) : null;
      const toFilter = toDate ? new Date(toDate) : null;
      const matchesFrom = fromFilter ? reqDate >= fromFilter : true;
      const matchesTo = toFilter ? reqDate <= toFilter : true;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, requisitions, fromDate, toDate]);

  const [viewMode, setViewMode] = useState("card");
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-loading-spinner"></div>
        <div className="requestedleaves-loading-text">Loading requisitions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!requisitions.length) {
    return (
      <div className="requisition-no-records-container">
        <div className="requisition-no-records-content">
          <AlertCircle size={48} color="#64748b" />
          <h2>No Requisitions Found</h2>
          <p>There are no requisitions to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="requisition-page-title">All Requisitions</h1>

      {/* Stats Grid */}
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
            <div className="allexpense-stat-value">{stats.total}</div>
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
            <div className="allexpense-stat-value">{stats.approved}</div>
          </div>
        </div>
        <div className="allexpense-stat-card">
          <div
            className="allexpense-stat-icon"
            style={{
              background: "linear-gradient(135deg,rgb(255, 106, 0) 0%, #334155 100%)",
              color: "#fff",
            }}
          >
            <CheckCircle size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Partially Approved</h3>
            <div className="allexpense-stat-value">
              {stats.partiallyApproved}
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
            <div className="allexpense-stat-value">{stats.unattended}</div>
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
            <div className="allexpense-stat-value">{stats.rejected}</div>
          </div>
        </div>
      </div>


      {/* Search and Filters */}
      <div className="requisition-filters-section">
        <div className="requisition-search-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search requisitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="requisition-search-input"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="requisition-filter-button"
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Unattended</option>
          <option>Partially Approved</option>
        </select>
      </div>
      
      <div className="requisition-date-filter-container">
          <label>From: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
          <label>To: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        </div>

      {/* View Toggle */}
      <div className="myexpenses-view-toggle">
        <button
          className={`myexpenses-view-btn${viewMode === "card" ? " active" : ""}`}
          onClick={() => setViewMode("card")}
        >
          Card View
        </button>
        <button
          className={`myexpenses-view-btn${viewMode === "table" ? " active" : ""}`}
          onClick={() => setViewMode("table")}
        >
          Table View
        </button>
      </div>

      {viewMode === "card" ? (
        <div className="leaves-grid">
          {paginated.map((item, idx) => (
            <div
              className="leave-card"
              key={item.requisition_id || idx}
              data-status={item.requisition_status}
              style={{ background: getStatusBg(item.requisition_status), position: 'relative' }}
              onClick={() => setSelected(item)}
            >
              <div className="leave-header">
                <div className="leave-header-content">
                  <span className="leave-type">{item.requisition_title}</span>
                </div>
                <span
                  className={`status-badge status-${item.requisition_status?.toLowerCase?.()}`}
                  title={item.requisition_status}
                >
                  {item.requisition_status}
                </span>
              </div>
              <div className="requestedleaves-leave-details">
                <div className="requestedleaves-leave-dates">
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Amount:</span>
                    <span className="requestedleaves-date-value">₹{Number(item.requisition_req_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Date:</span>
                    <span className="requestedleaves-date-value">{item.requisition_date}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Created By:</span>
                    <span className="requestedleaves-date-value">{item.created_by_full_name}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Submitted To:</span>
                    <span className="requestedleaves-date-value">{item.submitted_to_full_name || "Not submitted"}</span>
                  </div>
                </div>
              </div>
              <button
                className="card-view-details-button"
                onClick={e => {
                  e.stopPropagation();
                  setSelected(item);
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
                <th>Employee</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Submitted To</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.created_by_full_name}</td>
                  <td>{item.requisition_title}</td>
                  <td>₹{parseFloat(item.requisition_req_amount).toFixed(2)}</td>
                  <td>{item.requisition_status}</td>
                  <td>{new Date(item.requisition_date).toLocaleDateString()}</td>
                  <td>{item.submitted_to_full_name || "Not submitted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="requisition-pagination-container">
          <button
            className="requisition-pagination-button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <div className="requisition-pagination-number">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="requisition-pagination-button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="requisition-modal-overlay">
          <div className="requisition-modal-content">
            <div className="requisition-modal-header">
              <h2>Requisition Details</h2>
              <button
                className="requisition-close-button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="requisition-modal-body">
              <div className="requisition-details-section">
                <h3>{selected.requisition_title}</h3>
                <p className="requisition-employee-name">
                  {selected.created_by_full_name}
                </p>
              </div>
              <div className="requisition-details-grid">
                <div className="requisition-detail-item">
                  <span className="requisition-detail-label">Amount</span>
                  <span className="requisition-detail-value requisition-amount">
                    ₹{parseFloat(selected.requisition_req_amount).toFixed(2)}
                  </span>
                </div>
                <div className="requisition-detail-item">
                  <span className="requisition-detail-label">Status</span>
                  <span className="requisition-detail-value">
                    {selected.requisition_status}
                  </span>
                </div>
                <div className="requisition-detail-item">
                  <span className="requisition-detail-label">Date</span>
                  <span className="requisition-detail-value">
                    {new Date(selected.requisition_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="requisition-detail-item">
                  <span className="requisition-detail-label">Submitted To</span>
                  <span className="requisition-detail-value">
                    {selected.submitted_to_full_name || "Not submitted"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
