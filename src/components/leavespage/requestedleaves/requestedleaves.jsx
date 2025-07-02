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
    case "Rejected":
      return "#ef4444";
    case "Unattended":
      return "#64748b";
    default:
      return "#64748b";
  }
};

const getStatusText = (status) => {
  if (status === null) return "Unattended";
  switch (status) {
    case 1:
      return "Approved";
    case 0:
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
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userid");

        if (!token || !userId) {
          window.location.href = "/";
          return;
        }

        setLoading(true);
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/manage_leaves.php",
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
            rejected: data.filter((l) => l.leave_track_status === 0).length,
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
    const filteredData = leaves
      .filter((leave) => leave.leave_id) // Ensure leave exists
      .filter((leave) => {
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

      const cardElement = document.querySelector(
        `[data-leave-id="${leaveId}"]`
      );
      if (!cardElement) return;

      cardElement.classList.add(
        action === "approve" ? "disappearing-approve" : "disappearing-reject"
      );

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_leaves.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Update leaves state and stats
        setLeaves((prevLeaves) => {
          const updatedLeaves = prevLeaves.filter(
            (leave) => leave.leave_id !== leaveId
          );

          // Update stats
          setStats((prevStats) => ({
            total: prevStats.total,
            unattended: prevStats.unattended - 0.5,
            approved:
              action === "approve"
                ? prevStats.approved + 0.5
                : prevStats.approved,
            rejected:
              action === "reject"
                ? prevStats.rejected + 0.5
                : prevStats.rejected,
          }));

          return updatedLeaves;
        });

        const remainingCards = document.querySelectorAll(
          ".leave-card:not(.disappearing-approve):not(.disappearing-reject)"
        );
        remainingCards.forEach((card) => {
          card.classList.add("appearing");
        });

        setSelectedLeave(null);

        setTimeout(() => {
          remainingCards.forEach((card) => {
            card.classList.remove("appearing");
          });
        }, 300);
      } else {
        alert(data.message || "Failed to process action");
        cardElement.classList.remove(
          "disappearing-approve",
          "disappearing-reject"
        );
      }
    } catch (error) {
      console.error("Error handling action:", error);
      alert("Failed to process the action. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-loading-spinner"></div>
        <div className="requestedleaves-loading-text">Loading leaves...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="requestedleaves-error-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="requestedleaves-container">
      <h1 className="requestedleaves-page-title">Requested Leaves</h1>

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
      <div className="myleavesfilters-section">
        <div className="myleavessearch-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search leaves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="myleavessearch-input"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="myleavesfilter-button"
        >
          <option>All</option>
          <option>Unattended</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      {/* Leaves Grid */}
      <div className="requestedleaves-leaves-grid">
        {paginated.map((leave, idx) => (
          <div
            className="requestedleaves-leave-card"
            key={leave.leave_id || idx}
            data-leave-id={leave.leave_id}
            onClick={() => setSelectedLeave(leave)}
            data-status={getStatusText(leave.leave_track_status)}
          >
            <div className="requestedleaves-leave-header">
              <div className="requestedleaves-leave-header-content">
                <h3 className="requestedleaves-employee-name">
                  {leave.user_name}
                </h3>
                <span className="requestedleaves-leave-type">
                  {leave.leave_ground_text}
                </span>
              </div>
              <span
                className={`requestedleaves-status-badge requestedleaves-status-${getStatusText(
                  leave.leave_track_status
                ).toLowerCase()}`}
              >
                {getStatusText(leave.leave_track_status)}
              </span>
            </div>
            <div className="requestedleaves-leave-details">
              <div className="requestedleaves-leave-title-section">
                <h4 className="requestedleaves-leave-title">
                  {leave.leave_title}
                </h4>
                <p className="requestedleaves-leave-comment">
                  {leave.leave_comment}
                </p>
              </div>
              <div className="requestedleaves-leave-dates">
                <div className="requestedleaves-date-item">
                  <span className="requestedleaves-date-label">From:</span>
                  <span className="requestedleaves-date-value">
                    {new Date(leave.leave_from_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="requestedleaves-date-item">
                  <span className="requestedleaves-date-label">To:</span>
                  <span className="requestedleaves-date-value">
                    {new Date(leave.leave_to_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Add action buttons for unattended leaves */}
            {leave.leave_track_status === null && (
              <div className="requestedleaves-leave-actions">
                <button
                  className="requestedleaves-action-button requestedleaves-approve"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(leave.leave_id, "approve");
                  }}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  className="requestedleaves-action-button requestedleaves-reject"
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

      {/* Leave Details Modal */}
      {selectedLeave && (
        <div className="requestedleaves-modal-overlay">
          <div className="requestedleaves-modal-content">
            <div className="requestedleaves-modal-header">
              <h2>Leave Details</h2>
              <button
                className="requestedleaves-close-button"
                onClick={() => setSelectedLeave(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="requestedleaves-modal-body">
              <div className="requestedleaves-details-section">
                <h3>{selectedLeave.leave_title}</h3>
                <div className="requestedleaves-submission-flow">
                  <span className="requestedleaves-flow-item">
                    <span className="requestedleaves-flow-label">
                      Submitted By:
                    </span>
                    {selectedLeave.user_name}
                  </span>
                  <span className="requestedleaves-flow-arrow">→</span>
                  <span className="requestedleaves-flow-item">
                    <span className="requestedleaves-flow-label">
                      Submitted To:
                    </span>
                    {selectedLeave.submitted_to}
                  </span>
                </div>
              </div>
              <div className="requestedleaves-details-grid">
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">Leave ID</span>
                  <span className="requestedleaves-detail-value">
                    {selectedLeave.leave_id}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">Status</span>
                  <span
                    className="requestedleaves-detail-value"
                    style={{
                      color: getStatusColor(
                        getStatusText(selectedLeave.leave_track_status)
                      ),
                    }}
                  >
                    {getStatusText(selectedLeave.leave_track_status)}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">
                    Leave Type
                  </span>
                  <span className="requestedleaves-detail-value">
                    {selectedLeave.leave_ground}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">
                    From Date
                  </span>
                  <span className="requestedleaves-detail-value">
                    {new Date(
                      selectedLeave.leave_from_date
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">To Date</span>
                  <span className="requestedleaves-detail-value">
                    {new Date(selectedLeave.leave_to_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">
                    Created At
                  </span>
                  <span className="requestedleaves-detail-value">
                    {new Date(
                      selectedLeave.leave_track_created_at
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">
                    Created By ID
                  </span>
                  <span className="requestedleaves-detail-value">
                    {selectedLeave.leave_track_created_by}
                  </span>
                </div>
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">
                    Submitted To ID
                  </span>
                  <span className="requestedleaves-detail-value">
                    {selectedLeave.leave_track_submitted_to_id}
                  </span>
                </div>
                {selectedLeave.leave_comment && (
                  <div className="requestedleaves-detail-item requestedleaves-full-width">
                    <span className="requestedleaves-detail-label">
                      Comment
                    </span>
                    <span className="requestedleaves-detail-value">
                      {selectedLeave.leave_comment}
                    </span>
                  </div>
                )}
                {selectedLeave.documents ? (
                  <div className="requestedleaves-detail-item requestedleaves-full-width">
                    <div className="requestedleaves-documents-header">
                      <span className="requestedleaves-detail-label">
                        <FileText size={16} />
                        Documents
                      </span>
                    </div>
                    {selectedLeave.documents.length > 0 ? (
                      <div className="requestedleaves-documents-grid">
                        {selectedLeave.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={
                              "https://demo-expense.geomaticxevs.in/ET-api/" +
                              doc.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="requestedleaves-document-card"
                          >
                            <div className="requestedleaves-document-icon">
                              <FileText size={24} />
                            </div>
                            <div className="requestedleaves-document-info">
                              <span className="requestedleaves-document-name">
                                {doc.name}
                              </span>
                              <ExternalLink
                                size={14}
                                className="requestedleaves-external-icon"
                              />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="requestedleaves-no-documents">
                        <FileX size={24} />
                        <p>No documents attached</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {selectedLeave.leave_track_status === null && (
                <div className="requestedleaves-modal-actions">
                  <button
                    className="requestedleaves-action-button requestedleaves-approve"
                    onClick={() =>
                      handleAction(selectedLeave.leave_id, "approve")
                    }
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    className="requestedleaves-action-button requestedleaves-reject"
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
