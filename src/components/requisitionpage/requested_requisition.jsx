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
    "Partially Approved": 0,
  });
  const ITEMS_PER_PAGE = 16;

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
            approved: transformedData.filter(
              (req) => req.requisition_status === "Approved"
            ).length,
            rejected: transformedData.filter(
              (req) => req.requisition_status === "Rejected"
            ).length,
            partiallyApproved: transformedData.filter(
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

    return matchesSearch && matchesStatus;
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
        <div className="requestedleaves-loading-text">Loading Requisitions...</div>
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
    <>
      <div className="requestedleaves-container">
        <h1 className="requestedleaves-page-title">Requested Requisitions</h1>
        <div className="requestedleaves-stats-grid">
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
              <p className="stat-value">{stats["Partially Approved"]}</p>
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
        <div className="requestedleaves-filters-section">
          <div className="requestedleaves-search-container">
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="requestedleaves-search-input"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="requestedleaves-filter-button"
          >
            <option value="All">All Status</option>
            <option value="Unattended">Unattended</option>
            <option value="Approved">Approved</option>
            <option value="Partially Approved">Partially Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="requestedleaves-leaves-grid">
          {paginatedRequisitions.map((requisition) => {
            const statusColor = getStatusColor(requisition.requisition_status);
            const cardGradient = getCardGradient(requisition.requisition_status);
            const disappearClass =
              disappearing[requisition.requisition_id] === "approve"
                ? "requestedleaves-disappearing-approve"
                : disappearing[requisition.requisition_id] === "reject"
                ? "requestedleaves-disappearing-reject"
                : "";
            return (
              <div
                key={requisition.requisition_id}
                className={`requestedleaves-leave-card ${disappearClass}`}
                data-status={requisition.requisition_status}
                style={{ background: cardGradient }}
                onClick={() => {
                  setSelectedRequisition(requisition);
                  setShowRequisitionDetails(true);
                }}
              >
                <div className="requestedleaves-leave-header">
                  <div className="requestedleaves-leave-header-content">
                    <div className="requestedleaves-employee-name">{requisition.employee}</div>
                    <span className="requestedleaves-leave-type">{requisition.requisition_type}</span>
                  </div>
                  <span
                    className={`requestedleaves-status-badge requestedleaves-status-${requisition.requisition_status.replace(/\s/g, '').toLowerCase()}`}
                    style={statusColor}
                  >
                    {requisition.requisition_status}
                  </span>
                </div>
                <div className="requestedleaves-leave-details">
                  <div className="requestedleaves-leave-title-section">
                    <div className="requestedleaves-leave-title">{requisition.requisition_title}</div>
                  </div>
                  {requisition.requisition_comment && (
                    <div className="requestedleaves-leave-comment">{requisition.requisition_comment}</div>
                  )}
                  <div className="requestedleaves-leave-dates">
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">Requested</span>
                      <span className="requestedleaves-date-value">₹{requisition.requested_amount?.toFixed(2)}</span>
                    </div>
                    <div className="requestedleaves-date-item">
                      <span className="requestedleaves-date-label">Date</span>
                      <span className="requestedleaves-date-value">{requisition.requisition_date}</span>
                    </div>
                    {requisition.requisition_status !== "Unattended" && (
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">Approved</span>
                        <span className="requestedleaves-date-value">₹{(requisition.approved_amount || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {requisition.requisition_status === "Unattended" && (
                    <div className="requestedleaves-leave-actions">
                      <button
                        className="requestedleaves-action-button requestedleaves-approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(
                            requisition.requisition_id,
                            "approve",
                            requisition.requested_amount
                          );
                        }}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        className="requestedleaves-action-button requestedleaves-approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequisition(requisition);
                          setShowRequisitionDetails(true);
                        }}
                      >
                        <Check size={16} /> Partial
                      </button>
                      <button
                        className="requestedleaves-action-button requestedleaves-reject"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(requisition.requisition_id, "reject");
                        }}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                <span className="requestedleaves-detail-value">₹{selectedRequisition.requested_amount?.toFixed(2)}</span>
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
                  <span className="requestedleaves-detail-value">₹{(selectedRequisition.approved_amount || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
            {selectedRequisition.requisition_comment && (
              <div className="requestedleaves-detail-item requestedleaves-full-width">
                <span className="requestedleaves-detail-label">Comment</span>
                <span className="requestedleaves-detail-value">{selectedRequisition.requisition_comment}</span>
              </div>
            )}
            {selectedRequisition.requisition_status === "Unattended" && (
              <div className="requestedleaves-modal-actions">
                <input
                  type="number"
                  className="requestedleaves-search-input"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder="Enter amount for partial approval"
                  style={{ maxWidth: 180 }}
                />
                <button
                  className="requestedleaves-action-button requestedleaves-approve"
                  onClick={() =>
                    handleAction(
                      selectedRequisition.requisition_id,
                      "approve",
                      parseFloat(approvedAmount) || selectedRequisition.requested_amount
                    )
                  }
                >
                  Approve
                </button>
                <button
                  className="requestedleaves-action-button requestedleaves-approve"
                  onClick={() =>
                    handleAction(
                      selectedRequisition.requisition_id,
                      "partial",
                      parseFloat(approvedAmount)
                    )
                  }
                >
                  Partial Approval
                </button>
                <button
                  className="requestedleaves-action-button requestedleaves-reject"
                  onClick={() =>
                    handleAction(
                      selectedRequisition.requisition_id,
                      "reject"
                    )
                  }
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
