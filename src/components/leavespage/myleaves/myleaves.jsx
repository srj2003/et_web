import React, { useState, useEffect } from "react";
import moment from "moment";
import "./myleaves.css";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  Calendar1,
} from "lucide-react";

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noRecords, setNoRecords] = useState(false);
  const [filter, setFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // View mode toggle: "card" or "table"
  const [viewMode, setViewMode] = useState("card");

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userid");

        if (!token || !userId) {
          window.location.href = "/";
          return;
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/my-leaves.php",
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
        if (data.status === "error") {
          console.error("API Error:", data.message);
          setLeaves([]);
          setNoRecords(true);
        } else if (Array.isArray(data.data)) {
          const formattedLeaves = data.data.map((leave) => ({
            leave_id: leave.leave_id,
            leave_type: leave.leave_ground_text,
            leave_status: leave.leave_track_status_text,
            from_date: leave.leave_from_date,
            to_date: leave.leave_to_date,
            duration: calculateDuration(
              leave.leave_from_date,
              leave.leave_to_date
            ),
            leave_reason: leave.leave_comment,
            title: leave.leave_title,
            created_at: leave.leave_track_created_at,
            approved_rejected_at: leave.leave_track_approved_rejected_at,
            submitted_to:
              leave.leave_track_submitted_to_full_name ||
              leave.leave_track_submitted_to ||
              null,
            approved_rejected_by: leave.leave_track_approved_rejected_by
              ? leave.leave_track_submitted_to_full_name
              : null,
          }));

          setLeaves(formattedLeaves);
          setNoRecords(formattedLeaves.length === 0);

          // Update stats with new status text
          setStats({
            total: formattedLeaves.length,
            approved: formattedLeaves.filter(
              (leave) => leave.leave_status === "Approved"
            ).length,
            pending: formattedLeaves.filter(
              (leave) => leave.leave_status === "Pending"
            ).length,
            rejected: formattedLeaves.filter(
              (leave) => leave.leave_status === "Rejected"
            ).length,
            unattended: formattedLeaves.filter(
              (leave) => leave.leave_status === "Unattended"
            ).length,
          });
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        if (error.message.includes("401")) {
          window.location.href = "/";
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    // Helper function to calculate duration between dates
    const calculateDuration = (fromDate, toDate) => {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end dates
    };

    fetchLeaves();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Pending":
        return "status-pending";
      case "Rejected":
        return "status-rejected";
      case "Unattended":
        return "status-unattended";
      default:
        return "";
    }
  };

  // Filtered leaves and live-updating stats based on all filters (search, status, date)
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      selectedStatus === "All" ? true : leave.leave_status === selectedStatus;
    const matchesSearch = leave.leave_type
      ? leave.leave_type.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    // Use moment for robust date comparison
    let matchesDateRange = true;
    let filterFrom = fromDate
      ? moment(fromDate, "YYYY-MM-DD").startOf("day")
      : null;
    let filterTo = toDate ? moment(toDate, "YYYY-MM-DD").endOf("day") : null;
    if (filterFrom && filterTo) {
      const leaveFrom = moment(leave.from_date, "YYYY-MM-DD");
      const leaveTo = moment(leave.to_date, "YYYY-MM-DD");
      matchesDateRange =
        leaveFrom.isSameOrAfter(filterFrom) &&
        leaveFrom.isSameOrBefore(filterTo);
    } else if (filterFrom) {
      const leaveFrom = moment(leave.from_date, "YYYY-MM-DD");
      matchesDateRange = leaveFrom.isSameOrAfter(filterFrom);
    } else if (filterTo) {
      const leaveFrom = moment(leave.from_date, "YYYY-MM-DD");
      matchesDateRange = leaveFrom.isSameOrBefore(filterTo);
    }
    return matchesStatus && matchesSearch && matchesDateRange;
  });

  // Live update stats based on filteredLeaves
  const liveStats = {
    total: filteredLeaves.length,
    approved: filteredLeaves.filter(
      (leave) => leave.leave_status === "Approved"
    ).length,
    pending: filteredLeaves.filter((leave) => leave.leave_status === "Pending")
      .length,
    rejected: filteredLeaves.filter(
      (leave) => leave.leave_status === "Rejected"
    ).length,
    unattended: filteredLeaves.filter(
      (leave) => leave.leave_status === "Unattended"
    ).length,
  };

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="myleaves-loading-container">
        <div className="myleaves-loading-spinner"></div>
        <div className="myleaves-loading-text">Loading leaves...</div>
      </div>
    );
  }

  if (noRecords) {
    return (
      <div className="no-records-container">
        <div className="no-records-content">
          <Calendar size={48} color="#64748b" />
          <h2>No Leave Records</h2>
          <p>You haven't applied for any leaves yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaves-container">
      <h1 className="myleavespage-title">My Leaves</h1>

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
            <div className="allexpense-stat-value">{liveStats.total}</div>
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
            <div className="allexpense-stat-value">{liveStats.approved}</div>
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
            <div className="allexpense-stat-value">{liveStats.unattended}</div>
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
            <div className="allexpense-stat-value">{liveStats.rejected}</div>
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
        <div className="requestedleaves-leaves-grid">
          {paginatedLeaves.map((leave) => (
            <div
              key={leave.leave_id}
              className="leave-card"
              data-status={leave.leave_status}
            >
              <div className="requestedleaves-leave-header">
                <div className="requestedleaves-leave-header-content">
                  <span className="requestedleaves-leave-type">
                    {leave.leave_type}
                  </span>
                </div>
                <span
                  className={`requestedleaves-status-badge requestedleaves-status-${leave.leave_status.toLowerCase()}`}
                >
                  {leave.leave_status}
                </span>
              </div>
              <div className="requestedleaves-leave-details">
                <div className="requestedleaves-leave-dates">
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">From:</span>
                    <span className="requestedleaves-date-value">
                      {leave.from_date}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">To:</span>
                    <span className="requestedleaves-date-value">
                      {leave.to_date}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">
                      Duration:
                    </span>
                    <span className="requestedleaves-date-value">
                      {leave.duration} days
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Status:</span>
                    <span className="requestedleaves-date-value">
                      {leave.leave_status}
                    </span>
                  </div>
                  {leave.submitted_to && (
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">
                        Submitted To:
                      </span>
                      <span className="requestedleaves-date-value">
                        {leave.submitted_to}
                      </span>
                    </div>
                  )}
                  {(leave.leave_status === "Approved" ||
                    leave.leave_status === "Rejected") &&
                    leave.approved_rejected_by && (
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">
                          Approved/Rejected By:
                        </span>
                        <span className="requestedleaves-date-value">
                          {leave.approved_rejected_by}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="myexpenses-table-container">
          <table className="myexpenses-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Submitted To</th>
                <th>Approved/Rejected By</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.map((leave) => (
                <tr key={leave.leave_id}>
                  <td>{leave.title}</td>
                  <td>{leave.leave_type}</td>
                  <td>{leave.from_date}</td>
                  <td>{leave.to_date}</td>
                  <td>{leave.duration} days</td>
                  <td>{leave.leave_status}</td>
                  <td>{leave.submitted_to || "-"}</td>
                  <td>
                    {(leave.leave_status === "Approved" ||
                      leave.leave_status === "Rejected") &&
                    leave.approved_rejected_by
                      ? leave.approved_rejected_by
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
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
    </div>
  );
};

export default MyLeaves;
