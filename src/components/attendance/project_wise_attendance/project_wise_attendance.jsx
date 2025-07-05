import React, { useState, useEffect, useRef } from "react";
import "./project_wise_attendance.css";
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// import "../../users/users.css";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingProjectUsers, setLoadingProjectUsers] = useState(false);
  const [projectUsersError, setProjectUsersError] = useState("");
  const [modalProjects, setModalProjects] = useState([]);
  const [loadingModalProjects, setLoadingModalProjects] = useState(false);
  const [modalProjectsError, setModalProjectsError] = useState("");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapModalCoords, setMapModalCoords] = useState(null); // can be single or array
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const navigate = useNavigate();

  const handleRowClick = async (item) => {
    setSelectedUser(item);
    setModalOpen(true);
    setModalProjects([]);
    setModalProjectsError("");
    setLoadingModalProjects(true);
    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: item.u_id }),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setModalProjects(data.projects || []);
      } else {
        setModalProjectsError(data.message || "Failed to fetch projects");
      }
    } catch (err) {
      setModalProjectsError("Network error or invalid response");
    } finally {
      setLoadingModalProjects(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Handler for clicking a project row (Projects tab)
  const handleProjectRowClick = async (proj) => {
    setSelectedProject(proj);
    setProjectModalOpen(true);
    setProjectUsers([]);
    setProjectUsersError("");
    setLoadingProjectUsers(true);
    try {
      const userId = localStorage.getItem("userid");
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/users_under_project.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_type_id: proj.project_id, userId })
      });
      const data = await response.json();
      if (data.status === "success") {
        setProjectUsers(data.users || []);
      } else {
        setProjectUsersError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      setProjectUsersError("Network error or invalid response");
    } finally {
      setLoadingProjectUsers(false);
    }
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setSelectedProject(null);
  };

  // Fetch attendance data for 'All' tab
  useEffect(() => {
    if (activeTab === "all") {
      const fetchAttendance = async () => {
        setLoadingAttendance(true);
        setAttendanceError("");
        try {
          const userId = localStorage.getItem("userid");
          if (!userId) {
            setAttendanceError("Missing user ID");
            setLoadingAttendance(false);
            return;
          }
          const response = await fetch(
            "https://demo-expense.geomaticxevs.in/ET-api/attendance_under_user.php",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId }),
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            console.log(data.data);
            setAttendanceData(data.data || []);
          } else {
            setAttendanceError(data.message || "Failed to fetch attendance data");
          }
        } catch (err) {
          setAttendanceError("Network error or invalid response");
        } finally {
          setLoadingAttendance(false);
        }
      };
      fetchAttendance();
    }
  }, [activeTab]);

  // Fetch projects from API when Projects tab is selected
  useEffect(() => {
    if (activeTab === "projects") {
      const fetchProjects = async () => {
        setLoadingProjects(true);
        setProjectsError("");
        try {
          const user_id = localStorage.getItem("userid");
          const authToken = localStorage.getItem("authToken");
          if (!user_id || !authToken) {
            setProjectsError("Missing user ID or auth token");
            setLoadingProjects(false);
            return;
          }
          const response = await fetch(
            "https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
              },
              body: JSON.stringify({ user_id }),
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            setProjects(data.projects || []);
          } else {
            setProjectsError(data.message || "Failed to fetch projects");
          }
        } catch (err) {
          setProjectsError("Network error or invalid response");
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [activeTab]);

  // Filtered data for search (All tab)
  const filteredAttendance = attendanceData
    .filter((item, idx, arr) =>
      arr.findIndex(i => i.u_id === item.u_id) === idx
    )
    .filter((item) => {
      const fullName = [item.u_fname, item.u_mname, item.u_lname].filter(Boolean).join(" ");
      return (
        fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Handler for showing all users on map
  const handleShowAllUsersOnMap = () => {
    if (!attendanceData || attendanceData.length === 0) return;
    const mapWindow = window.open('/attendance_map.html', '_blank');
    // Wait for the new window to load, then send data
    const sendData = () => {
      if (mapWindow && mapWindow.postMessage) {
        mapWindow.postMessage({ type: 'ATTENDANCE_MAP_DATA', payload: attendanceData }, '*');
      }
    };
    // Try to send after a short delay (in case the new tab is not ready yet)
    setTimeout(sendData, 500);
  };

  // Map modal effect (initialize Google Map)
  useEffect(() => {
    if (mapModalOpen && mapRef.current) {
      if (!window.google || !window.google.maps) {
        if (mapRef.current) {
          mapRef.current.innerHTML = `<div class='map-error'>Google Maps API not loaded.</div>`;
        }
        return;
      }
      try {
        let mapCenter = { lat: 28.6119, lng: 77.2070 }; // Default: India Gate, Delhi
        let zoom = 15;
        if (Array.isArray(mapModalCoords) && mapModalCoords.length > 0) {
          mapCenter = { lat: mapModalCoords[0].lat, lng: mapModalCoords[0].lng };
          zoom = 6;
        } else if (mapModalCoords && mapModalCoords.lat && mapModalCoords.lng) {
          mapCenter = { lat: parseFloat(mapModalCoords.lat), lng: parseFloat(mapModalCoords.lng) };
        }
        const map = new window.google.maps.Map(mapRef.current, {
          zoom,
          center: mapCenter,
          mapTypeId: 'terrain',
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });
        mapInstanceRef.current = map;
        if (Array.isArray(mapModalCoords)) {
          // Build a lookup for user details by lat/lng
          const userLookup = {};
          attendanceData.forEach(user => {
            if (user.login_lat_long) {
              const [lat, lng] = user.login_lat_long.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                userLookup[`${lat},${lng}`] = user;
              }
            }
          });
          // Get today's date in YYYY-MM-DD
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;
          // InfoWindow for details on hover
          const infoWindow = new window.google.maps.InfoWindow();
          mapModalCoords.forEach(({ lat, lng, name }) => {
            // Find the user for this marker
            const user = userLookup[`${lat},${lng}`];
            // Default: green marker
            let markerIcon = {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new window.google.maps.Size(40, 40)
            };
            if (user) {
              // Check if today's attendance has logout_lat_long
              let isToday = false;
              let hasLogout = false;
              if (user.attendance_date === todayStr) {
                isToday = true;
                if (user.logout_lat_long) hasLogout = true;
              }
              // If today and logout_lat_long present, use red marker
              if (isToday && hasLogout) {
                markerIcon = {
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40)
                };
              }
            }
            const marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: name || 'User',
              animation: window.google.maps.Animation.DROP,
              icon: markerIcon
            });
            // Always show name label above marker
            const nameLabel = new window.google.maps.InfoWindow({
              content: `<div style='font-family:Inter,sans-serif;font-size:0.98em;font-weight:600;padding:2px 8px;background:#fff;border-radius:6px;box-shadow:0 2px 6px rgba(99,102,241,0.08);border:1px solid #e0e7ff;'>${name || ''}</div>`,
              disableAutoPan: true,
              pixelOffset: new window.google.maps.Size(0, -38)
            });
            nameLabel.open(map, marker);
            if (user) {
              const fullName = [user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ');
              const email = user.u_email || '';
              const phone = user.u_mob || '';
              const status = user.is_logged_out === 0 ? 'Present' : 'Absent';
              const statusColor = user.is_logged_out === 0 ? '#16a34a' : '#dc2626';
              const content = `
                <div style='font-family:Inter,sans-serif;min-width:180px;'>
                  <div style='font-weight:700;font-size:1.1em;margin-bottom:2px;'>${fullName}</div>
                  <div style='font-size:0.95em;margin-bottom:2px;'><b>Email:</b> ${email}</div>
                  <div style='font-size:0.95em;margin-bottom:2px;'><b>Phone:</b> ${phone}</div>
                  <div style='font-size:0.95em;'><b>Status:</b> <span style='color:${statusColor};font-weight:600;'>${status}</span></div>
                </div>
              `;
              marker.addListener('mouseover', () => {
                nameLabel.close();
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
              });
              marker.addListener('mouseout', () => {
                infoWindow.close();
                nameLabel.open(map, marker);
              });
            }
          });
        } else if (mapModalCoords && mapModalCoords.lat && mapModalCoords.lng) {
          new window.google.maps.Marker({
            position: mapCenter,
            map: map,
            title: 'User Location',
            animation: window.google.maps.Animation.DROP
          });
        }
      } catch (e) {
        if (mapRef.current) {
          mapRef.current.innerHTML = `<div class='map-error'>Error loading map: ${e.message}</div>`;
        }
      }
    }
  }, [mapModalOpen, mapModalCoords, attendanceData]);

  return (
    <div className="users-container">
      <div className="header">
        <h1 className="title">User Attendance</h1>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
      <div className="stat-card total">
          <div className="stat-label">Total</div>
          <div className="stat-value">{filteredAttendance.length}</div>
        </div>
        <div className="stat-card present">
          <div className="stat-label">Present</div>
          <div className="stat-value">{filteredAttendance.filter(item => item.is_logged_out === 0).length}</div>
        </div>
        <div className="stat-card absent">
          <div className="stat-label">Absent</div>
          <div className="stat-value">{filteredAttendance.filter(item => item.is_logged_out !== 0).length}</div>
        </div>
        <div className="stat-card approved-leaves">
          <div className="stat-label">Approved Leaves</div>
          <div className="stat-value">{filteredAttendance.filter(item => item.leave_track_status === 1).length}</div>
        </div>
      </div>

      

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`tab ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search attendance..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="map-view-btn" onClick={handleShowAllUsersOnMap}>View Attendance in Map</button>
      </div>

      {activeTab === "all" ? (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr className="user-th">
                <th>ID</th>
                <th>NAME</th>
                <th>STATUS</th>
                <th>TRACK</th>
              </tr>
            </thead>
            <tbody>
              {loadingAttendance ? (
                <tr><td colSpan={3}>Loading...</td></tr>
              ) : attendanceError ? (
                <tr><td colSpan={3} style={{color: 'red'}}>{attendanceError}</td></tr>
              ) : filteredAttendance.length === 0 ? (
                <tr><td colSpan={3}>No attendance data found.</td></tr>
              ) : (
                filteredAttendance.map((item, idx) => {
                  const fullName = [item.u_fname, item.u_mname, item.u_lname].filter(Boolean).join(" ");
                  return (
                    <tr key={idx} className="user-row" onClick={() => handleRowClick(item)}>
                      <td>{item.u_id}</td>
                      <td>{fullName}</td>
                      <td>
                        <span className={item.is_logged_out === 0 ? 'status-present-text' : 'status-absent-text'}>
                          {item.is_logged_out === 0 ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td>
                        {item.is_logged_out === 0 && (
                          <FaMapMarkerAlt
                            className="location-icon"
                            style={{ color: '#6552f7' }}
                            title="Location"
                            onClick={e => {
                              e.stopPropagation();
                              let lat = null, lng = null;
                              if (item.latitude && item.longitude) {
                                lat = item.latitude;
                                lng = item.longitude;
                              } else if (item.u_latitude && item.u_longitude) {
                                lat = item.u_latitude;
                                lng = item.u_longitude;
                              } else if (item.login_lat_long) {
                                const parts = item.login_lat_long.split(',').map(Number);
                                lat = parts[0];
                                lng = parts[1];
                              }
                              if (lat !== null && lng !== null) {
                                const mapWindow = window.open('/attendance_map.html', '_blank');
                                const userData = [{ ...item, login_lat_long: `${lat},${lng}` }];
                                const sendData = () => {
                                  if (mapWindow && mapWindow.postMessage) {
                                    mapWindow.postMessage({ type: 'ATTENDANCE_MAP_DATA', payload: userData }, '*');
                                  }
                                };
                                setTimeout(sendData, 500);
                              }
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>PROJECT</th>
                <th>STATUS</th>
                <th>START DATE</th>
                <th>END DATE</th>
              </tr>
            </thead>
            <tbody>
              {loadingProjects ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : projectsError ? (
                <tr><td colSpan={5} style={{color: 'red'}}>{projectsError}</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={5}>No projects found.</td></tr>
              ) : (
                projects.map((proj, idx) => (
                  <tr key={idx} className="role-row" onClick={() => handleProjectRowClick(proj)} style={{cursor: 'pointer'}}>
                    <td>{proj.project_id}</td>
                    <td>{proj.project_name}</td>
                    <td>{proj.status}</td>
                    <td>{proj.start_date}</td>
                    <td>{proj.status && proj.status.toLowerCase() === 'ongoing' ? '' : (proj.end_date || '')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">User Details</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <div className="profile-section">
                {/* <img
                  src={selectedUser.u_profile_image ? `https://demo-expense.geomaticxevs.in/et_api/${selectedUser.u_profile_image}` : "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="profile-pic"
                /> */}
                <h3 className="user-name-modal">{[selectedUser.u_fname, selectedUser.u_mname, selectedUser.u_lname].filter(Boolean).join(" ")}</h3>
                <h6 >e-mail:{[selectedUser.u_email].filter(Boolean).join(" ")}</h6>
                <h6 >phone no.:{[selectedUser.u_mob].filter(Boolean).join(" ")}</h6>
                <button
                  className="view-details-user-btn"
                  style={{margin: '1rem auto 0.5rem auto', display: 'block'}}
                  onClick={() => {
                    navigate('/reports', {
                      state: {
                        userId: selectedUser.u_id,
                        userName: [selectedUser.u_fname, selectedUser.u_mname, selectedUser.u_lname].filter(Boolean).join(' ')
                      }
                    });
                  }}
                >
                  View details
                </button>
              </div>
              <div className="details-section">
                <div className="detail-item">
                  <strong>Projects:</strong>
                  <span>
                    {loadingModalProjects ? "Loading..." : modalProjectsError ? (
                      <span style={{ color: 'red' }}>{modalProjectsError}</span>
                    ) : modalProjects.length > 0 ? (
                      modalProjects.map(p => p.project_name).join(", ")
                    ) : "N/A"}
                  </span>
                </div>
                {/* <div className="detail-item">
                  <strong>Status:</strong>
                  <span className={`status-text ${selectedUser.u_status === '1' ? 'active' : 'inactive'}`}>{selectedUser.u_status === '1' ? "Active" : "Inactive"}</span>
                </div> */}
                <div className="detail-item">
                  <strong>Attendance:</strong>
                  <span className={selectedUser.is_logged_out === 0 ? 'status-present-text' : 'status-absent-text'}>
                    {selectedUser.is_logged_out === 0 ? 'Present' : 'Absent'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Leave Taken:</strong>
                  <span>
                    {selectedUser.is_logged_out === 0
                      ? '-'
                      : selectedUser.leave_track_status === 1
                        ? 'leave taken'
                        : 'no leaves taken'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal (for Projects tab) */}
      {projectModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={closeProjectModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Project Attendance Details</h2>
              <button className="close-button" onClick={closeProjectModal}>×</button>
            </div>
            <div className="modal-content">
              <table className="users-table">
                <thead>
                  <tr className="user-th">
                    <th>ID</th>
                    <th>NAME</th>
                    <th>STATUS</th>
                    <th>LEAVE TAKEN</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProjectUsers ? (
                    <tr><td colSpan={4}>Loading...</td></tr>
                  ) : projectUsersError ? (
                    <tr><td colSpan={4} style={{color: 'red'}}>{projectUsersError}</td></tr>
                  ) : projectUsers.length === 0 ? (
                    <tr><td colSpan={4}>No users found for this project.</td></tr>
                  ) : (
                    projectUsers.map((user, idx) => (
                      <tr key={idx} className="user-row">
                        <td>{user.u_id}</td>
                        <td>{[user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ')}</td>
                        <td>
                          <span className={user.is_logged_out === 0 ? 'status-present-text' : 'status-absent-text'}>
                            {user.is_logged_out === 0 ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td>
                          {user.is_logged_out === 0
                            ? '-'
                            : user.leave_track_status === 1
                              ? 'leave taken'
                              : 'no leaves taken'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Map modal removed; map now opens in a new tab */}
    </div>
  );
};

export default Attendance;
