import React, { useState, useEffect } from "react";
import "../leavespage/requestedleaves/requestedleaves.css";
import { Search, ChevronLeft, ChevronRight, Check, X, Clock, AlertCircle } from "react-feather";

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return { background: "rgba(16, 185, 129, 0.15)", color: "#059669", border: "1px solid rgba(16, 185, 129, 0.2)" };
    case "Partially Approved":
      return { background: "rgba(251, 191, 36, 0.15)", color: "#b45309", border: "1px solid rgba(251, 191, 36, 0.2)" };
    case "Rejected":
      return { background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.2)" };
    case "Unattended":
    default:
      return { background: "rgba(100, 116, 139, 0.15)", color: "#475569", border: "1px solid rgba(100, 116, 139, 0.2)" };
  }
};

const getCardGradient = (status) => {
  switch (status) {
    case "Approved":
      return "linear-gradient(145deg, #f0fdf4, #dcfce7)";
    case "Rejected":
      return "linear-gradient(145deg, #fef2f2, #fee2e2)";
    default:
      return "#fff";
  }
};

const RequisitionsWeb = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showRequisitionDetails, setShowRequisitionDetails] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [disappearing, setDisappearing] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    Unattended: 0,
    Approved: 0,
    Rejected: 0,
    PartiallyApproved: 0,
  });
  const ITEMS_PER_PAGE = 16;
  const [viewMode, setViewMode] = useState("card"); // Added viewMode state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
        if (Array.isArray(data)) {
          const userRequisitions = data.filter(
            (item) => item.requisition_submitted_to === parseInt(userId, 10)
          );
          const transformedData = userRequisitions.map((item) => ({
            id: item.requisition_id.toString(),
            requisition_id: item.requisition_id,
            employee: item.created_by_full_name,
            requisition_title: item.requisition_title,
            requisition_type: getRequisitionType(item.requisition_type),
            requisition_date: formatDate(item.requisition_date),
            requisition_status: getStatus(item.requisition_status),
            requisition_comment: item.requisition_comment || "No comments",
            submitted_to: item.submitted_to_full_name,
            approved_by: item.approved_rejected_by_full_name,
            requested_amount: item.requisition_req_amount,
            approved_amount: item.requisition_app_amount,
          }));

          setRequisitions(transformedData);

          // Calculate stats
          setStats({
            total: transformedData.length,
            Unattended: transformedData.filter(
              (req) => req.requisition_status === "Unattended"
            ).length,
            Approved: transformedData.filter(
              (req) => req.requisition_status === "Approved"
            ).length,
            Rejected: transformedData.filter(
              (req) => req.requisition_status === "Rejected"
            ).length,
            PartiallyApproved: transformedData.filter(
              (req) => req.requisition_status === "Partially Approved"
            ).length,
          });
        }
      } catch (error) {
        console.error("Error fetching requisitions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, [refreshKey]);

  const handleAction = async (requisition_id, action, amount) => {
    try {
      if (action === "partial" && !amount) {
        alert("Please enter the amount to approve");
        return;
      }
      const userId = localStorage.getItem("userid");
      if (!userId) {
        alert("User ID not found");
        return;
      }
      const statusCode =
        action === "approve" ? 1 : action === "partial" ? 2 : 0;
      const apiAction = action === "partial" ? "approve" : action;
      setDisappearing((prev) => ({ ...prev, [requisition_id]: action }));
      setTimeout(async () => {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/approve_reject_requisitions.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requisition_id,
              action: apiAction,
              user_id: parseInt(userId, 10),
              status: statusCode,
              approved_amount: amount || 0,
            }),
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          alert(
            `Requisition ${
              action === "partial" ? "partially approved" : action + "d"
            } successfully`
          );
          setRequisitions((prevRequisitions) =>
            prevRequisitions.map((req) =>
              req.requisition_id === requisition_id
                ? {
                    ...req,
                    requisition_status:
                      statusCode === 1
                        ? "Approved"
                        : statusCode === 2
                        ? "Partially Approved"
                        : "Rejected",
                    approved_amount: amount || 0,
                  }
                : req
            )
          );
          setShowRequisitionDetails(false);
          setSelectedRequisition(null);
        } else {
          alert(data.message);
        }
        setDisappearing((prev) => {
          const copy = { ...prev };
          delete copy[requisition_id];
          return copy;
        });
      }, 500);
    } catch (error) {
      console.error("Error handling action:", error);
      alert("Failed to process the action. Please try again.");
    }
  };

  const filteredRequisitions = requisitions.filter((requisition) => {
    const matchesSearch =
      requisition.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requisition.requisition_title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" ||
      requisition.requisition_status === selectedStatus;

    const reqDate = new Date(requisition.requisition_date);
    const fromFilter = fromDate ? new Date(fromDate) : null;
    const toFilter = toDate ? new Date(toDate) : null;
    const matchesFrom = fromFilter ? reqDate >= fromFilter : true;
    const matchesTo = toFilter ? reqDate <= toFilter : true;

    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filteredRequisitions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequisitions = filteredRequisitions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-loading-spinner"></div>
        <div className="requestedleaves-loading-text">Loading requisitions...</div>
      </div>
    );
  }
  if (!requisitions.length) {
    return (
      <div className="requestedleaves-loading-container">
        <div className="requestedleaves-no-documents">
          <AlertCircle size={48} color="#64748b" />
          <h2>No Requested Requisitions</h2>
          <p>No requisitions have been submitted for your approval.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="leaves-container">
      <h1 className="allleavespage-title">Requested Requisitions</h1>
      {/* Stats Grid (keep as is) */}
      <div className="allexpense-stats-grid">
        <div className="requestedleaves-stat-card">
            <div className="stat-icon"><AlertCircle size={24} color="#6366f1" /></div>
            <div className="stat-info">
              <h3>Total</h3>
              <p className="stat-value">{stats.total}</p>
            </div>
          </div>
          <div className="requestedleaves-stat-card">
            <div className="stat-icon"><Clock size={24} color="#64748b" /></div>
            <div className="stat-info">
              <h3>Unattended</h3>
              <p className="stat-value">{stats.Unattended}</p>
            </div>
          </div>
          <div className="requestedleaves-stat-card">
            <div className="stat-icon"><Check size={24} color="#10b981" /></div>
            <div className="stat-info">
              <h3>Approved</h3>
              <p className="stat-value">{stats.Approved}</p>
            </div>
          </div>
          <div className="requestedleaves-stat-card">
            <div className="stat-icon"><Check size={24} color="#fbbf24" /></div>
            <div className="stat-info">
              <h3>Partially Approved</h3>
              <p className="stat-value">{stats.PartiallyApproved}</p>
            </div>
          </div>
          <div className="requestedleaves-stat-card">
            <div className="stat-icon"><X size={24} color="#ef4444" /></div>
            <div className="stat-info">
              <h3>Rejected</h3>
              <p className="stat-value">{stats.Rejected}</p>
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
      </div>
      
      <div className="requisition-date-filter-container">
          <label>From: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
          <label>To: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
        </div>
      {/* Card/Table View Toggle */}
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
          {paginatedRequisitions.map((item, idx) => (
            <div
              className="leave-card"
              key={item.requisition_id || idx}
              data-status={item.requisition_status}
              style={{ background: getCardGradient(item.requisition_status), position: 'relative' }}
              onClick={() => {
                setSelectedRequisition(item);
                setShowRequisitionDetails(true);
              }}
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
                    <span className="requestedleaves-date-value">₹{Number(item.requested_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Date:</span>
                    <span className="requestedleaves-date-value">{item.requisition_date}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Created By:</span>
                    <span className="requestedleaves-date-value">{item.employee}</span>
                  </div>
                  <div className="requestedleaves-date-item">
                    <span className="requestedleaves-date-label">Submitted To:</span>
                    <span className="requestedleaves-date-value">{item.submitted_to}</span>
                  </div>
                </div>
              </div>
              <button
                className="card-view-details-button"
                onClick={e => {
                  e.stopPropagation();
                  setSelectedRequisition(item);
                  setShowRequisitionDetails(true);
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
              {paginatedRequisitions.map((item, idx) => (
                <tr key={item.requisition_id || idx} onClick={() => {
                  setSelectedRequisition(item);
                  setShowRequisitionDetails(true);
                }} style={{ cursor: 'pointer' }}>
                  <td>{item.requisition_id}</td>
                  <td>{item.requisition_title}</td>
                  <td>₹{Number(item.requested_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                  <td>{item.requisition_status}</td>
                  <td>{item.requisition_date}</td>
                  <td>{item.employee}</td>
                  <td>{item.submitted_to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal for requisition details */}
      {showRequisitionDetails && selectedRequisition && (
        <div className="requestedleaves-modal-overlay">
          <div className="requestedleaves-modal-content">
            <div className="requestedleaves-modal-header">
              <h2>Requisition Details</h2>
              <button
                className="requestedleaves-close-button"
                onClick={() => setShowRequisitionDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="requestedleaves-details-section">
              <h3>{selectedRequisition.requisition_title}</h3>
              <p className="requestedleaves-employee-name">{selectedRequisition.employee}</p>
            </div>
            <div className="requestedleaves-details-grid">
              <div className="requestedleaves-detail-item">
                <span className="requestedleaves-detail-label">Requested Amount</span>
                <span className="requestedleaves-detail-value">₹{Number(selectedRequisition.requested_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="requestedleaves-detail-item">
                <span className="requestedleaves-detail-label">Type</span>
                <span className="requestedleaves-detail-value">{selectedRequisition.requisition_type}</span>
              </div>
              <div className="requestedleaves-detail-item">
                <span className="requestedleaves-detail-label">Date</span>
                <span className="requestedleaves-detail-value">{selectedRequisition.requisition_date}</span>
              </div>
              <div className="requestedleaves-detail-item">
                <span className="requestedleaves-detail-label">Status</span>
                <span className="requestedleaves-detail-value">{selectedRequisition.requisition_status}</span>
              </div>
              {selectedRequisition.requisition_status !== "Unattended" && (
                <div className="requestedleaves-detail-item">
                  <span className="requestedleaves-detail-label">Approved Amount</span>
                  <span className="requestedleaves-detail-value">₹{Number(selectedRequisition.approved_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
              )}
            </div>
            {selectedRequisition.requisition_comment && (
              <div className="requestedleaves-detail-item requestedleaves-full-width">
                <span className="requestedleaves-detail-label">Comment</span>
                <span className="requestedleaves-detail-value">{selectedRequisition.requisition_comment}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Pagination (keep as is) */}
      {totalPages > 0 && (
        <div className="requisition-pagination-container">
          <button
            className="requisition-pagination-button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} /> Previous
          </button>
          <div className="requisition-pagination-number">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="requisition-pagination-button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getRequisitionType = (typeCode) => {
  switch (typeCode) {
    case 0:
      return "Office Supplies";
    case 1:
      return "Travel Request";
    case 2:
      return "Equipment Purchase";
    default:
      return "Other";
  }
};

const getStatus = (statusCode) => {
  if (statusCode === null) return "Unattended";
  switch (statusCode) {
    case 0:
      return "Rejected";
    case 1:
      return "Approved";
    case 2:
      return "Partially Approved";
    default:
      return "Unattended";
  }
};

export default RequisitionsWeb;
