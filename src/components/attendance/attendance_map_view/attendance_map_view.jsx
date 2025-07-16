import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import './attendance_map_view.css';
import { useLocation } from 'react-router-dom';

// Remove static projectOptions
const userOptions = [
  { value: '1', label: 'Alice Smith' },
  { value: '2', label: 'Bob Johnson' },
  { value: '3', label: 'Charlie Lee' },
];

const selectAllOption = { value: '__all__', label: 'Select All' };

const AttendanceMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // Store map instance
  const markersRef = useRef([]); // Store marker instances
  const nameLabelsRef = useRef([]); // Store name label InfoWindows
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [punchData, setPunchData] = useState([]);
  const [loadingPunch, setLoadingPunch] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);
  const [selectedUserRecord, setSelectedUserRecord] = useState(null); // For user details section

  // Fetch all users on mount
  useEffect(() => {
    setLoadingAllUsers(true);
    const token = localStorage.getItem('authToken');
    fetch('https://demo-expense.geomaticxevs.in/ET-api/user_details.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllUsers(data);
        } else {
          setAllUsers([]);
        }
      })
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingAllUsers(false));
  }, []);

  // Fetch users for selected project
  useEffect(() => {
    setSelectedUsers([]);
    if (!selectedProjects || selectedProjects.length === 0) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    const userId = localStorage.getItem('userid');
    // For multi-select, fetch for the first selected project (or could merge all team members for all selected projects)
    const projectId = selectedProjects[0]?.value;
    fetch('https://demo-expense.geomaticxevs.in/ET-api/get_project_details.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, project_id: projectId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.project_details && Array.isArray(data.project_details.team_members)) {
          setUsers(data.project_details.team_members);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [selectedProjects]);

  // User options logic (matches reports.jsx)
  const getUserOptions = () => (
    selectedProjects && selectedProjects.length > 0
      ? users.map(user => ({ value: user.user_id, label: user.full_name }))
      : allUsers.map(user => ({ value: user.u_id, label: [user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ') }))
  );
  const userOptions = getUserOptions();
  const optionsWithSelectAll = [selectAllOption, ...userOptions];

  // Multi-select with Select All logic
  const handleUserChange = (selected) => {
    if (!selected) {
      setSelectedUsers([]);
      return;
    }
    if (selected.some(option => option.value === '__all__')) {
      setSelectedUsers(userOptions);
    } else {
      setSelectedUsers(selected);
    }
  };

  // Compute value for Select (show Select All if all users are selected)
  const selectValue =
    selectedUsers.length === userOptions.length && userOptions.length > 0
      ? [selectAllOption, ...userOptions]
      : selectedUsers;

  // Fetch project options from API
  useEffect(() => {
    setLoadingProjects(true);
    const userId = localStorage.getItem('userid');
    if (!userId) {
      setProjectOptions([]);
      setLoadingProjects(false);
      return;
    }
    fetch('https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.projects)) {
          setProjectOptions(data.projects.map(project => ({
            value: project.project_id,
            label: project.project_name
          })));
        } else {
          setProjectOptions([]);
        }
      })
      .catch(() => setProjectOptions([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Helper to dynamically load scripts
  const loadScript = (src, id) => {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  };

  // Render a blank Google Map centered on India
  const renderMap = () => {
    if (!window.google || !window.google.maps) return;
    if (mapRef.current) mapRef.current.innerHTML = '';
    const mapCenter = { lat: 22.9734, lng: 78.6569 }; // Center of India
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
  };

  // Load map on mount
  useEffect(() => {
    loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAgIVtPj9I-jXY3fOUkV8k9CArQRQ7dkhc&v=weekly', 'google-maps');
    const waitForGoogle = setInterval(() => {
      if (window.google && window.google.maps && mapRef.current) {
        renderMap();
        clearInterval(waitForGoogle);
      }
    }, 200);
    return () => clearInterval(waitForGoogle);
  }, []);

  const plotPunchMarkers = (data) => {
    if (!window.google || !window.google.maps || !mapRef.current || !mapInstanceRef.current) return;
    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    // Clear previous name labels
    nameLabelsRef.current.forEach(label => label.close());
    nameLabelsRef.current = [];

    data.forEach((record) => {
      // Find user name for this record
      let userName = '';
      let userEmail = '';
      let userPhone = '';
      let userProfileImg = '';
      // Try to find from selectedUsers or allUsers
      const userObj = selectedUsers.find(u => String(u.value) === String(record.user_id)) ||
                      allUsers.find(u => String(u.u_id) === String(record.user_id));
      if (userObj) {
        userName = userObj.label || [userObj.u_fname, userObj.u_mname, userObj.u_lname].filter(Boolean).join(' ');
        userEmail = userObj.u_email || userObj.email || '';
        userPhone = userObj.u_phone || userObj.phone || '';
        userProfileImg = userObj.u_profile_img || userObj.profile_img || '';
      }
      // Plot login marker (green)
      if (record.login_lat_long && record.login_lat_long.trim() !== '') {
        const [lat, lng] = record.login_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: `Login: ${record.login_timestamp}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }
          });
          markersRef.current.push(marker);
          // Info window for login
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><b>Login</b><br/>${record.login_timestamp}</div>`
          });
          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
            setSelectedUserRecord({
              userName,
              userEmail,
              userPhone,
              userProfileImg,
              punchIn: record.login_timestamp,
              punchOut: record.logout_timestamp,
              isLogin: true,
              record
            });
          });
          // Name label above marker
          if (userName) {
            const nameLabel = new window.google.maps.InfoWindow({
              content: `<div style='font-family:Inter,sans-serif;font-size:0.98em;font-weight:600;padding:2px 8px;background:#fff;border-radius:6px;box-shadow:0 2px 6px rgba(99,102,241,0.08);border:1px solid #e0e7ff;'>${userName} (Login)</div>`
            });
            nameLabel.open(mapInstanceRef.current, marker);
            nameLabelsRef.current.push(nameLabel);
          }
        }
      }
      // Plot logout marker (red)
      if (record.logout_lat_long && record.logout_lat_long.trim() !== '') {
        const [lat, lng] = record.logout_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: `Logout: ${record.logout_timestamp}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });
          markersRef.current.push(marker);
          // Info window for logout
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><b>Logout</b><br/>${record.logout_timestamp}</div>`
          });
          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
            setSelectedUserRecord({
              userName,
              userEmail,
              userPhone,
              userProfileImg,
              punchIn: record.login_timestamp,
              punchOut: record.logout_timestamp,
              isLogin: false,
              record
            });
          });
          // Name label above marker
          if (userName) {
            const nameLabel = new window.google.maps.InfoWindow({
              content: `<div style='font-family:Inter,sans-serif;font-size:0.98em;font-weight:600;padding:2px 8px;background:#fff;border-radius:6px;box-shadow:0 2px 6px rgba(99,102,241,0.08);border:1px solid #e0e7ff;'>${userName} (Logout)</div>`
            });
            nameLabel.open(mapInstanceRef.current, marker);
            nameLabelsRef.current.push(nameLabel);
          }
        }
      }
    });
  };

  const handleSearch = async () => {
    if (!dateRange.from || !dateRange.to || selectedUsers.length === 0) {
      alert('Please select users and date range');
      return;
    }
    setLoadingPunch(true);
    setPunchData([]);
    const startDate = dateRange.from + ' 00:00:00';
    const endDate = dateRange.to + ' 23:59:59';

    try {
      const results = await Promise.all(selectedUsers.map(async (user) => {
        const res = await fetch('https://demo-expense.geomaticxevs.in/ET-api/fetch_punch_location.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.value,
            startDate,
            endDate
          })
        });
        const data = await res.json();
        return data.status === 'success' ? data.data : [];
      }));
      const flatData = results.flat();
      setPunchData(flatData);
      plotPunchMarkers(flatData);
    } catch (err) {
      alert('Failed to fetch punch data');
    } finally {
      setLoadingPunch(false);
    }
  };

  // Add this reset handler
  const handleReset = () => {
    setSelectedProjects([]);
    setSelectedUsers([]);
    setDateRange({ from: '', to: '' });
    setPunchData([]);
    setSelectedUserRecord(null); // Hide user details section
    // Remove all markers from the map
    if (markersRef.current) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
    // Remove all name labels
    if (nameLabelsRef.current) {
      nameLabelsRef.current.forEach(label => label.close());
      nameLabelsRef.current = [];
    }
  };

  return (
    <div className="attendance-map-root">
      {/* <button className="amap-back-btn" onClick={() => window.history.back()} aria-label="Back">
        <span className="amap-back-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.5 19L7.5 12L14.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="amap-back-text"></span>
      </button> */}
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
          {/* Hide Filter button */}
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
              isLoading={loadingProjects}
              noOptionsMessage={() => loadingProjects ? 'Loading...' : 'No projects found'}
            />
          </div>
          <div className="amap-filter-group">
            <label className="amap-filter-label">Select User/s</label>
            <Select
              isMulti
              isLoading={loadingUsers || loadingAllUsers}
              options={optionsWithSelectAll}
              value={selectValue}
              onChange={handleUserChange}
              placeholder="Select User/s..."
              isClearable
              classNamePrefix="amap-select"
              noOptionsMessage={() => (loadingUsers || loadingAllUsers) ? 'Loading...' : 'No users found'}
              isDisabled={loadingUsers || loadingAllUsers}
            />
          </div>
          <div className="amap-filter-group amap-date-range-group">
            <label className="amap-filter-label">Date Range</label>
            <div className="amap-date-range-inputs">
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                className="amap-date-input"
              />
              <span className="amap-date-separator">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                className="amap-date-input"
              />
            </div>
          </div>
          {/* Place Search and Reset buttons in a flex row */}
          <div className="amap-action-btn-row">
            <button className="amap-search-btn" onClick={handleSearch} disabled={loadingPunch}>
              <span className="amap-search-icon" aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center', marginRight: '0.6em'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
                  <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              {loadingPunch ? 'Searching...' : 'Search'}
            </button>
            <button className="amap-reset-btn" onClick={handleReset} disabled={loadingPunch}>
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
      {/* User Details Section: Show only when a marker is clicked */}
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
                src={selectedUserRecord.userProfileImg || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedUserRecord.userName || 'User')}
                alt="Profile"
                className="amap-user-profile-img"
              />
            </div>
            <div className="amap-user-details-info">
              <div className="amap-user-details-name">{selectedUserRecord.userName || 'N/A'}</div>
              <div className="amap-user-details-email">{selectedUserRecord.userEmail || 'N/A'}</div>
              <div className="amap-user-details-phone">{selectedUserRecord.userPhone || 'N/A'}</div>
              <div className="amap-user-details-punch">
                <span className="amap-user-details-punch-in">Punch In: {selectedUserRecord.punchIn || 'N/A'}</span>
                <span className="amap-user-details-punch-out">Punch Out: {selectedUserRecord.punchOut || 'N/A'}</span>
              </div>
              <button className="amap-user-details-view-btn">View More Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMap; 