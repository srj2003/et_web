import React, { useState, useEffect } from "react";
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle size={20} color="#10b981" />;
      case "Pending":
        return <Clock size={20} color="#f59e0b" />;
      case "Rejected":
        return <XCircle size={20} color="#ef4444" />;
      default:
        return null;
    }
  };

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

  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      selectedStatus === "All" ? true : leave.leave_status === selectedStatus;
    const matchesSearch = leave.leave_type
      ? leave.leave_type.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    return matchesStatus && matchesSearch;
  });

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

      <div className="myleavesstats-grid">
        <div className="myleavesstat-card">
          <div className="myleavesstat-icon">
            <Calendar size={24} color="#6366f1" />
          </div>
          <div className="myleavesstat-info">
            <h3>Total Leaves</h3>
            <p className="myleavesstat-value">{stats.total}</p>
          </div>
        </div>
        <div className="myleavesstat-card">
          <div className="myleavesstat-icon">
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="myleavesstat-info">
            <h3>Approved</h3>
            <p className="myleavesstat-value">{stats.approved}</p>
          </div>
        </div>
        <div className="myleavesstat-card">
          <div className="myleavesstat-icon">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="myleavesstat-info">
            <h3>Unattended</h3>
            <p className="myleavesstat-value">{stats.unattended}</p>
          </div>
        </div>
        <div className="myleavesstat-card">
          <div className="myleavesstat-icon">
            <XCircle size={24} color="#ef4444" />
          </div>
          <div className="myleavesstat-info">
            <h3>Rejected</h3>
            <p className="myleavesstat-value">{stats.rejected}</p>
          </div>
        </div>
      </div>

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

      <div className="myleavesleaves-grid">
        {paginatedLeaves.map((leave) => (
          <div key={leave.leave_id} className="myleavesleave-card">
            <div className="myleavesleave-header">
              <div className="myleavesleave-title-section">
                <h3 className="myleavesleave-title">{leave.title}</h3>
                <p className="myleavesleave-subtitle">{leave.leave_type}</p>
              </div>
              <span
                className={`myleavesstatus-badge ${getStatusClass(
                  leave.leave_status
                )}`}
              >
                {getStatusIcon(leave.leave_status)}
                {leave.leave_status}
              </span>
            </div>
            <div className="myleavesleave-details">
              <div className="myleavesleave-info">
                <span className="myleavesinfo-label">From Date</span>
                <span className="myleavesinfo-value">{leave.from_date}</span>
              </div>
              <div className="myleavesleave-info">
                <span className="myleavesinfo-label">To Date</span>
                <span className="myleavesinfo-value">{leave.to_date}</span>
              </div>
              <div className="myleavesleave-info">
                <span className="myleavesinfo-label">Duration</span>
                <span className="myleavesinfo-value">
                  {leave.duration} days
                </span>
              </div>
              {leave.leave_reason && (
                <div className="myleavesleave-info myleavesfull-width">
                  <span className="myleavesinfo-label">Reason</span>
                  <span className="myleavesinfo-value">
                    {leave.leave_reason}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
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
    </div>
  );
};

export default MyLeaves;
