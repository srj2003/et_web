import React, { useState, useEffect } from "react";
import "./allleaves.css";
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "#10b981";
    case "Pending":
      return "#f59e0b";
    case "Rejected":
      return "#ef4444";
    case "Unattended":
      return "#64748b";
    default:
      return "#64748b";
  }
};

export default function AllLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unattended: 0,
    approved: 0,
    rejected: 0,
  });
  const itemsPerPage = 16;

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/all-leaves.php"
        );
        const data = await response.json();
        console.log("API Response:", data);
        setLeaves(data);
        setFiltered(data);

        // Calculate stats
        setStats({
          total: data.length,
          unattended: data.filter(
            (l) => l.leave_track_status_text === "Unattended"
          ).length,
          approved: data.filter((l) => l.leave_track_status_text === "Approved")
            .length,
          rejected: data.filter((l) => l.leave_track_status_text === "Rejected")
            .length,
        });
      } catch (err) {
        setError("Failed to fetch leaves");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  useEffect(() => {
    const filteredData = leaves.filter((leave) => {
      const matchesSearch =
        leave.employee_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        leave.leave_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "All" ||
        leave.leave_track_status_text === selectedStatus;
      return matchesSearch && matchesStatus;
    });
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, leaves]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading leaves...</p>
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

  return (
    <div className="leaves-container">
      <h1 className="page-title">All Leaves</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>Total Leaves</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} color="#64748b" />
          </div>
          <div className="stat-info">
            <h3>Unattended</h3>
            <p className="stat-value">{stats.unattended}</p>
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
            <XCircle size={24} color="#ef4444" />
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
            placeholder="Search leaves..."
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
        </select>
      </div>

      {/* Leaves Grid */}
      <div className="leaves-grid">
        {paginated.map((leave, idx) => (
          <div
            className="leave-card"
            key={leave.leave_id || idx}
            onClick={() => setSelectedLeave(leave)}
          >
            <div className="leave-header">
              <div className="leave-header-content">
                <h3 className="employee-name">{leave.employee_name}</h3>
                <span className="leave-type">{leave.leave_ground_text}</span>
              </div>
              <span
                className={`status-badge status-${leave.leave_track_status_text.toLowerCase()}`}
              >
                {leave.leave_track_status_text}
              </span>
            </div>
            <div className="leave-details">
              <div className="leave-title-section">
                <h4 className="leave-title">{leave.leave_title}</h4>
                <p className="leave-comment">{leave.leave_comment}</p>
              </div>
              <div className="leave-dates">
                <div className="date-item">
                  <span className="date-label">From:</span>
                  <span className="date-value">
                    {new Date(leave.leave_from_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="date-item">
                  <span className="date-label">To:</span>
                  <span className="date-value">
                    {new Date(leave.leave_to_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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

      {/* Leave Details Modal */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Leave Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedLeave(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>{selectedLeave.leave_title}</h3>
                <p className="employee-name">{selectedLeave.employee_name}</p>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className="detail-value"
                    style={{
                      color: getStatusColor(
                        selectedLeave.leave_track_status_text
                      ),
                    }}
                  >
                    {selectedLeave.leave_track_status_text}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">From Date</span>
                  <span className="detail-value">
                    {new Date(
                      selectedLeave.leave_from_date
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">To Date</span>
                  <span className="detail-value">
                    {new Date(selectedLeave.leave_to_date).toLocaleDateString()}
                  </span>
                </div>
                {selectedLeave.leave_ground && (
                  <div className="detail-item">
                    <span className="detail-label">Reason</span>
                    <span className="detail-value">
                      {selectedLeave.leave_ground_text}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
