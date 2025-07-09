// File: AllRequisitions.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./myrequisition.css";
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
  DollarSign,
  CheckCircle,
  RotateCcw,
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
  const [viewMode, setViewMode] = useState("card");
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const userId = localStorage.getItem("userid");
        const token = localStorage.getItem("authToken");

        if (!userId || !token) {
          window.location.href = "/";
          return;
        }

        setLoading(true);
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/my-requisitions.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = "/";
          return;
        }

        const data = await response.json();
        console.log("Fetched Requisitions:", data);

        // Transform the data with proper field mapping
        const transformedData = data.map((item) => ({
          requisition_id: item.requisition_id,
          requisition_title: item.requisition_title || "No Title",
          requisition_desc: item.requisition_desc || "",
          requisition_date: item.requisition_date,
          requisition_app_amount: item.requisition_app_amount || "0",
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

      // Date filter logic
      let matchesDate = true;
      if (fromDate) {
        const reqDate = new Date(r.requisition_date);
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        matchesDate = reqDate >= from;
      }
      if (matchesDate && toDate) {
        const reqDate = new Date(r.requisition_date);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchesDate = reqDate <= to;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, requisitions, fromDate, toDate]);

  // Live update stats based on filtered data
  const liveStats = {
    total: filtered.length,
    approved: filtered.filter((r) => r.requisition_status === "Approved")
      .length,
    rejected: filtered.filter((r) => r.requisition_status === "Rejected")
      .length,
    unattended: filtered.filter((r) => r.requisition_status === "Unattended")
      .length,
    partiallyApproved: filtered.filter(
      (r) => r.requisition_status === "Partially Approved"
    ).length,
  };

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
    <div className="leaves-container">
      <h1 className="allleavespage-title">My Requisitions</h1>

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
            <h3>Total Requisitions</h3>
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
              background:
                "linear-gradient(135deg,rgb(255, 106, 0) 0%, #334155 100%)",
              color: "#fff",
            }}
          >
            <CheckCircle size={28} />
          </div>
          <div className="allexpense-stat-info">
            <h3>Partially Approved</h3>
            <div className="allexpense-stat-value">
              {liveStats.partiallyApproved}
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

      {/* Search and Filters */}
      <div className="myleavesfilters-section">
        <div className="myleavessearch-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search requisitions..."
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
          <option>Partially Approved</option>
        </select>
        <button
          className="requestedrequesitionfilter-reset-btn"
          title="Reset Filters"
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
          {paginated.map((item, idx) => (
            <div
              className="leave-card"
              key={item.requisition_id || idx}
              data-status={item.requisition_status}
              style={{ background: getStatusBg(item.requisition_status) }}
              onClick={() => setSelected(item)}
            >
              <div className="leave-header">
                <div className="leave-header-content">
                  <span className="leave-type">{item.requisition_title}</span>
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
              <div className="requestedleaves-leave-details">
                <div className="requestedleaves-leave-dates">
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Amount:</span>
                    <span className="requestedleaves-date-value">
                      ₹{parseFloat(item.requisition_req_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">
                      Submission Date:
                    </span>
                    <span className="requestedleaves-date-value">
                      {new Date(item.requisition_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">
                      Submitted To:
                    </span>
                    <span className="requestedleaves-date-value">
                      {item.submitted_to_full_name || "Not submitted"}
                    </span>
                  </div>
                  {item.requisition_status !== "Unattended" && (
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">
                        Approved/Rejected By:
                      </span>
                      <span className="requestedleaves-date-value">
                        {item.submitted_to_full_name}
                      </span>
                    </div>
                  )}
                  {item.requisition_status !== "Unattended" && (
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">
                        Approved amount:
                      </span>
                      <span className="requestedleaves-date-value">
                        ₹{item.requisition_app_amount}
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
                <th>Requisition ID</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Submitted To</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, idx) => (
                <tr key={item.requisition_id || idx}>
                  <td>{item.requisition_id}</td>
                  <td>{item.requisition_title}</td>
                  <td>
                    ₹{parseFloat(item.requisition_req_amount || 0).toFixed(2)}
                  </td>
                  <td>{item.requisition_status}</td>
                  <td>
                    {new Date(item.requisition_date).toLocaleDateString()}
                  </td>
                  <td>{item.created_by_full_name}</td>
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
    </div>
  );
}
