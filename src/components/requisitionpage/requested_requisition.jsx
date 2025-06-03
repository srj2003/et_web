import React, { useState, useEffect } from "react";
import "./requested_requisition.css"; // Assuming you have a CSS file for styles
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";

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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userid");
        if (!userId) {
          console.error("User ID not found");
          return;
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/all-requisition.php"
        );
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
            pending: transformedData.filter(
              (req) => req.requisition_status === "Pending"
            ).length,
            approved: transformedData.filter(
              (req) => req.requisition_status === "Approved"
            ).length,
            rejected: transformedData.filter(
              (req) => req.requisition_status === "Rejected"
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
      if ((action === "approve" || action === "partial") && !amount) {
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
                  requisition_status: getStatus(statusCode),
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading requisitions...</p>
      </div>
    );
  }

  // Add after loading check
  if (!requisitions.length) {
    return (
      <div className="no-records-container">
        <div className="no-records-content">
          <AlertCircle size={48} color="#64748b" />
          <h2>No Requested Requisitions</h2>
          <p>No requisitions have been submitted for your approval.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="requisitions-container">
        <h1 className="page-title">Requested Requisitions</h1>
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
              <h3>Pending</h3>
              <p className="stat-value">{stats.pending}</p>
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
        <div className="filters-section">
          <div className="search-container">
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by name or title..."
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
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Partially Approved">Partially Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="requisitions-grid">
          {paginatedRequisitions.map((requisition) => (
            <div
              key={requisition.requisition_id}
              className="requisition-card"
              onClick={() => {
                setSelectedRequisition(requisition);
                setShowRequisitionDetails(true);
              }}
            >
              <div className="requisition-header">
                <h3 className="requisition-title">
                  {requisition.requisition_title}
                </h3>
                <span
                  className={`status-badge ${requisition.requisition_status.toLowerCase()}`}
                >
                  {requisition.requisition_status}
                </span>
              </div>
              <div className="requisition-details">
                <div className="requisition-info">
                  <span className="info-label">Employee:</span>
                  <span className="info-value">{requisition.employee}</span>
                </div>
                <div className="requisition-info">
                  <span className="info-label">Amount:</span>
                  <span className="info-value amount">
                    ₹{requisition.requested_amount.toFixed(2)}
                  </span>
                </div>
                <div className="requisition-info">
                  <span className="info-label">Type:</span>
                  <span className="info-value">
                    {requisition.requisition_type}
                  </span>
                </div>
                <div className="requisition-info">
                  <span className="info-label">Date:</span>
                  <span className="info-value">
                    {requisition.requisition_date}
                  </span>
                </div>
                {requisition.requisition_status !== "Pending" && (
                  <div className="requisition-info">
                    <span className="info-label">Approved Amount:</span>
                    <span className="info-value amount">
                      ₹{(requisition.approved_amount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {requisition.requisition_status === "Pending" ? (
                <div className="requisition-actions">
                  <button
                    className="action-button approve"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(
                        requisition.requisition_id,
                        "approve",
                        requisition.approved_amount
                      );
                    }}
                  >
                    <Check size={16} />
                    Approve
                  </button>
                  <button
                    className="action-button partial"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(
                        requisition.requisition_id,
                        "partial",
                        requisition.approved_amount
                      );
                    }}
                  >
                    <Check size={16} />
                    Partial
                  </button>
                  <button
                    className="action-button reject"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(requisition.requisition_id, "reject");
                    }}
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
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
        )}{" "}
      </div>

      {showRequisitionDetails && selectedRequisition && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Requisition Details</h2>
              <button
                className="close-button"
                onClick={() => setShowRequisitionDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>{selectedRequisition.requisition_title}</h3>
                <p className="employee-name">{selectedRequisition.employee}</p>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Requested Amount</span>
                  <span className="detail-value">
                    ₹{selectedRequisition.requested_amount.toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    {selectedRequisition.requisition_type}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {selectedRequisition.requisition_date}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className={`detail-value status ${selectedRequisition.requisition_status.toLowerCase()}`}
                  >
                    {selectedRequisition.requisition_status}
                  </span>
                </div>
              </div>
              {selectedRequisition.requisition_comment && (
                <div className="comment-section">
                  <h4>Comments</h4>
                  <p>{selectedRequisition.requisition_comment}</p>
                </div>
              )}
              {selectedRequisition.requisition_status === "Pending" && (
                <div className="approval-section">
                  <div className="amount-input">
                    <label>Amount to Approve</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="approval-actions">
                    <button
                      className="approve-button"
                      onClick={() =>
                        handleAction(
                          selectedRequisition.requisition_id,
                          "approve",
                          parseFloat(approvedAmount)
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="partial-button"
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
                      className="reject-button"
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
                </div>
              )}
            </div>
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
  if (statusCode === null) return "Pending";
  switch (statusCode) {
    case 0:
      return "Rejected";
    case 1:
      return "Approved";
    case 2:
      return "Partially Approved";
    default:
      return "Pending";
  }
};

export default RequisitionsWeb;
