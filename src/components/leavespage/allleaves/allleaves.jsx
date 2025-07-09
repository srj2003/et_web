import React, { useState, useEffect } from "react";
import moment from "moment";
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
  DollarSign,
  Calendar1,
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
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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
          "https://demo-expense.geomaticxevs.in/ET-api/all-leaves.php",
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

  // Filtered leaves and stats based on all filters (search, status, date)
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
      // Use moment for robust date comparison
      let matchesDateRange = true;
      let filterFrom = fromDate
        ? moment(fromDate, "YYYY-MM-DD").startOf("day")
        : null;
      let filterTo = toDate ? moment(toDate, "YYYY-MM-DD").endOf("day") : null;
      if (filterFrom && filterTo) {
        const leaveFrom = moment(leave.leave_from_date, "YYYY-MM-DD");
        const leaveTo = moment(leave.leave_to_date, "YYYY-MM-DD");
        matchesDateRange =
          leaveFrom.isSameOrAfter(filterFrom) &&
          leaveTo.isSameOrBefore(filterTo);
      } else if (filterFrom) {
        const leaveFrom = moment(leave.leave_from_date, "YYYY-MM-DD");
        matchesDateRange = leaveFrom.isSameOrAfter(filterFrom);
      } else if (filterTo) {
        const leaveTo = moment(leave.leave_to_date, "YYYY-MM-DD");
        matchesDateRange = leaveTo.isSameOrBefore(filterTo);
      }
      return matchesSearch && matchesStatus && matchesDateRange;
    });
    setFiltered(filteredData);
    setCurrentPage(1);
    // Update stats based on filteredData
    setStats({
      total: filteredData.length,
      unattended: filteredData.filter(
        (l) => l.leave_track_status_text === "Unattended"
      ).length,
      approved: filteredData.filter(
        (l) => l.leave_track_status_text === "Approved"
      ).length,
      rejected: filteredData.filter(
        (l) => l.leave_track_status_text === "Rejected"
      ).length,
    });
  }, [searchQuery, selectedStatus, fromDate, toDate, leaves]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <h1 className="allleavespage-title">All Leaves</h1>

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
            <Calendar1 size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Total Leaves</h3>
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
        <div>
          <button
            className="requestedrequesitionfilter-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("All");
              setFromDate && setFromDate("");
              setToDate && setToDate("");
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
        <div className="leaves-grid">
          {paginated.map((leave, idx) => (
            <div
              className="leave-card"
              key={leave.leave_id || idx}
              data-status={leave.leave_track_status_text}
            >
              {/* View Details button in bottom left */}
              <div className="leave-header">
                <div className="leave-header-content">
                  <span className="leave-type">{leave.leave_ground_text}</span>
                </div>
                <span
                  className={`status-badge status-${leave.leave_track_status_text?.toLowerCase?.()}`}
                  title={leave.leave_track_status_text}
                >
                  {leave.leave_track_status_text}
                </span>
              </div>
              <div
                className="requestedleaves-leave-details"
                onClick={() => setSelectedLeave(leave)}
              >
                <div className="requestedleaves-leave-dates">
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">From:</span>
                    <span className="requestedleaves-date-value">
                      {leave.leave_from_date}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">To:</span>
                    <span className="requestedleaves-date-value">
                      {leave.leave_to_date}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">
                      Duration:
                    </span>
                    <span className="requestedleaves-date-value">
                      {(() => {
                        const start = new Date(leave.leave_from_date);
                        const end = new Date(leave.leave_to_date);
                        if (isNaN(start) || isNaN(end)) return "-";
                        const diffTime = Math.abs(end - start);
                        return (
                          Math.ceil(diffTime / (1000 * 60 * 60 * 24)) +
                          1 +
                          " days"
                        );
                      })()}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">
                      Created By:
                    </span>
                    <span className="requestedleaves-date-value">
                      {leave.employee_name}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Status:</span>
                    <span className="requestedleaves-date-value">
                      {leave.leave_track_status_text ||
                        leave.leave_track_status ||
                        leave.leave_status ||
                        "-"}
                    </span>
                  </div>
                  {(leave.leave_track_submitted_to_full_name ||
                    leave.leave_track_submitted_to) && (
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">
                        Submitted To:
                      </span>
                      <span className="requestedleaves-date-value">
                        {leave.leave_track_submitted_to_full_name ||
                          leave.leave_track_submitted_to}
                      </span>
                    </div>
                  )}
                  {/* Only show Approved/Rejected By if present and status is Approved/Rejected */}
                  {(leave.leave_track_status_text === "Approved" ||
                    leave.leave_track_status_text === "Rejected") &&
                    (leave.leave_track_approved_rejected_by_full_name ||
                      leave.leave_track_approved_rejected_by) && (
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">
                          Approved/Rejected By:
                        </span>
                        <span className="requestedleaves-date-value">
                          {leave.leave_track_approved_rejected_by
                            ? leave.leave_track_submitted_to_full_name
                            : null}
                        </span>
                      </div>
                    )}
                </div>
                <button
                  className="card-view-details-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLeave(leave);
                  }}
                  style={{ marginTop: "1.5rem" }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="myexpenses-table-container">
          <table className="myexpenses-table">
            <thead>
              <tr>
                <th>Leave ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created By</th>
                <th>Submitted To</th>
                <th>Approved/Rejected By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((leave, idx) => (
                <tr
                  key={leave.leave_id || idx}
                  onClick={() => setSelectedLeave(leave)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{leave.leave_id}</td>
                  <td>{leave.leave_title}</td>
                  <td>{leave.leave_ground_text}</td>
                  <td>{leave.leave_from_date}</td>
                  <td>{leave.leave_to_date}</td>
                  <td>
                    {leave.leave_track_status_text ||
                      leave.leave_track_status ||
                      leave.leave_status ||
                      "-"}
                  </td>
                  <td>
                    {(() => {
                      const start = new Date(leave.leave_from_date);
                      const end = new Date(leave.leave_to_date);
                      if (isNaN(start) || isNaN(end)) return "-";
                      const diffTime = Math.abs(end - start);
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    })()}{" "}
                    days
                  </td>
                  <td>{leave.employee_name}</td>
                  <td>
                    {leave.leave_track_submitted_to_full_name ||
                      leave.leave_track_submitted_to ||
                      "-"}
                  </td>
                  <td>
                    {leave.leave_track_approved_rejected_by
                      ? leave.leave_track_submitted_to_full_name
                      : "-"}
                  </td>
                  <td>
                    <div
                      className="requestedexpenses-details-menu-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="requestedexpenses-details-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuRow((prev) =>
                            prev === leave.leave_id ? null : leave.leave_id
                          );
                        }}
                        aria-label="More options"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="6" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="18" r="1" />
                        </svg>
                      </button>
                      {openMenuRow === leave.leave_id && (
                        <div className="requestedexpenses-details-menu-dropdown">
                          <button
                            className="requestedexpenses-details-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeave(leave);
                              setOpenMenuRow(null);
                            }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
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
                <h2>{selectedLeave.leave_ground_text}</h2>
                <h3>{selectedLeave.leave_title}</h3>
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
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">
                    {(() => {
                      const start = new Date(selectedLeave.leave_from_date);
                      const end = new Date(selectedLeave.leave_to_date);
                      const diffTime = Math.abs(end - start);
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    })()}{" "}
                    days
                  </span>
                </div>
                <div className="detail-comment-block">
                  <span className="detail-label">Comment</span>
                  <div className="detail-comment-value">
                    {selectedLeave.leave_comment}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By</span>
                  <span className="detail-value">
                    {selectedLeave.employee_name}
                  </span>
                </div>
                {/* Comment on a separate line for better readability */}
                <div className="detail-item">
                  <span className="detail-label">Submitted To</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_submitted_to_full_name ||
                      selectedLeave.leave_track_submitted_to ||
                      "-"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Approved/Rejected By</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_approved_rejected_by
                      ? selectedLeave.leave_track_submitted_to_full_name
                      : "-"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_created_at}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Updated At</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_updated_at}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Approved/Rejected At</span>
                  <span className="detail-value">
                    {selectedLeave.leave_track_approved_rejected_at || "-"}
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
