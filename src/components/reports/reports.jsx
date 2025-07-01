import React, { useState, useEffect } from "react";
import "./reports.css";
// import "../expenses/add_expense/add_expense.css";
import { FaUser, FaCalendarAlt, FaGlobe, FaRedo, FaSearch } from 'react-icons/fa';
import Select from "react-select";

const dummyUsers = [
  { id: 1, name: "Alice Smith" },
  { id: 2, name: "Bob Johnson" },
  { id: 3, name: "Charlie Lee" },
];
const dummyDomains = [
  { id: 1, name: "Attendance" },
  { id: 2, name: "Leaves" },
  { id: 3, name: "Expense" },
  { id: 4, name: "Requisition" },
  { id: 5, name: "Work Report" },
];

const Reports = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attendanceTable, setAttendanceTable] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      const userId = localStorage.getItem("userid");
      if (!userId) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }
      try {
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoadingAllUsers(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/user_details.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllUsers(data);
        } else {
          setAllUsers([]);
        }
      } catch (err) {
        setAllUsers([]);
      } finally {
        setLoadingAllUsers(false);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Clear username if project changes
    setSelectedUser("");
    if (!selectedProject) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const userId = localStorage.getItem("userid");
      try {
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/get_project_details.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, project_id: selectedProject })
        });
        const data = await response.json();
        if (data.status === "success" && data.project_details && Array.isArray(data.project_details.team_members)) {
          setUsers(data.project_details.team_members);
        } else {
          setUsers([]);
        }
      } catch (err) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [selectedProject]);

  const handleReset = () => {
    setSelectedUser("");
    setSelectedDomain("");
    setSelectedProject("");
    setDateFrom("");
    setDateTo("");
  };

  const handleFetch = async () => {
    setShowResults(true);
    setAttendanceTable(null);
    setAttendanceError("");
    if (selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Attendance") {
      if (!selectedUser || !dateFrom || !dateTo) {
        setAttendanceError("Please select user, start date, and end date.");
        return;
      }
      setAttendanceLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ user_id: selectedUser, start_date: dateFrom, end_date: dateTo })
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.attendance)) {
          setAttendanceTable(data.attendance);
        } else {
          setAttendanceError(data.message || "No attendance data found.");
        }
      } catch (err) {
        setAttendanceError("Network error or invalid response");
      } finally {
        setAttendanceLoading(false);
      }
    }
  };

  return (
    <div className="expense-form-container">
      <h1 className="form-title">Reports</h1>
      <section className="form-section">
        <h2 className="section-title">Filter Your Report</h2>
        <div className="filter-reset-topright">
          <button className="reset-button" onClick={handleReset}><FaRedo /> Reset</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="project-select">Project <span style={{color: '#e74c3c'}}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Select
                id="project-select"
                isLoading={loadingProjects}
                options={projects.map(project => ({ value: project.project_id, label: project.project_name }))}
                value={projects.find(p => p.project_id === selectedProject) ? { value: selectedProject, label: projects.find(p => p.project_id === selectedProject)?.project_name } : null}
                onChange={option => setSelectedProject(option ? option.value : "")}
                placeholder="Select project"
                isClearable
                classNamePrefix="react-select"
                styles={{ container: base => ({ ...base, minWidth: 220 }) }}
                noOptionsMessage={() => loadingProjects ? "Loading..." : "No projects found"}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="user-select">Username <span style={{color: '#e74c3c'}}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Select
                id="user-select"
                isLoading={loadingUsers || loadingAllUsers}
                options={
                  selectedProject
                    ? users.map(user => ({ value: user.user_id, label: user.full_name }))
                    : allUsers.map(user => ({ value: user.u_id, label: [user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ') }))
                }
                value={
                  selectedProject
                    ? users.find(u => u.user_id === selectedUser) ? { value: selectedUser, label: users.find(u => u.user_id === selectedUser)?.full_name } : null
                    : allUsers.find(u => u.u_id === selectedUser) ? { value: selectedUser, label: [allUsers.find(u => u.u_id === selectedUser)?.u_fname, allUsers.find(u => u.u_id === selectedUser)?.u_mname, allUsers.find(u => u.u_id === selectedUser)?.u_lname].filter(Boolean).join(' ') } : null
                }
                onChange={option => setSelectedUser(option ? option.value : "")}
                placeholder="Select user"
                isClearable
                classNamePrefix="react-select"
                styles={{ container: base => ({ ...base, minWidth: 220 }) }}
                noOptionsMessage={() => (loadingUsers || loadingAllUsers) ? "Loading..." : "No users found"}
                isDisabled={loadingUsers || loadingAllUsers}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="domain-select">Domain <span style={{color: '#e74c3c'}}>*</span></label>
            <div style={{ position: 'relative' }}>
              <FaGlobe className="input-icon" style={{ left: '1.1rem', top: '50%', position: 'absolute', transform: 'translateY(-50%)', zIndex: 2, color: '#6552f7' }} />
              <select
                id="domain-select"
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
                className="input-select modern-input"
                style={{ paddingLeft: '2.5rem', minWidth: '220px' }}
              >
                <option value="">Select domain</option>
                {dummyDomains.map(domain => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group date-range-small">
            <label>Date Range <span style={{color: '#e74c3c'}}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <FaCalendarAlt className="input-icon" style={{ left: '1.1rem', top: '50%', position: 'absolute', transform: 'translateY(-50%)', zIndex: 2, color: '#6552f7' }} />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="date-input modern-input"
                placeholder="From"
                style={{ paddingLeft: '2.5rem' }}
              />
              <span className="date-range-separator">to</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={e => setDateTo(e.target.value)}
                className="date-input modern-input"
                placeholder="To"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '2rem', justifyContent: 'flex-end', display: 'flex', gap: '1.5rem' }}>
          <button className="add-expense-button fetch-data-small" onClick={handleFetch}><FaSearch /> Get Report</button>
        </div>
      </section>
      {showResults && (
        <section className="form-section">
          <h2 className="section-title">Results</h2>
          {attendanceLoading ? (
            <div className="results-placeholder"><p className="results-text">Loading attendance data...</p></div>
          ) : attendanceError ? (
            <div className="results-placeholder"><p className="results-text" style={{color: 'red'}}>{attendanceError}</p></div>
          ) : attendanceTable ? (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    {attendanceTable.map((att, idx) => (
                      <th key={idx}>{att.date}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{(() => {
                      if (selectedProject && users.length > 0) {
                        const u = users.find(u => u.user_id === selectedUser);
                        return u ? u.full_name : "";
                      } else if (allUsers.length > 0) {
                        const u = allUsers.find(u => u.u_id === selectedUser);
                        return u ? [u.u_fname, u.u_mname, u.u_lname].filter(Boolean).join(' ') : "";
                      }
                      return "";
                    })()}</td>
                    {attendanceTable.map((att, idx) => {
                      let val = "";
                      if (att.isHoliday || att.isSunday) val = "H";
                      else if (att.hasLogin && att.is_logged_out) val = "P";
                      else if (!att.hasLogin && !att.is_logged_out) val = "A";
                      else if (att.hasLogin && !att.is_logged_out) val = "NLO";
                      else val = "-";
                      return <td key={idx}>{val}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="results-placeholder">
              <p className="results-text">No data to display. Please use the filters above and click <b>Fetch Data</b> to view your report.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Reports;
