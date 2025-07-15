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
    new window.google.maps.Map(mapRef.current, {
      zoom: 5,
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
    if (!window.google || !window.google.maps || !mapRef.current) return;
    // Re-initialize the map
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 5,
      center: { lat: 22.9734, lng: 78.6569 }
    });

    data.forEach((record) => {
      // Plot login marker (green)
      if (record.login_lat_long) {
        const [lat, lng] = record.login_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          new window.google.maps.Marker({
            position: { lat, lng },
            map,
            title: `Login: ${record.login_timestamp}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }
          });
        }
      }
      // Plot logout marker (red)
      if (record.logout_lat_long) {
        const [lat, lng] = record.logout_lat_long.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          new window.google.maps.Marker({
            position: { lat, lng },
            map,
            title: `Logout: ${record.logout_timestamp}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });
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

  return (
    <div className="attendance-map-root">
      <button className="amap-back-btn" onClick={() => window.history.back()} aria-label="Back">
        <span className="amap-back-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.5 19L7.5 12L14.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="amap-back-text">Back</span>
      </button>
      <div className="amap-filter-section">
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
        <button className="amap-search-btn" onClick={handleSearch} disabled={loadingPunch}>
          <span className="amap-search-icon" aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center', marginRight: '0.6em'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {loadingPunch ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div id="map" ref={mapRef} className="attendance-map" />
    </div>
  );
};

export default AttendanceMap; 