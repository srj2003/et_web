import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search, X, Download, ArrowLeft, SlidersHorizontal, CalendarDays, FolderOpen, User2, Wallet } from 'lucide-react'; // Added SlidersHorizontal for filter toggle

import './requisition_report.css'; // Link to the new CSS file

// RequisitionDetailsModal component (No functional changes, just class names)
const RequisitionDetailsModal = ({ requisition, visible, onClose }) => {
    if (!requisition) return null;

    let statusLabel = "Unattained";
    let statusClass = "status-unattained";

    if (requisition.requisition_status === "0") {
        statusLabel = "Rejected";
        statusClass = "status-rejected";
    } else if (
        requisition.requisition_status === "1" ||
        requisition.requisition_app_amount === requisition.requisition_req_amount
    ) {
        statusLabel = "Approved";
        statusClass = "status-approved";
    } else if (
        requisition.requisition_status === "2" ||
        (requisition.requisition_app_amount > 0 &&
            requisition.requisition_app_amount < requisition.requisition_req_amount)
    ) {
        statusLabel = "Partially Approved";
        statusClass = "status-partially-approved";
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className={`modal-overlay ${visible ? 'visible' : ''}`}>
            <div className="modal-panel">
                <button className="modal-back-button" onClick={onClose}>
                    <ArrowLeft size={20} />
                    <span>Back to Report</span>
                </button>

                <div className="details-modal-content">
                    <div className="details-modal-header">
                        <h2 className="details-modal-title">{requisition.requisition_title}</h2>
                        <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                    </div>

                    <div className="details-amount-overview">
                        <div className="details-amount-group">
                            <span className="details-amount-label">Requested Amount</span>
                            <span className="details-amount-value">{formatCurrency(requisition.requisition_req_amount)}</span>
                        </div>
                        <div className="details-amount-group">
                            <span className="details-amount-label">Approved Amount</span>
                            <span className="details-amount-value">{formatCurrency(requisition.requisition_app_amount)}</span>
                        </div>
                    </div>

                    <div className="details-info-grid">
                        <div className="detail-item">
                            <span className="detail-label">Created By</span>
                            <span className="detail-value">{requisition.requisition_created_by || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Submitted To</span>
                            <span className="detail-value">{requisition.requisition_submitted_to || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Latitude</span>
                            <span className="detail-value">{requisition.requisition_create_lat || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Longitude</span>
                            <span className="detail-value">{requisition.requisition_create_long || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Created At</span>
                            <span className="detail-value">{new Date(requisition.requisition_created_at).toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Updated At</span>
                            <span className="detail-value">{new Date(requisition.requisition_updated_at).toLocaleString() || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main RequisitionReport Component
const RequisitionReport = () => {
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [selectedRoleLabel, setSelectedRoleLabel] = useState("Select Role");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedUserName, setSelectedUserName] = useState("Select Name");
    const [data, setData] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [showRequisitionDetails, setShowRequisitionDetails] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(true); // Controls side panel visibility
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalApprovedAmount, setTotalApprovedAmount] = useState(0);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRoleId) {
            fetchUsersByRole(selectedRoleId);
        } else {
            setUsers([]);
            setSelectedUserId("");
            setSelectedUserName("Select Name");
        }
    }, [selectedRoleId]);

    useEffect(() => {
        const total = data.reduce(
            (sum, item) => sum + Number(item.requisition_app_amount || 0),
            0
        );
        setTotalApprovedAmount(total);
    }, [data]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/requisition_report.php?fetch_roles=true"
            );
            const data = await response.json();

            if (response.ok && data.status === "success" && data.roles) {
                setRoles(data.roles);
            } else {
                toast.error("Failed to load roles: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error("Network error while fetching roles. Please try again.");
            console.error("Fetch roles error:", error);
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchUsersByRole = async (roleId) => {
        setLoadingUsers(true);
        setUsers([]);
        setSelectedUserId("");
        setSelectedUserName("Select Name");
        setData([]);
        setTotalApprovedAmount(0);

        try {
            const response = await fetch(
                `https://demo-expense.geomaticxevs.in/ET-api/requisition_report.php?role_id=${roleId}`
            );
            const result = await response.json();

            if (response.ok && result.status === "success" && result.users) {
                setUsers(
                    result.users.map((user) => ({
                        id: user.u_id.toString(),
                        name: user.name,
                    }))
                );
            } else {
                toast.info(result.message || "No users found for this role.");
            }
        } catch (error) {
            toast.error("Network error while fetching users. Please try again.");
            console.error("Fetch users error:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setData([]);
        setTotalApprovedAmount(0);

        try {
            const payload = {};

            // Only add user_id if it's selected
            if (selectedUserId) {
                payload.user_id = parseInt(selectedUserId);
            }

            if (startDate) {
                payload.start_date = startDate.toISOString().split("T")[0];
            }

            if (endDate) {
                payload.end_date = endDate.toISOString().split("T")[0];
            }

            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/requisition_report.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (response.ok) {
                if (Array.isArray(result.data)) {
                    setData(result.data);
                    if (result.data.length > 0) {
                        setIsFiltersVisible(false); // Hide side panel after fetching data
                        toast.success("Requisition data fetched successfully!");
                    } else {
                        toast.info("No requisitions found for the selected criteria.");
                    }
                } else {
                    toast.error("Unexpected data format received from server.");
                    console.error("API response not an array:", result);
                }
            } else {
                toast.error(result.error || "Failed to fetch data.");
                console.error("API error:", result);
            }
        } catch (error) {
            toast.error("An error occurred while fetching data. Please check your connection.");
            console.error("Fetch data error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!data.length) {
            toast.warn("No data to download. Please fetch a report first.");
            return;
        }
        if (!selectedUserId) {
            toast.warn("Please select a name to download the report.");
            return;
        }
        try {
            let downloadUrl = `https://demo-expense.geomaticxevs.in/ET-api/requisition_report_download.php?user_id=${selectedUserId}`;
            if (startDate) {
                downloadUrl += `&start_date=${startDate.toISOString().split("T")[0]}`;
            }
            if (endDate) {
                downloadUrl += `&end_date=${endDate.toISOString().split("T")[0]}`;
            }
            window.open(downloadUrl, '_blank');
            toast.success("Downloading requisition report...");
        } catch (error) {
            toast.error("Failed to initiate download.");
            console.error("Download error:", error);
        }
    };

    const handleReset = () => {
        setRoles([]);
        setUsers([]);
        setSelectedRoleId("");
        setSelectedRoleLabel("Select Role");
        setSelectedUserId("");
        setSelectedUserName("Select Name");
        setData([]);
        setStartDate(null);
        setEndDate(null);
        setSelectedRequisition(null);
        setShowRequisitionDetails(false);
        setIsFiltersVisible(true); // Show side panel on reset
        setSearchQuery("");
        setTotalApprovedAmount(0);
        fetchRoles();
        toast.info("All filters and data have been reset.");
    };

    const renderRequisitionCard = (item) => {
        let statusLabel = "Unattained";
        let statusClass = "status-unattained";

        if (item.requisition_status === "0") {
            statusLabel = "Rejected";
            statusClass = "status-rejected";
        } else if (
            item.requisition_status === "1" ||
            item.requisition_app_amount === item.requisition_req_amount
        ) {
            statusLabel = "";
            statusClass = "status-approved";
        } else if (
            item.requisition_status === "2" ||
            (item.requisition_app_amount > 0 &&
                item.requisition_app_amount < item.requisition_req_amount)
        ) {
            statusLabel = "Partially Approved";
            statusClass = "status-partially-approved";
        }

        return (
            <div
                className="requisition-item-card"
                key={item.requisition_id}
                onClick={() => {
                    setSelectedRequisition(item);
                    setShowRequisitionDetails(true);
                }}
            >
                <div className="card-header">
                    <h3 className="card-title">{item.requisition_title}</h3>
                    <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="amount-group">
                    <span className="amount-label">Requested Amount</span>
                    <span className="amount-value">{formatCurrency(item.requisition_req_amount)}</span>
                </div>
                <div className="amount-group">
                    <span className="amount-label">Approved Amount</span>
                    <span className="amount-value">{formatCurrency(item.requisition_app_amount)}</span>
                </div>
            </div>
        );
    };

    const filteredRoles = roles.filter((role) =>
        role.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-layout-container">
            {/* Filter Side Panel */}
            <aside className={`filter-side-panel ${isFiltersVisible ? 'visible' : ''}`}>
                <button className="side-panel-close-button" onClick={() => setIsFiltersVisible(false)}>
                    <X size={24} />
                </button>
                <h3>Filters</h3> {/* Simple heading for the panel */}
                <div className="form-group">
                    <label htmlFor="select-role">Select Role <span className="required-asterisk">*</span></label>
                    <button
                        id="select-role"
                        className="custom-select-button"
                        onClick={() => { setShowRoleModal(true); setSearchQuery(""); }}
                        disabled={loadingRoles}
                    >
                        <span>{selectedRoleLabel}</span>
                        <SlidersHorizontal size={20} /> {/* New icon for opening filter options */}
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="select-name">Select Name <span className="required-asterisk">*</span></label>
                    <button
                        id="select-name"
                        className="custom-select-button"
                        onClick={() => { setShowNameModal(true); setSearchQuery(""); }}
                        disabled={!selectedRoleId || loadingUsers}
                    >
                        <span>{selectedUserName}</span>
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                <div className="date-pickers-grid">
                    <div className="date-picker-group">
                        <label htmlFor="start-date">Date Range</label>
                        <div className="date-picker-input-wrapper">
                            <DatePicker
                                id="start-date"
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                maxDate={new Date()}
                                className="date-picker"
                                placeholderText="Select start date"
                                dateFormat="dd/MM/yyyy"
                            />
                            <CalendarDays size={20} className="calendar-icon" />
                        </div>
                    </div>

                    <div className="date-picker-group">
                        <label htmlFor="end-date">End Date</label>
                        <div className="date-picker-input-wrapper">
                            <DatePicker
                                id="end-date"
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                maxDate={new Date()}
                                className="date-picker"
                                placeholderText="Select end date"
                                disabled={!startDate}
                                dateFormat="dd/MM/yyyy"
                            />
                            <CalendarDays size={20} className="calendar-icon" />
                        </div>
                    </div>
                </div>

                <div className="fetch-button-container">
                    <button className="fetch-button" onClick={fetchData} disabled={loading}>
                        {loading ? "Fetching..." : "Fetch Requisitions"}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`main-content-area ${!isFiltersVisible ? 'sidebar-hidden' : ''}`}>
                {/* FLOATING TOGGLE BUTTON - visible when sidebar is hidden */}
                {!isFiltersVisible && (
                    <button className="filter-toggle-button" onClick={() => setIsFiltersVisible(true)}>
                        <SlidersHorizontal size={20} /> Show Filters
                    </button>
                )}

                {/* Header Section */}
                <div className="report-header-section">
                    <h1 className="report-title">Requisition Reports</h1>
                    {/* Total amount card always visible in main content */}
                    <div className="total-amount-card">
                        <span className="total-amount-label">Total Approved Amount</span>
                        <span className="total-amount-value">
                            {formatCurrency(totalApprovedAmount)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-group">
                    <button className="reset-button" onClick={handleReset}>
                        Reset All
                    </button>
                    <button
                        className={`download-button ${!data.length ? 'disabled' : ''}`}
                        onClick={handleDownload}
                        disabled={!data.length}
                    >
                        <Download size={20} />
                        <span>Download Report</span>
                    </button>
                </div>

                {/* Main Content Area (Report List or Empty/Loading State) */}
                {loading ? (
                    <div className="loading-state-container">
                        <div className="loading-spinner"></div>
                        <span>Loading Requisitions...</span>
                    </div>
                ) : data.length > 0 ? (
                    <div className="requisition-list-grid">
                        {data.map((item) => renderRequisitionCard(item))}
                    </div>
                ) : (
                    <div className="empty-state-section">
                        <div className="empty-state-card">
                            <span className="empty-state-icon">
                                <FolderOpen size={64} />
                            </span>
                            <h2 className="empty-state-title">No Requisition Reports Found</h2>
                            <p className="empty-state-text">
                                Select a role and name in the filters, then click 'Fetch Requisitions' to view reports.
                                Adjust your filters if no data appears.
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Overlay when sidebar is open on smaller screens */}
            {isFiltersVisible && <div className="main-content-overlay visible" onClick={() => setIsFiltersVisible(false)}></div>}

            {/* Role Selection Modal */}
            {showRoleModal && (
                <div className="modal-overlay visible">
                    <div className="modal-panel">
                        <div className="modal-header">
                            <h2>Select Role</h2>
                            <button className="modal-close-button" onClick={() => setShowRoleModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-search-input-group">
                            <Search size={20} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="modal-search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="modal-search-clear-button"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <div className="modal-item-list">
                            {loadingRoles ? (
                                <div className="loading-state-container">
                                    <div className="loading-spinner"></div>
                                    <span>Loading Roles...</span>
                                </div>
                            ) : filteredRoles.length > 0 ? (
                                filteredRoles.map((role) => (
                                    <button
                                        key={role.value}
                                        className="modal-list-item"
                                        onClick={() => {
                                            setSelectedRoleId(role.value);
                                            setSelectedRoleLabel(role.label);
                                            setShowRoleModal(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        {role.label}
                                    </button>
                                ))
                            ) : (
                                <div className="empty-state-modal">No roles found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Name Selection Modal */}
            {showNameModal && (
                <div className="modal-overlay visible">
                    <div className="modal-panel">
                        <div className="modal-header">
                            <h2>Select Name</h2>
                            <button className="modal-close-button" onClick={() => setShowNameModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-search-input-group">
                            <Search size={20} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search names..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="modal-search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="modal-search-clear-button"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <div className="modal-item-list">
                            {loadingUsers ? (
                                <div className="loading-state-container">
                                    <div className="loading-spinner"></div>
                                    <span>Loading Users...</span>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        className="modal-list-item"
                                        onClick={() => {
                                            setSelectedUserId(user.id);
                                            setSelectedUserName(user.name);
                                            setShowNameModal(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        {user.name}
                                    </button>
                                ))
                            ) : (
                                <div className="empty-state-modal">No users found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <RequisitionDetailsModal
                requisition={selectedRequisition}
                visible={showRequisitionDetails}
                onClose={() => {
                    setShowRequisitionDetails(false);
                    setSelectedRequisition(null);
                }}
            />
        </div>
    );
};

export default RequisitionReport;