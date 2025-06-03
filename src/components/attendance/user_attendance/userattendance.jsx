import React, { useState, useEffect, useCallback, useRef } from 'react';
import './userattendance.css';
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, CheckCircle, XCircle, X as CloseIcon, MapPin } from 'lucide-react';
import moment from 'moment';

// Constants
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = "https://demo-expense.geomaticxevs.in/ET-api";
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // IMPORTANT: Replace with your actual, restricted API key

// Interfaces (similar to TS, for clarity)
// interface AttendanceRecord { /* ... */ }
// interface AttendanceSummary { /* ... */ }
// interface TrackingPoint { /* ... */ }


const UserAttendance = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedUser, setSelectedUser] = useState(null);
    const [userAttendance, setUserAttendance] = useState([]);
    
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [startDate, setStartDate] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));

    const [showAttendanceDetailModal, setShowAttendanceDetailModal] = useState(false);
    
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingData, setTrackingData] = useState([]);
    const [selectedTrackingRecord, setSelectedTrackingRecord] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);


    const fetchAttendanceData = useCallback(async (userId, start, end) => {
        setLoading(true);
        setError(null);
        try {
            const requestBody = userId ? { user_id: userId, start_date: start, end_date: end } : {};
            const response = await fetch(`${API_BASE_URL}/user_attendance.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (!data.summary) throw new Error("Summary data is not in the expected format");
            
            if (userId) {
                setUserAttendance(data.attendance || []);
                setShowAttendanceDetailModal(true); // Show details after fetching for a specific user
            } else {
                setSummaryData(data.summary || []);
                // Attendance data for all users is also available in data.attendance if needed globally
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message || "An unexpected error occurred");
            if (userId) setUserAttendance([]); else setSummaryData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTrackingData = useCallback(async (userId, attnId) => {
        // Do not set loading here, map has its own visual cues
        setError(null);
        setTrackingData([]); 
        try {
            const response = await fetch(`${API_BASE_URL}/get_location.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ u_id: userId, attn_id: attnId }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Tracking data is not in the expected array format");
            setTrackingData(data);
        } catch (err) {
            console.error("Fetch tracking error:", err);
            setError("Failed to load tracking data: " + (err.message || "Unknown error"));
            setTrackingData([]);
        }
    }, []);

    useEffect(() => {
        fetchAttendanceData(); // Initial fetch for summary
    }, [fetchAttendanceData]);

    // Initialize or update map when tracking modal is shown and data is available
    useEffect(() => {
        if (showTrackingModal && mapRef.current && trackingData) {
            if (!window.google || !window.google.maps) {
                console.error("Google Maps API not loaded.");
                // You might want to load it dynamically if not already present
                // For now, assuming it's loaded via a <script> tag in index.html
                return;
            }

            try {
                const trackPoints = trackingData
                    .filter(point => point.lat && point.long) // Ensure lat/long exist
                    .map(point => ({
                        lat: parseFloat(point.lat),
                        lng: parseFloat(point.long),
                        time: point.time
                    }));

                const defaultCenter = { lat: 28.6119, lng: 77.2070 }; // Default to India Gate, Delhi
                const mapCenter = trackPoints.length > 0 
                    ? { lat: trackPoints[0].lat, lng: trackPoints[0].lng }
                    : defaultCenter;

                if (mapInstanceRef.current) { // Clear previous map elements if any
                    mapInstanceRef.current.data.forEach(feature => mapInstanceRef.current.data.remove(feature));
                }
                
                const map = new window.google.maps.Map(mapRef.current, {
                    zoom: 15,
                    center: mapCenter,
                    mapTypeId: 'terrain',
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true
                });
                mapInstanceRef.current = map;


                if (trackPoints.length > 0) {
                    const path = new window.google.maps.Polyline({
                        path: trackPoints,
                        geodesic: true,
                        strokeColor: '#6366f1',
                        strokeOpacity: 1.0,
                        strokeWeight: 3
                    });
                    path.setMap(map);

                    trackPoints.forEach((point, index) => {
                        const marker = new window.google.maps.Marker({
                            position: point,
                            map: map,
                            title: `Location at ${point.time}`,
                            label: (index + 1).toString(),
                            animation: window.google.maps.Animation.DROP
                        });

                        const infowindow = new window.google.maps.InfoWindow({
                            content: `
                                <div style="padding: 8px; font-family: 'Inter', sans-serif;">
                                  <h3 style="margin: 0 0 8px 0; font-size: 1rem;">Location #${index + 1}</h3>
                                  <p style="margin: 0; font-size: 0.85rem;">Time: ${point.time}</p>
                                  <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Lat: ${point.lat.toFixed(6)}</p>
                                  <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Lng: ${point.lng.toFixed(6)}</p>
                                </div>
                              `
                        });
                        marker.addListener('click', () => infowindow.open(map, marker));
                    });

                    const bounds = new window.google.maps.LatLngBounds();
                    trackPoints.forEach(point => bounds.extend(new window.google.maps.LatLng(point.lat, point.lng)));
                    map.fitBounds(bounds);
                } else {
                    const infowindow = new window.google.maps.InfoWindow({
                        content: '<div style="padding: 8px; font-family: \'Inter\', sans-serif;">No tracking data available for this record.</div>'
                    });
                    infowindow.setPosition(mapCenter);
                    infowindow.open(map);
                }
            } catch (e) {
                console.error('Map initialization error:', e);
                if (mapRef.current) {
                    mapRef.current.innerHTML = `<div class="map-error">Error loading map: ${e.message}</div>`;
                }
            }
        }
    }, [showTrackingModal, trackingData]);


    const handleUserSelect = (user) => {
        setSelectedUser(user);
        // Reset dates to default or last used for this user type
        setStartDate(moment().subtract(7, "days").format("YYYY-MM-DD"));
        setEndDate(moment().format("YYYY-MM-DD"));
        setShowDateRangeModal(true);
    };

    const handleDateRangeSubmit = () => {
        if (selectedUser) {
            fetchAttendanceData(selectedUser.user_id, startDate, endDate);
            setShowDateRangeModal(false); // Close date range modal
        }
    };
    
    const handleTrackUser = (attendanceRecord) => {
        setSelectedTrackingRecord(attendanceRecord);
        fetchTrackingData(attendanceRecord.user_id, attendanceRecord.attn_id);
        setShowTrackingModal(true);
    };

    const filteredUsers = summaryData.filter(user => {
        const query = searchQuery.trim().toLowerCase();
        const userName = user.user_name?.toLowerCase() || "";
        const roleName = user.role_name?.toLowerCase() || "";
        return userName.includes(query) || roleName.includes(query);
    });

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (loading && summaryData.length === 0) { // Show loading only on initial full load
        return <div className="loading-container"><div className="loading-spinner"></div></div>;
    }

    if (error && summaryData.length === 0) { // Show error only if initial load failed
        return <div className="error-message">Error: {error}</div>;
    }

    const renderUserSummaryRow = (item) => (
        <div key={item.user_id} className="data-row" onClick={() => handleUserSelect(item)}>
            <div className="data-cell user-info">
                <span className="user-name">{item.user_name}</span>
                <span className="user-role">{item.role_name}</span>
            </div>
            <div className="data-cell">{item.present_days}</div>
            <div className="data-cell">{item.absent_days}</div>
            <div className="data-cell">{item.last_attendance ? moment(item.last_attendance).format("MMM D, YYYY") : "Never"}</div>
        </div>
    );

    const renderAttendanceDetailRow = (item) => (
        <div key={item.attn_id} className="data-row">
            <div className="data-cell">{moment(item.attendance_date).format("MMM D, YYYY")}</div>
            <div className="data-cell status-cell">
                {item.attn_status === "present" ? <CheckCircle size={18} className="status-icon present" /> : <XCircle size={18} className="status-icon absent" />}
                <span className={`status-text ${item.attn_status}`}>{item.attn_status}</span>
            </div>
            <div className="data-cell">{item.check_in || "--:--"}</div>
            <div className="data-cell">{item.check_out || "--:--"}</div>
            <div className="data-cell location-cell" title={item.attn_location || "Unknown"}>{item.attn_location || "Unknown"}</div>
            <div className="data-cell">
                <button onClick={() => handleTrackUser(item)} className="track-button" title="Track User Location">
                    <MapPin size={16} /> Track
                </button>
            </div>
        </div>
    );

    return (
        <div className="user-attendance-container">
            <h1 className="page-title">User Attendance</h1>

            <div className="controls-container card">
                <div className="search-container">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search users by name or role..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1);}}
                    />
                </div>
            </div>
            
            {loading && <div className="loading-inline">Loading data...</div>}
            {error && !loading && <div className="error-inline">Error: {error}</div>}


            <div className="table-container card">
                <div className="table-header">
                    <div className="header-cell user-info">User</div>
                    <div className="header-cell">Present</div>
                    <div className="header-cell">Absent</div>
                    <div className="header-cell">Last Active</div>
                </div>
                <div className="table-body">
                    {paginatedUsers.length > 0 ? (
                        paginatedUsers.map(renderUserSummaryRow)
                    ) : (
                        <div className="empty-state">
                            <User size={48} className="empty-icon" />
                            <p>No users found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {filteredUsers.length > ITEMS_PER_PAGE && (
                 <div className="pagination-controls card">
                    <span className="pagination-info">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                    </span>
                    <div className="buttons">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Next <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Date Range Modal */}
            {showDateRangeModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-container date-range-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Select Date Range for {selectedUser.user_name}</h2>
                            <button className="close-button" onClick={() => setShowDateRangeModal(false)}>
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="date-input-group">
                                <label htmlFor="startDate">From:</label>
                                <input 
                                    type="date" 
                                    id="startDate" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="date-input-field"
                                />
                            </div>
                            <div className="date-input-group">
                                <label htmlFor="endDate">To:</label>
                                <input 
                                    type="date" 
                                    id="endDate" 
                                    value={endDate} 
                                    min={startDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="date-input-field"
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="button secondary-button" onClick={() => setShowDateRangeModal(false)}>Cancel</button>
                            <button className="button primary-button" onClick={handleDateRangeSubmit}>Show Records</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Detail Modal */}
            {showAttendanceDetailModal && selectedUser && (
                 <div className="modal-overlay">
                    <div className="modal-container attendance-detail-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedUser.user_name}'s Attendance <br/>
                                <small>({moment(startDate).format("MMM D, YYYY")} - {moment(endDate).format("MMM D, YYYY")})</small>
                            </h2>
                            <button className="close-button" onClick={() => { setShowAttendanceDetailModal(false); setUserAttendance([]); /*setSelectedUser(null);*/ }}>
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            {loading && <div className="loading-inline">Loading records...</div>}
                            {error && !loading && userAttendance.length === 0 && <div className="error-inline">Error loading records: {error}</div>}
                            
                            {!loading && userAttendance.length > 0 && (
                                <div className="summary-cards-container">
                                    <div className="summary-card">
                                        <span className="summary-label">Total Days</span>
                                        <span className="summary-value">{userAttendance.length}</span>
                                    </div>
                                    <div className="summary-card present">
                                        <span className="summary-label">Present</span>
                                        <span className="summary-value">{userAttendance.filter(a => a.attn_status === "present").length}</span>
                                    </div>
                                    <div className="summary-card absent">
                                        <span className="summary-label">Absent</span>
                                        <span className="summary-value">{userAttendance.filter(a => a.attn_status === "absent").length}</span>
                                    </div>
                                </div>
                            )}

                            <div className="table-container inner-table">
                                <div className="table-header">
                                    <div className="header-cell">Date</div>
                                    <div className="header-cell">Status</div>
                                    <div className="header-cell">Check In</div>
                                    <div className="header-cell">Check Out</div>
                                    <div className="header-cell location-cell">Location</div>
                                    <div className="header-cell">Track</div>
                                </div>
                                <div className="table-body">
                                    {!loading && userAttendance.length > 0 ? (
                                        userAttendance.map(renderAttendanceDetailRow)
                                    ) : !loading && (
                                        <div className="empty-state">
                                            <CalendarIcon size={48} className="empty-icon" />
                                            <p>No attendance records found for the selected period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                         <div className="modal-actions">
                            <button className="button secondary-button" onClick={() => { setShowAttendanceDetailModal(false); setUserAttendance([]); /*setSelectedUser(null);*/}}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Tracking Modal */}
            {showTrackingModal && selectedTrackingRecord && (
                <div className="modal-overlay">
                    <div className="modal-container tracking-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Location Tracking</h2>
                            <button className="close-button" onClick={() => { setShowTrackingModal(false); mapInstanceRef.current = null; }}>
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="tracking-info-header">
                                <p><strong>User:</strong> {selectedTrackingRecord.user_name}</p>
                                <p><strong>Date:</strong> {moment(selectedTrackingRecord.attendance_date).format("MMM D, YYYY")}</p>
                                <p><strong>Reported Location:</strong> {selectedTrackingRecord.attn_location || "Unknown"}</p>
                            </div>
                            {error && trackingData.length === 0 && <div className="error-inline map-error-inline">Failed to load tracking data: {error}</div>}
                            <div ref={mapRef} className="map-canvas">
                                {!error && trackingData.length === 0 && <div className="map-placeholder">Loading map and tracking data... If this persists, there might be no detailed tracking points.</div>}
                            </div>
                        </div>
                        <div className="modal-actions">
                           <button className="button secondary-button" onClick={() => { setShowTrackingModal(false); mapInstanceRef.current = null; }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAttendance;