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
  DollarSign,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
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

const RequisitionsWeb = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showRequisitionDetails, setShowRequisitionDetails] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unattended: 0,
    approved: 0,
    rejected: 0,
    partiallyApproved: 0,
  });
  const [viewMode, setViewMode] = useState("card");
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
          console.log("Fetched Requisitions:", transformedData);
          setRequisitions(transformedData);

          // Calculate stats
          setStats({
            total: transformedData.length,
            unattended: transformedData.filter(
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

  // Filtered requisitions based on all filters (search, status, date)
  const filteredRequisitions = requisitions.filter((requisition) => {
    // Defensive: ensure values are strings
    const employeeName = requisition.employee
      ? String(requisition.employee).toLowerCase()
      : "";
    const title = requisition.requisition_title
      ? String(requisition.requisition_title).toLowerCase()
      : "";
    const matchesSearch =
      employeeName.includes(searchQuery.toLowerCase()) ||
      title.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" ||
      (requisition.requisition_status &&
        requisition.requisition_status === selectedStatus);

    // Apply filter on fromDate and toDate, using strict date comparison
    let matchesDate = true;
    if (fromDate) {
      const reqDate = new Date(requisition.requisition_date);
      const from = new Date(fromDate);
      matchesDate = reqDate.setHours(0, 0, 0, 0) >= from.setHours(0, 0, 0, 0);
    }
    if (toDate) {
      const reqDate = new Date(requisition.requisition_date);
      const to = new Date(toDate);
      matchesDate =
        matchesDate && reqDate.setHours(0, 0, 0, 0) <= to.setHours(0, 0, 0, 0);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Live update stats based on filtered requisitions
  const liveStats = {
    total: filteredRequisitions.length,
    unattended: filteredRequisitions.filter(
      (req) => req.requisition_status === "Unattended"
    ).length,
    approved: filteredRequisitions.filter(
      (req) => req.requisition_status === "Approved"
    ).length,
    rejected: filteredRequisitions.filter(
      (req) => req.requisition_status === "Rejected"
    ).length,
    partiallyApproved: filteredRequisitions.filter(
      (req) => req.requisition_status === "Partially Approved"
    ).length,
  };

  const totalPages = Math.ceil(filteredRequisitions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequisitions = filteredRequisitions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
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
      <div className="leaves-container">
        <h1 className="requisition-page-title">Requested Requisitions</h1>
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
              <div className="allexpense-stat-value">
                {liveStats.unattended}
              </div>
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
        <div className="requestedrequesitionfilters-section">
          <div className="requestedrequesitionsearch-container">
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="requestedrequesitionsearch-input"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="requestedrequesitionfilter-button"
          >
            <option value="All">All Status</option>
            <option value="Unattended">Unattended</option>
            <option value="Approved">Approved</option>
            <option value="Partially Approved">Partially Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          {/* Reset Button below search bar */}
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
          <div className="requisition-requisitions-grid">
            {paginatedRequisitions.map((item, idx) => (
              <div
                className="requisition-requisition-card"
                key={idx}
                data-status={item.requisition_status}
                style={{ background: getStatusBg(item.requisition_status) }}
              >
                <div className="requisition-card-header">
                  <div className="requisition-submission-flow">
                    <span
                      className="requisition-status-badge"
                      style={{
                        backgroundColor: getStatusColor(
                          item.requisition_status
                        ),
                      }}
                    >
                      {item.requisition_status}
                    </span>
                  </div>
                </div>
                <div
                  className="requisition-requisition-details"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <h4 className="requisition-requisition-title">
                    {item.requisition_title}
                  </h4>
                  <div
                    className="requestedleaves-leave-details"
                    style={{ flex: 1 }}
                  >
                    <div className="requestedleaves-leave-dates">
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">
                          Amount:
                        </span>
                        <span className="requestedleaves-date-value">
                          ₹{parseFloat(item.requested_amount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">
                          Submission Date:
                        </span>
                        <span className="requestedleaves-date-value">
                          {item.requisition_date}
                        </span>
                      </div>
                      <div className="requestedleaves-date-item">
                        <span className="requestedleaves-date-label">
                          Employee:
                        </span>
                        <span className="requestedleaves-date-value">
                          {item.employee}
                        </span>
                      </div>
                      {item.requisition_status !== "Unattended" && (
                        <div className="requestedleaves-date-item">
                          <span className="requestedleaves-date-label">
                            Approved amount:
                          </span>
                          <span className="requestedleaves-date-value">
                            ₹{parseFloat(item.approved_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      marginTop: "auto",
                      minHeight: 60,
                    }}
                  >
                    <button
                      className="card-view-details-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequisition(item);
                        setShowRequisitionDetails(true);
                      }}
                    >
                      View Details
                    </button>
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
                  <th>Employee</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Approved Amount</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequisitions.map((requisition, idx) => (
                  <tr
                    key={requisition.requisition_id || idx}
                    onClick={() => {
                      setSelectedRequisition(requisition);
                      setShowRequisitionDetails(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{requisition.requisition_id}</td>
                    <td>{requisition.requisition_title}</td>
                    <td>{requisition.employee}</td>
                    <td>₹{requisition.requested_amount.toFixed(2)}</td>
                    <td>{requisition.requisition_status}</td>
                    <td>{requisition.requisition_date}</td>
                    <td>{requisition.requisition_type}</td>
                    <td>
                      {requisition.requisition_status !== "Unattended"
                        ? `₹${(requisition.approved_amount || 0).toFixed(2)}`
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
                              prev === requisition.requisition_id
                                ? null
                                : requisition.requisition_id
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
                        {openMenuRow === requisition.requisition_id && (
                          <div className="requestedexpenses-details-menu-dropdown">
                            <button
                              className="requestedexpenses-details-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequisition(requisition);
                                setShowRequisitionDetails(true);
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
              {selectedRequisition.requisition_status === "Unattended" && (
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
