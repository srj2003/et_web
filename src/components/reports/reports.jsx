import React, { useState, useEffect } from "react";
import "./reports.css";
// import "../expenses/add_expense/add_expense.css";
import { FaUser, FaCalendarAlt, FaGlobe, FaRedo, FaSearch, FaDownload } from 'react-icons/fa';
import Select from "react-select";
import { useLocation } from 'react-router-dom';

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
  const [selectedUsers, setSelectedUsers] = useState([]);
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
  const [workReportTable, setWorkReportTable] = useState(null);
  const [workReportLoading, setWorkReportLoading] = useState(false);
  const [workReportError, setWorkReportError] = useState("");
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState(null);
  const [expenseReportTable, setExpenseReportTable] = useState([]);
  const [expenseReportLoading, setExpenseReportLoading] = useState(false);
  const [expenseReportError, setExpenseReportError] = useState("");
  const location = useLocation();

  useEffect(() => {
    // If navigated with state, pre-populate only user
    if (location && location.state) {
      const { userId, userName } = location.state;
      if (userId && userName) {
        setSelectedUsers([{ value: userId, label: userName }]);
        console.log(selectedUsers.user_id);
      }
    }
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
  }, [location]);

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
    setSelectedUsers([]);
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

  // Effect: fetch expense heads when domain is set to Expense
  useEffect(() => {
    const isExpenseDomain = dummyDomains.find(d => d.id == selectedDomain)?.name === 'Expense';
    if (isExpenseDomain && expenseTypes.length === 0) {
      const fetchExpenseHeads = async () => {
        setLoadingExpenseTypes(true);
        try {
          const token = localStorage.getItem("authToken");
          const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_heads=true", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setExpenseTypes(data.data);
          } else {
            setExpenseTypes([]);
          }
        } catch (err) {
          setExpenseTypes([]);
        } finally {
          setLoadingExpenseTypes(false);
        }
      };
      fetchExpenseHeads();
    }
    // Reset selected expense type if domain changes
    if (!isExpenseDomain) setSelectedExpenseType(null);
  }, [selectedDomain]);

  const handleReset = () => {
    setSelectedUsers([]);
    setSelectedDomain("");
    setSelectedProject("");
    setDateFrom("");
    setDateTo("");
    setShowResults(false);
  };

  const handleFetch = async () => {
    setShowResults(true);
    setAttendanceTable(null);
    setAttendanceError("");
    setWorkReportTable(null);
    setWorkReportError("");
    setExpenseReportTable([]);
    setExpenseReportError("");
    if (selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Attendance") {
      if (!selectedUsers.length || !dateFrom || !dateTo) {
        setAttendanceError("Please select at least one user, start date, and end date.");
        return;
      }
      setAttendanceLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        // Fetch attendance for each user
        const userFetches = selectedUsers.map(userOption => {
          const userId = userOption.value;
          return fetch("https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId, start_date: dateFrom, end_date: dateTo })
          })
            .then(res => res.json())
            .then(data => ({ userId, data }));
        });
        const results = await Promise.all(userFetches);
        // Map: userId -> attendance array
        const attendanceResults = {};
        results.forEach(({ userId, data }) => {
          if (data.success && Array.isArray(data.attendance)) {
            attendanceResults[userId] = data.attendance;
          } else {
            attendanceResults[userId] = { error: data.message || "No attendance data found." };
          }
        });
        setAttendanceTable(attendanceResults);
      } catch (err) {
        setAttendanceError("Network error or invalid response");
      } finally {
        setAttendanceLoading(false);
      }
    }
    else if (selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Work Report") {
      if (!selectedUsers.length || !dateFrom || !dateTo) {
        setWorkReportError("Please select at least one user, start date, and end date.");
        return;
      }
      setWorkReportLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/get_all_work_reports.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          // No body needed for all reports
        });
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.reports)) {
          // Filter by selected users, project, and date range
          const selectedUserIds = selectedUsers.map(u => u.value);
          const filtered = data.reports.filter(r => {
            const userMatch = selectedUserIds.includes(String(r.user_id)) || selectedUserIds.includes(Number(r.user_id));
            const projectMatch = !selectedProject || (r.project_name && projects.find(p => p.project_id === selectedProject)?.project_name === r.project_name);
            const dateMatch = (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo);
            return userMatch && projectMatch && dateMatch;
          });
          setWorkReportTable(filtered);
        } else {
          setWorkReportError(data.message || "No work report data found.");
        }
      } catch (err) {
        setWorkReportError("Network error or invalid response");
      } finally {
        setWorkReportLoading(false);
      }
    }
    else if (selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Expense") {
      if (!selectedUsers.length || !dateFrom || !dateTo) {
        setExpenseReportError("Please select at least one user, start date, and end date.");
        return;
      }
      setExpenseReportLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        // Fetch for each user
        const userFetches = selectedUsers.map(userOption => {
          const userId = userOption.value;
          const body = {
            user_id: userId,
            start_date: dateFrom,
            end_date: dateTo,
          };
          if (selectedProject) body.expense_type_id = selectedProject;
          if (selectedExpenseType) body.expense_head_id = selectedExpenseType;
          return fetch("https://demo-expense.geomaticxevs.in/ET-api/expense_report_fetcher.php", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(body)
          })
            .then(res => res.json())
            .then(data => ({ userId, data, userLabel: userOption.label }));
        });
        const results = await Promise.all(userFetches);
        // Flatten all results, add userLabel to each row
        const allRows = [];
        results.forEach(({ userId, data, userLabel }) => {
          if (data.status === "success" && Array.isArray(data.data)) {
            data.data.forEach(row => allRows.push({ ...row, userLabel }));
          }
        });
        setExpenseReportTable(allRows);
      } catch (err) {
        setExpenseReportError("Network error or invalid response");
      } finally {
        setExpenseReportLoading(false);
      }
    }
  };

  // Helper to get user options
  const getUserOptions = () => (
    selectedProject
      ? users.map(user => ({ value: user.user_id, label: user.full_name }))
      : allUsers.map(user => ({ value: user.u_id, label: [user.u_fname, user.u_mname, user.u_lname].filter(Boolean).join(' ') }))
  );
  const userOptions = getUserOptions();
  const selectAllOption = { value: '__all__', label: 'Select All' };
  const optionsWithSelectAll = [selectAllOption, ...userOptions];

  // Handle multi-select with Select All
  const handleUserChange = (selected) => {
    if (!selected) {
      setSelectedUsers([]);
      return;
    }
    // If Select All is selected
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

  // Helper to get financial year options (current year +/- 5 years)
  const getFinancialYearOptions = () => {
    const now = new Date();
    const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const years = [];
    for (let i = -14; i <= 14; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push({
        value: `${startYear}-${endYear}`,
        label: `${startYear}-${endYear}`,
        from: `${startYear}-04-01`,
        to: `${endYear}-03-31`,
      });
    }
    return years;
  };
  const financialYearOptions = getFinancialYearOptions();

  // Find if Leaves is selected
  const isLeavesDomain = dummyDomains.find(d => d.id == selectedDomain)?.name === 'Leaves';

  // Handler for financial year change
  const handleFinancialYearChange = (option) => {
    if (option) {
      setDateFrom(option.from);
      setDateTo(option.to);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  // Helper: get all dates in range as strings (YYYY-MM-DD)
  function getAllDateStringsInRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
  // Helper: format date as DD-MMM
  function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    return `${day}-${month}`;
  }

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
                isMulti
                isLoading={loadingUsers || loadingAllUsers}
                options={optionsWithSelectAll}
                value={selectValue}
                onChange={handleUserChange}
                placeholder="Select user(s)"
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
          {/* Expense Type dropdown (conditionally rendered) */}
          {dummyDomains.find(d => d.id == selectedDomain)?.name === 'Expense' && (
            <div className="form-group">
              <label htmlFor="expense-type-select">Expense Type <span style={{color: '#e74c3c'}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Select
                  id="expense-type-select"
                  isLoading={loadingExpenseTypes}
                  options={expenseTypes}
                  value={expenseTypes.find(t => t.value === selectedExpenseType) || null}
                  onChange={option => setSelectedExpenseType(option ? option.value : null)}
                  placeholder="Select expense type"
                  isClearable
                  classNamePrefix="react-select"
                  styles={{ container: base => ({ ...base, minWidth: 220 }) }}
                  noOptionsMessage={() => loadingExpenseTypes ? "Loading..." : "No expense types found"}
                />
              </div>
            </div>
          )}
          <div className="form-group date-range-small">
            {isLeavesDomain ? (
              <>
                <label>Financial Year <span style={{color: '#e74c3c'}}>*</span></label>
                <Select
                  id="financial-year-select"
                  options={financialYearOptions}
                  value={financialYearOptions.find(opt => opt.from === dateFrom && opt.to === dateTo) || null}
                  onChange={handleFinancialYearChange}
                  placeholder="Select financial year"
                  isClearable
                  classNamePrefix="react-select"
                  styles={{ container: base => ({ ...base, minWidth: 220 }) }}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '2rem', justifyContent: 'flex-end', display: 'flex', gap: '1.5rem' }}>
          <button className="add-expense-button fetch-data-small" onClick={handleFetch}><FaSearch /> Get Report</button>
        </div>
      </section>
      {showResults && (
        <section className="form-section">
          <h2 className="section-title">Results</h2>
          <div className="results-download-topright">
            <button className="download-report-button" onClick={() => alert('Download coming soon!')}>
              <FaDownload style={{ marginRight: '0.5rem' }} /> Download Report
            </button>
          </div>
          {selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Work Report" ? (
            workReportLoading ? (
              <div className="results-placeholder"><p className="results-text">Loading work report data...</p></div>
            ) : workReportError ? (
              <div className="results-placeholder"><p className="results-text" style={{color: 'red'}}>{workReportError}</p></div>
            ) : workReportTable && workReportTable.length > 0 && dateFrom && dateTo ? (
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User Name</th>
                      <th>Project Name</th>
                      <th>Work Report</th>
                      <th>Submission Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* For each date in range, show all reports for that date, or empty row if none */}
                    {getAllDateStringsInRange(dateFrom, dateTo).map(dateStr => {
                      const reportsForDate = workReportTable.filter(r => r.date === dateStr);
                      if (reportsForDate.length === 0) {
                        return (
                          <tr key={dateStr}>
                            <td>{formatDateShort(dateStr)}</td>
                            <td colSpan={4} style={{textAlign:'center',color:'#bbb'}}>No report</td>
                          </tr>
                        );
                      }
                      return reportsForDate.map((report, idx) => (
                        <tr key={dateStr + '-' + (report.id || idx)}>
                          <td>{formatDateShort(report.date)}</td>
                          <td>{report.user_name}</td>
                          <td>{report.project_name}</td>
                          <td className="work-report-cell" style={{ whiteSpace: 'pre-line' }}>{report.work_details}</td>
                          <td>{report.submission_time}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="results-placeholder">
                <p className="results-text">No data to display. Please use the filters above and click <b>Fetch Data</b> to view your report.</p>
              </div>
            )
          ) : selectedDomain && dummyDomains.find(d => d.id == selectedDomain)?.name === "Expense" ? (
            expenseReportLoading ? (
              <div className="results-placeholder"><p className="results-text">Loading expense report data...</p></div>
            ) : expenseReportError ? (
              <div className="results-placeholder"><p className="results-text" style={{color: 'red'}}>{expenseReportError}</p></div>
            ) : expenseReportTable && expenseReportTable.length > 0 ? (
              <div className="attendance-table-wrapper">
                <table className="attendance-table expense-report-table custom-expense-table">
                  <thead>
                    <tr>
                      <th>projects</th>
                      <th>user</th>
                      <th>expense types</th>
                      {/* Dynamically add maxEntryCount columns for expense entries */}
                      {(() => {
                        // Build nested structure to find maxEntryCount
                        const grouped = {};
                        let maxEntryCount = 0;
                        expenseReportTable.forEach(row => {
                          const project = row.expense_type_name || '-';
                          const user = row.userLabel;
                          const head = row.expense_head_title;
                          const dateKey = row.expense_track_created_at?.split('T')[0] || row.expense_track_created_at?.split(' ')[0];
                          const amount = Number(row.expense_total_amount) || 0;
                          if (!grouped[project]) grouped[project] = {};
                          if (!grouped[project][user]) grouped[project][user] = {};
                          if (!grouped[project][user][head]) grouped[project][user][head] = [];
                          grouped[project][user][head].push({ amount, date: dateKey });
                          if (grouped[project][user][head].length > maxEntryCount) maxEntryCount = grouped[project][user][head].length;
                        });
                        return Array.from({ length: maxEntryCount }).map((_, i) => (
                          <th key={i}> </th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Group by project, then user, then expense head, and use rowspan for project/user. Each expense type row shows each entry in its own cell. */}
                    {(() => {
                      // Build nested structure and find maxEntryCount
                      const grouped = {};
                      let maxEntryCount = 0;
                      expenseReportTable.forEach(row => {
                        const project = row.expense_type_name || '-';
                        const user = row.userLabel;
                        const head = row.expense_head_title;
                        const dateKey = row.expense_track_created_at?.split('T')[0] || row.expense_track_created_at?.split(' ')[0];
                        const amount = Number(row.expense_total_amount) || 0;
                        if (!grouped[project]) grouped[project] = {};
                        if (!grouped[project][user]) grouped[project][user] = {};
                        if (!grouped[project][user][head]) grouped[project][user][head] = [];
                        grouped[project][user][head].push({ amount, date: dateKey });
                        if (grouped[project][user][head].length > maxEntryCount) maxEntryCount = grouped[project][user][head].length;
                      });
                      // Prepare flat rows with rowspan info
                      const rows = [];
                      Object.entries(grouped).forEach(([project, users]) => {
                        const projectRowspan = Object.values(users).reduce((sum, heads) => sum + Object.keys(heads).length, 0);
                        let projectRendered = false;
                        Object.entries(users).forEach(([user, heads]) => {
                          const userRowspan = Object.keys(heads).length;
                          let userRendered = false;
                          Object.entries(heads).forEach(([head, details], idx) => {
                            rows.push(
                              <tr key={project + '-' + user + '-' + head}>
                                {!projectRendered && (
                                  <td rowSpan={projectRowspan} className="custom-project-cell">{project}</td>
                                )}
                                {!userRendered && (
                                  <td rowSpan={userRowspan} className="custom-user-cell">{user}</td>
                                )}
                                <td className="custom-expense-type-cell">
                                  {head}
                                </td>
                                {/* Render each entry in its own cell, fill up to maxEntryCount */}
                                {Array.from({ length: maxEntryCount }).map((_, i) => (
                                  <td key={i} className="custom-expense-entry-cell">
                                    {details[i] ? (<><b>{details[i].amount}/-</b> [{(() => { const d = new Date(details[i].date); return `${d.getDate()}.${d.getMonth()+1}.${String(d.getFullYear()).slice(-2)}`; })()}]</>) : ''}
                                  </td>
                          ))}
                        </tr>
                            );
                            projectRendered = true;
                            userRendered = true;
                          });
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="results-placeholder">
                <p className="results-text">No data to display. Please use the filters above and click <b>Fetch Data</b> to view your report.</p>
              </div>
            )
          ) : attendanceLoading ? (
            <div className="results-placeholder"><p className="results-text">Loading attendance data...</p></div>
          ) : attendanceError ? (
            <div className="results-placeholder"><p className="results-text" style={{color: 'red'}}>{attendanceError}</p></div>
          ) : attendanceTable && selectedUsers.length > 0 ? (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    {/* Use the first user's dates as columns */}
                    {(() => {
                      const firstUserId = selectedUsers[0]?.value;
                      const firstUserData = attendanceTable[firstUserId];
                      if (Array.isArray(firstUserData)) {
                        return firstUserData.map((att, idx) => (
                          <th key={idx}>{att.date}</th>
                        ));
                      }
                      return null;
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {selectedUsers.map(userOption => {
                    const userId = userOption.value;
                    const attData = attendanceTable[userId];
                    const userLabel = userOption.label;
                    if (!attData) return null;
                    if (attData.error) {
                      return (
                        <tr key={userId}>
                          <td>{userLabel}</td>
                          <td colSpan={selectedUsers[0] && Array.isArray(attendanceTable[selectedUsers[0].value]) ? attendanceTable[selectedUsers[0].value].length : 1} style={{color: 'red'}}>{attData.error}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={userId}>
                        <td>{userLabel}</td>
                        {attData.map((att, idx) => {
                          let val = "";
                          if (att.isHoliday || att.isSunday) val = "H";
                          else if (att.hasLogin && att.is_logged_out) val = "P";
                          else if (!att.hasLogin && !att.is_logged_out) val = "A";
                          else if (att.hasLogin && !att.is_logged_out) val = "NLO";
                          else val = "-";
                          return <td key={idx}>{val}</td>;
                        })}
                      </tr>
                    );
                  })}
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
