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
} from "lucide-react";

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
    case undefined:
      return "Unattended";
    default:
      return "Unattended";
  }
};

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

export default function MyRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null); // Add this line
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
    // Get user ID from localStorage
    const storedUserId = localStorage.getItem("userid");
    console.log("Stored User ID:", storedUserId);

    if (!storedUserId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    setUserId(storedUserId);

    const fetchRequisitions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://demo-expense.geomaticxevs.in/ET-api/my-requisitions.php`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: storedUserId }),
          }
        );
        const data = await response.json();
        console.log("Fetched Requisitions:", data);

        // Transform the data with proper field mapping
        const transformedData = data.map((item) => ({
          requisition_id: item.requisition_id,
          requisition_title: item.requisition_title || "No Title",
          requisition_desc: item.requisition_desc || "",
          requisition_date:
            item.requisition_created_at || new Date().toISOString(),
          requisition_status: getStatusText(item.requisition_status),
          requisition_req_amount: item.requisition_req_amount || "0",
          created_by_full_name: `${item.user_first_name || ""} ${
            item.user_last_name || ""
          }`.trim(),
          user_email: item.user_email || "",
          submitted_to_full_name:
            item.submitted_to_full_name || "Not submitted",
        }));

        console.log("Transformed Data:", transformedData);
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
        console.error("Fetch error:", err);
        setError("Failed to fetch requisitions");
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading requisitions...</p>
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
      <div className="no-records-container">
        <div className="no-records-content">
          <AlertCircle size={48} color="#64748b" />
          <h2>No Requisitions Found</h2>
          <p>You haven't submitted any requisitions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="requisitions-container">
      <h1 className="page-title">My Requisitions</h1>

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
            <X size={24} color="#ef4444" />
          </div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search requisitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="filter-button"
        >
          <option>All</option>
          <option>Unattended</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Partially Approved</option>
        </select>
      </div>

      {/* Requisitions Grid */}
      <div className="requisitions-grid">
        {paginated.map((item, idx) => (
          <div
            className="requisition-card"
            key={item.requisition_id || idx}
            onClick={() => setSelected(item)}
          >
            <div className="card-header">
              <div className="submission-flow">
                <div className="name-container">
                  <h3 className="employee-name">
                    {item.created_by_full_name || "Unknown User"}
                  </h3>
                  <div className="submission-arrow">
                    <ArrowRight size={16} color="#6366f1" />
                    <span>
                      {item.submitted_to_full_name || "Not submitted"}
                    </span>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(item.requisition_status),
                  }}
                >
                  {item.requisition_status}
                </span>
              </div>
            </div>
            <div className="requisition-details">
              <h4 className="requisition-title">
                {item.requisition_title || "No Title"}
              </h4>
              <span className="amount">
                ₹{parseFloat(item.requisition_req_amount || 0).toFixed(2)}
              </span>
            </div>
            <div className="requisition-meta">
              <span className="date">
                {new Date(item.requisition_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="pagination-container">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <div className="pagination-number">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="pagination-button"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Requisition Details</h2>
              <button
                className="close-button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>{selected.requisition_title}</h3>
                <p className="employee-name">{selected.created_by_full_name}</p>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">
                    ₹{parseFloat(selected.requisition_req_amount).toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    {selected.requisition_status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {new Date(selected.requisition_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submitted To</span>
                  <span className="detail-value">
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
