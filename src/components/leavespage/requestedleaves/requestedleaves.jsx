import React, { useState, useEffect } from "react";
import "./requestedleaves.css";
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  FileX,
  ExternalLink,
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "#10b981";
    case "Unattended":
      return "#64748b";
    case "Rejected":
      return "#ef4444";
    default:
      return "#64748b";
  }
};

const getStatusText = (status) => {
  if (status === null) return "Unattended";
  switch (status) {
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    default:
      return "Unattended";
  }
};

export default function RequestedLeaves() {
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
          "https://demo-expense.geomaticxevs.in/ET-api/manage_leaves.php",
          {
            method: "GET",
          }
        );
        const data = await response.json();
        console.log("API Response:", data);
        if (Array.isArray(data)) {
          setLeaves(data);
          setFiltered(data);

          // Calculate stats based on leave_track_status
          setStats({
            total: data.length,
            unattended: data.filter((l) => l.leave_track_status === null)
              .length,
            approved: data.filter((l) => l.leave_track_status === 1).length,
            rejected: data.filter((l) => l.leave_track_status === 2).length,
          });
        } else {
          setError(data.message || "No data available");
        }
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
        leave.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.leave_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const leaveStatus = getStatusText(leave.leave_track_status);
      const matchesStatus =
        selectedStatus === "All" || leaveStatus === selectedStatus;
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

  const handleAction = async (leaveId, action) => {
    try {
      const userId = localStorage.getItem("userid");
      if (!userId) {
        alert("User ID not found");
        return;
      }

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_leaves.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leave_id: leaveId,
            action: action,
            user_id: parseInt(userId, 10),
            status: action === "approve" ? 1 : 2,
          }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        alert(`Leave ${action}d successfully`);
        // Update the local state
        setLeaves(
          leaves.map((leave) =>
            leave.leave_id === leaveId
              ? { ...leave, leave_track_status: action === "approve" ? 1 : 2 }
              : leave
          )
        );
        setSelectedLeave(null);
      } else {
        alert(data.message || "Failed to process action");
      }
    } catch (error) {
      console.error("Error handling action:", error);
      alert("Failed to process the action. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="page-title">Requested Leaves</h1>

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

      {/* Filters Section */}
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
                <h3 className="employee-name">{leave.user_name}</h3>
                <span className="leave-type">{leave.leave_ground_text}</span>
              </div>
              <span
                className={`status-badge status-${getStatusText(
                  leave.leave_track_status
                ).toLowerCase()}`}
              >
                {getStatusText(leave.leave_track_status)}
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

            {/* Add action buttons for unattended leaves */}
            {leave.leave_track_status === null && (
              <div className="leave-actions">
                <button
                  className="action-button approve"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(leave.leave_id, "approve");
                  }}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  className="action-button reject"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(leave.leave_id, "reject");
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
          <div className="pagination-info">
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
                <div className="submission-flow">
                  <span className="flow-item">
                    <span className="flow-label">Submitted By:</span>
                    {selectedLeave.user_name}
                  </span>
                  <span className="flow-arrow">→</span>
                  <span className="flow-item">
                    <span className="flow-label">Submitted To:</span>
                    {selectedLeave.submitted_to}
                  </span>
                </div>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Leave ID</span>
                  <span className="detail-value">{selectedLeave.leave_id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className="detail-value"
                    style={{
                      color: getStatusColor(
                        getStatusText(selectedLeave.leave_track_status)
                      ),
                    }}
                  >
                    {getStatusText(selectedLeave.leave_track_status)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Leave Type</span>
                  <span className="detail-value">
                    {selectedLeave.leave_ground}
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
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {new Date(
                      selectedLeave.leave_track_created_at
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By ID</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_created_by}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submitted To ID</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_submitted_to_id}
                  </span>
                </div>
                {selectedLeave.leave_comment && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Comment</span>
                    <span className="detail-value">
                      {selectedLeave.leave_comment}
                    </span>
                  </div>
                )}
                {selectedLeave.documents ? (
                  <div className="detail-item full-width">
                    <div className="documents-header">
                      <span className="detail-label">
                        <FileText size={16} />
                        Documents
                      </span>
                    </div>
                    {selectedLeave.documents.length > 0 ? (
                      <div className="documents-grid">
                        {selectedLeave.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={"https://demo-expense.geomaticxevs.in/ET-api/"+doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-card"
                          >
                            <div className="document-icon">
                              <FileText size={24} />
                            </div>
                            <div className="document-info">
                              <span className="document-name">{doc.name}</span>
                              <ExternalLink
                                size={14}
                                className="external-icon"
                              />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="no-documents">
                        <FileX size={24} />
                        <p>No documents attached</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {selectedLeave.leave_track_status === null && (
                <div className="modal-actions">
                  <button
                    className="action-button approve"
                    onClick={() =>
                      handleAction(selectedLeave.leave_id, "approve")
                    }
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    className="action-button reject"
                    onClick={() =>
                      handleAction(selectedLeave.leave_id, "reject")
                    }
                  >
                    <X size={16} />
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
}
