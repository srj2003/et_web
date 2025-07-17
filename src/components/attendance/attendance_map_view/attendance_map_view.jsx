import React, { useEffect, useRef, useState, useCallback } from 'react';
import Select from 'react-select';
import './attendance_map_view.css';
import { useNavigate } from 'react-router-dom';

const selectAllOption = { value: '__all__', label: 'Select All' };

const AttendanceMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const nameLabelsRef = useRef([]);
  
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [punchData, setPunchData] = useState([]);
  const [filterVisible, setFilterVisible] = useState(true);
  const [selectedUserRecord, setSelectedUserRecord] = useState(null);
  const [loading, setLoading] = useState({
    projects: false,
    users: false,
    allUsers: false,
    punch: false
  });
  const [attendanceUsers, setAttendanceUsers] = useState([]);

  // Generic API helper
  const apiCall = useCallback(async (url, body = null, useAuth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (useAuth) {
      headers.Authorization = `Bearer ${localStorage.getItem('authToken')}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : null
    });
    return response.json();
  }, []);

  // Update loading state helper
  const updateLoading = useCallback((key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  // Fetch all users on mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      updateLoading('allUsers', true);
      try {
        const data = await apiCall('https://demo-expense.geomaticxevs.in/ET-api/user_details.php', null, true);
        setAllUsers(Array.isArray(data) ? data : []);
      } catch {
        setAllUsers([]);
      } finally {
        updateLoading('allUsers', false);
      }
    };
    fetchAllUsers();
  }, [apiCall, updateLoading]);

  // Fetch users for selected project
  useEffect(() => {
    const fetchUsers = async () => {
      setSelectedUsers([]);
      if (!selectedProjects.length) {
        setUsers([]);
        return;
      }
      
      updateLoading('users', true);
      try {
        const userId = localStorage.getItem('userid');
        const data = await apiCall('https://demo-expense.geomaticxevs.in/ET-api/get_project_details.php', {
          user_id: userId,
          project_id: selectedProjects[0]?.value
        });
        
        setUsers(
          data.status === 'success' && Array.isArray(data.project_details?.team_members)
            ? data.project_details.team_members
            : []
        );
      } catch {
        setUsers([]);
      } finally {
        updateLoading('users', false);
      }
    };
    fetchUsers();
  }, [selectedProjects, apiCall, updateLoading]);

  // Fetch project options
  useEffect(() => {
    const fetchProjects = async () => {
      updateLoading('projects', true);
      const userId = localStorage.getItem('userid');
      if (!userId) {
        setProjectOptions([]);
        updateLoading('projects', false);
        return;
      }
      
      try {
        const data = await apiCall('https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php', {
          user_id: userId
        });
        
        setProjectOptions(
          data.status === 'success' && Array.isArray(data.projects)
            ? data.projects.map(project => ({
                value: project.project_id,
                label: project.project_name
              }))
            : []
        );
      } catch {
        setProjectOptions([]);
      } finally {
        updateLoading('projects', false);
      }
    };
    fetchProjects();
  }, [apiCall, updateLoading]);

  // Fetch users for attendance_under_user.php if no project is selected
  useEffect(() => {
    if (selectedProjects.length === 0) {
      const fetchAttendanceUsers = async () => {
        updateLoading('allUsers', true);
        try {
          const userId = localStorage.getItem('userid');
          const data = await apiCall('https://demo-expense.geomaticxevs.in/ET-api/attendance_under_user.php', { userId }, true);
          console.log(data);
          if (data.status === 'success' && Array.isArray(data.data)) {
            setAttendanceUsers(data.data);
          } else {
            setAttendanceUsers([]);
          }
        } catch {
          setAttendanceUsers([]);
        } finally {
          updateLoading('allUsers', false);
        }
      };
      fetchAttendanceUsers();
    } else {
      setAttendanceUsers([]);
    }
  }, [selectedProjects, apiCall, updateLoading]);

  // User options logic
  const userOptions = selectedProjects.length > 0
    ? users.map(user => ({ value: user.user_id, label: user.full_name }))
    : attendanceUsers.length > 0
      ? attendanceUsers.map(user => ({
          value: user.u_id,
          label: [user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ')
        }))
      : [];

  const optionsWithSelectAll = [selectAllOption, ...userOptions];

  // Multi-select with Select All logic
  const handleUserChange = useCallback((selected) => {
    if (!selected) {
      setSelectedUsers([]);
      return;
    }
    
    setSelectedUsers(
      selected.some(option => option.value === '__all__')
        ? userOptions
        : selected
    );
  }, [userOptions]);

  // Compute value for Select
  const selectValue = selectedUsers.length === userOptions.length && userOptions.length > 0
    ? [selectAllOption, ...userOptions]
    : selectedUsers;

  // Load Google Maps script
  useEffect(() => {
    const loadScript = () => {
      if (document.getElementById('google-maps')) return;
      
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAgIVtPj9I-jXY3fOUkV8k9CArQRQ7dkhc&v=weekly';
      script.id = 'google-maps';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadScript();
    
    const waitForGoogle = setInterval(() => {
      if (window.google?.maps && mapRef.current) {
        renderMap();
        clearInterval(waitForGoogle);
      }
    }, 200);

    return () => clearInterval(waitForGoogle);
  }, []);

  // Render map
  const renderMap = useCallback(() => {
    if (!window.google?.maps || !mapRef.current) return;
    
    if (mapRef.current) mapRef.current.innerHTML = '';
    
    const mapCenter = { lat: 22.9734, lng: 78.6569 };
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: mapCenter,
      mapTypeId: 'terrain',
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: window.google.maps.ControlPosition.BOTTOM_LEFT,
        style: window.google.maps.MapTypeControlStyle.DEFAULT
      }
    });
  }, []);

  // Clear markers and labels
  const clearMarkersAndLabels = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    nameLabelsRef.current.forEach(label => label.close());
    nameLabelsRef.current = [];
  }, []);

  // Create marker
  const createMarker = useCallback((lat, lng, title, iconUrl, content, isLogin, userInfo) => {
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      title,
      icon: { url: iconUrl }
    });

    markersRef.current.push(marker);

    const infoWindow = new window.google.maps.InfoWindow({ content });
    
    marker.addListener('click', async () => {
      infoWindow.open(mapInstanceRef.current, marker);
      // Fetch user details from dashboard.php
      try {
        const dashboardRes = await apiCall('https://demo-expense.geomaticxevs.in/ET-api/user_details_map_view.php', { user_id: userInfo.user_id }, true);
     
        if (dashboardRes.status === 'success' && dashboardRes.data) {
          setSelectedUserRecord({
            userName: [dashboardRes.data.u_fname, dashboardRes.data.u_mname, dashboardRes.data.u_lname].filter(Boolean).join(' '),
            userEmail: dashboardRes.data.u_email,
            userPhone: dashboardRes.data.u_mob,
            userProfileImg: dashboardRes.data.u_pro_img,
            punchIn: userInfo.punchIn,
            punchOut: userInfo.punchOut,
            record: userInfo.record
          });

         
        } else {
          setSelectedUserRecord({ ...userInfo, isLogin });
        }
      } catch {
        setSelectedUserRecord({ ...userInfo, isLogin });
      }
    });

    // Add name label
    if (userInfo.userName) {
      const labelType = isLogin ? 'Login' : 'Logout';
      const nameLabel = new window.google.maps.InfoWindow({
        content: `<div style='font-family:Inter,sans-serif;font-size:0.98em;font-weight:600;padding:2px 8px;background:#fff;border-radius:6px;box-shadow:0 2px 6px rgba(99,102,241,0.08);border:1px solid #e0e7ff;'>${userInfo.userName} (${labelType})</div>`
      });
      nameLabel.open(mapInstanceRef.current, marker);
      nameLabelsRef.current.push(nameLabel);
    }
  }, [apiCall]);

  // Plot markers
  const plotPunchMarkers = useCallback((data) => {
    if (!window.google?.maps || !mapInstanceRef.current) return;
    
    clearMarkersAndLabels();

    data.forEach((record) => {
      // Find user info
      const userObj = selectedUsers.find(u => String(u.value) === String(record.user_id)) ||
                      allUsers.find(u => String(u.u_id) === String(record.user_id));
      
      const userId = record.user_id; // <-- This is the correct user_id for the marker
      const userInfo = {
        user_id: userId, // <-- Add user_id to userInfo
        userName: userObj ? (userObj.label || [userObj.u_fname, userObj.u_mname, userObj.u_lname].filter(Boolean).join(' ')) : '',
        userEmail: userObj?.u_email || userObj?.email || '',
        userPhone: userObj?.u_phone || userObj?.phone || '',
        userProfileImg: userObj?.u_profile_img || userObj?.profile_img || '',
        punchIn: record.login_timestamp,
        punchOut: record.logout_timestamp,
        record
      };

      // Plot login marker
      if (record.login_lat_long?.trim()) {
        const [lat, lng] = record.login_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          createMarker(
            lat, lng,
            `Login: ${record.login_timestamp}`,
            'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            `<div><b>Login</b><br/>${record.login_timestamp}</div>`,
            true,
            userInfo // <-- Pass userInfo with correct user_id
          );
        }
      }

      // Plot logout marker
      if (record.logout_lat_long?.trim()) {
        const [lat, lng] = record.logout_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          createMarker(
            lat, lng,
            `Logout: ${record.logout_timestamp}`,
            'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            `<div><b>Logout</b><br/>${record.logout_timestamp}</div>`,
            false,
            userInfo // <-- Pass userInfo with correct user_id
          );
        }
      }
    });
  }, [selectedUsers, allUsers, createMarker, clearMarkersAndLabels]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!dateRange.from || !dateRange.to || selectedUsers.length === 0) {
      alert('Please select users and date range');
      return;
    }

    updateLoading('punch', true);
    setPunchData([]);
    
    const startDate = `${dateRange.from} 00:00:00`;
    const endDate = `${dateRange.to} 23:59:59`;

    try {
      const results = await Promise.all(
        selectedUsers.map(user =>
          apiCall('https://demo-expense.geomaticxevs.in/ET-api/fetch_punch_location.php', {
            user_id: user.value,
            startDate,
            endDate
          })
        )
      );

      const flatData = results.flatMap(result => 
        result.status === 'success' ? result.data : []
      );
      
      setPunchData(flatData);
      plotPunchMarkers(flatData);
    } catch {
      alert('Failed to fetch punch data');
    } finally {
      updateLoading('punch', false);
    }
  }, [dateRange, selectedUsers, apiCall, updateLoading, plotPunchMarkers]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSelectedProjects([]);
    setSelectedUsers([]);
    setDateRange({ from: '', to: '' });
    setPunchData([]);
    setSelectedUserRecord(null);
    clearMarkersAndLabels();
  }, [clearMarkersAndLabels]);

  const navigate = useNavigate();

  return (
    <div className="attendance-map-root">
      {/* Show Filter floating button */}
      {!filterVisible && (
        <button className="amap-show-filter-btn" onClick={() => setFilterVisible(true)}>
          <span className="amap-show-filter-icon" aria-hidden="true" style={{marginRight: '0.5em'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor"/>
            </svg>
          </span>
          Show Filter
        </button>
      )}

      {/* Filter section */}
      {filterVisible && (
        <div className="amap-filter-section">
          <button className="amap-hide-filter-btn" onClick={() => setFilterVisible(false)} title="Hide Filter" type="button">
            <span className="amap-hide-filter-icon" aria-hidden="true">
              <span style={{fontSize:"30px"}}>--</span>
            </span>
          </button>
          
          <div className="amap-filter-group">
            <label className="amap-filter-label">Select Project/s</label>
            <Select
              isMulti
              options={projectOptions}
              classNamePrefix="amap-select"
              placeholder="Select Project/s..."
              value={selectedProjects}
              onChange={setSelectedProjects}
              isLoading={loading.projects}
              noOptionsMessage={() => loading.projects ? 'Loading...' : 'No projects found'}
            />
          </div>

          <div className="amap-filter-group">
            <label className="amap-filter-label">Select User/s</label>
            <Select
              isMulti
              isLoading={loading.users || loading.allUsers}
              options={optionsWithSelectAll}
              value={selectValue}
              onChange={handleUserChange}
              placeholder="Select User/s..."
              isClearable
              classNamePrefix="amap-select"
              noOptionsMessage={() => (loading.users || loading.allUsers) ? 'Loading...' : 'No users found'}
              isDisabled={loading.users || loading.allUsers}
            />
          </div>

          <div className="amap-filter-group amap-date-range-group">
            <label className="amap-filter-label">Date Range</label>
            <div className="amap-date-range-inputs">
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="amap-date-input"
              />
              <span className="amap-date-separator">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="amap-date-input"
              />
            </div>
          </div>

          <div className="amap-action-btn-row">
            <button className="amap-search-btn" onClick={handleSearch} disabled={loading.punch}>
              <span className="amap-search-icon" aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center', marginRight: '0.6em'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
                  <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              {loading.punch ? 'Searching...' : 'Search'}
            </button>
            <button className="amap-reset-btn" onClick={handleReset} disabled={loading.punch}>
              <span className="amap-reset-icon" aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center', marginRight: '0.4em'}}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4V1L5 6l5 5V7c3.31 0 6 2.69 6 6 0 1.1-.9 2-2 2s-2-.9-2-2h-2c0 2.21 1.79 4 4 4s4-1.79 4-4c0-4.42-3.58-8-8-8z" fill="currentColor"/>
                </svg>
              </span>
              Reset
            </button>
          </div>
        </div>
      )}

      <div id="map" ref={mapRef} className="attendance-map" />

      {/* User Details Section */}
      {selectedUserRecord && (
        <div className="amap-user-details-section">
          <button
            className="amap-user-details-close-btn"
            onClick={() => setSelectedUserRecord(null)}
            title="Close"
            type="button"
            style={{position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.5rem', color: '#6366f1', cursor: 'pointer', zIndex: 1}}
          >
            &times;
          </button>
          <div className="amap-user-details-card">
            <div className="amap-user-profile-img-wrap">
              <img
                src={selectedUserRecord.userProfileImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserRecord.userName || 'User')}`}
                alt="Profile"
                className="amap-user-profile-img"
              />
            </div>
            <div className="amap-user-details-info">
              <div className="amap-user-details-name">{selectedUserRecord.userName || 'N/A'}</div>
              <div className="amap-user-details-email">{selectedUserRecord.userEmail || 'N/A'}</div>
              <div className="amap-user-details-phone">{selectedUserRecord.userPhone || 'N/A'}</div>
              <div className="amap-user-details-punch">
                {/* Format punch in date and time */}
                {(() => {
                  const formatDate = (dt) => {
                    if (!dt) return { date: 'N/A', time: 'N/A' };
                    const d = new Date(dt.replace(/-/g, '/'));
                    if (isNaN(d)) return { date: 'N/A', time: 'N/A' };
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const date = `${day}.${month}.${year}`;
                    const time = d.toTimeString().slice(0, 5);
                    return { date, time };
                  };
                  const punchIn = formatDate(selectedUserRecord.punchIn);
                  const punchOut = formatDate(selectedUserRecord.punchOut);
                  return (
                    <>
                      <span className="amap-user-details-punch-in">
                        Punch In: {punchIn.date} <span style={{marginLeft: '8px', color: '#6366f1'}}></span> {punchIn.time}
                      </span>
                      <span className="amap-user-details-punch-out" style={{marginLeft: '18px'}}>
                        Punch Out: {punchOut.date} <span style={{marginLeft: '8px', color: '#6366f1'}}></span> {punchOut.time}
                      </span>
                    </>
                  );
                })()}
              </div>
              <button className="amap-user-details-view-btn" onClick={() => navigate("/reports")}>
                View More Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMap;