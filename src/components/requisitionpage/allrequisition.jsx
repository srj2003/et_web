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
      return matchesSearch && matchesStatus;
    });
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, requisitions]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="requestedrequisition-loading-container">
        <div className="requestedrequisition-loading-spinner"></div>
        <div className="requestedrequisition-loading-text">
          Loading Requisition...
        </div>
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
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <AlertCircle size={24} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>Total Requisitions</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <h3>Unattended</h3>
            <p className="stat-value">{stats.unattended}</p>
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
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <div className="stat-info">
            <h3>partiallyApproved</h3>
            <p className="stat-value">{stats.partiallyApproved}</p>
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

      {/* Requisitions Grid */}
      <div className="requisition-requisitions-grid">
        {paginated.map((item, idx) => (
          <div
            className="requisition-requisition-card"
            key={idx}
            data-status={item.requisition_status}
            style={{ background: getStatusBg(item.requisition_status) }}
            onClick={() => setSelected(item)}
          >
            <div className="requisition-card-header">
              <div className="requisition-submission-flow">
                <div className="requisition-name-container">
                  <h3 className="requisition-employee-name">
                    {item.created_by_full_name}
                  </h3>
                  <div className="requisition-submission-arrow">
                    <ArrowRight size={16} color="#6366f1" />
                    <span>
                      {item.submitted_to_full_name || "Not submitted"}
                    </span>
                  </div>
                </div>
                <span
                  className="requisition-status-badge"
                  style={{
                    backgroundColor: getStatusColor(item.requisition_status),
                  }}
                >
                  {item.requisition_status}
                </span>
              </div>
            </div>
            <div className="requisition-requisition-details">
              <h4 className="requisition-requisition-title">
                {item.requisition_title}
              </h4>
              <span className="requisition-amount">
                ₹{parseFloat(item.requisition_req_amount).toFixed(2)}
              </span>
            </div>
            <div className="requisition-requisition-meta">
              <span className="requisition-date">
                {new Date(item.requisition_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

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
