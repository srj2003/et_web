import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './manage_project_expenses.css';
import {
  Search,
  ChevronDown,
  Edit,
  Check,
  Plus,
  AlertCircle,
  X,
  ChevronUp,
  FileText,
  CheckSquare,
  Clock,
  Filter,
  List,
  LayoutGrid,
  MoreVertical,
  CalendarDays,
  Users,
  Briefcase,
  Bell, // For header
  UserCircle, // For header
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'; // Added for charts

// SearchableDropdownModal remains the same as in your original manage_project_expenses.jsx
// For brevity, I'm not repeating it here but assume it's available.
// Make sure it's included in your actual file.
const SearchableDropdownModal = ({
  visible,
  onClose,
  onSelect,
  selected,
  employeeList,
  label,
  onCut
}) => {
  const [search, setSearch] = useState("");

  if (!visible) return null;

  const filtered = employeeList.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay searchable-dropdown-overlay">
      <div className="dropdown-modal searchable-dropdown-modal-content">
        <div className="modal-header">
          <h3>{label}</h3>
          <button className="close-btn icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input modal-search-input"
        />
        <div className="employee-list">
          {filtered.length > 0 ? filtered.map(emp => (
            <button
              key={emp.u_id}
              className={`employee-item ${selected?.u_id === emp.u_id ? 'selected' : ''}`}
              onClick={() => onSelect(emp)}
            >
              <span>{emp.name}</span>
              {selected?.u_id === emp.u_id && <Check size={16} />}
            </button>
          )) : <p className="no-results-text">No employees found.</p>}
        </div>
        <div className="modal-actions">
          {selected && (
            <button className="btn btn-danger btn-sm" onClick={onCut}>
              Remove Selection
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const ProjectManagementDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentViewMode, setCurrentViewMode] = useState('timeline'); // 'timeline', 'grid', 'list'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loggedInUserCreatedBy, setLoggedInUserCreatedBy] = useState('');
  const [userHasEditPermission, setUserHasEditPermission] = useState(false);

  const [employeeList, setEmployeeList] = useState([]);
  const [projectManager, setProjectManager] = useState(null);
  const [teamLead, setTeamLead] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [generalEmployees, setGeneralEmployees] = useState([]);

  const [showPMModal, setShowPMModal] = useState(false);
  const [showTLModal, setShowTLModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [activeFilterStatus, setActiveFilterStatus] = useState('All'); // 'All', 'Active', 'Completed'

  // New states for user projects modal
  const [showUserProjectsModal, setShowUserProjectsModal] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [isLoadingUserProjects, setIsLoadingUserProjects] = useState(false);

  // Add this state at the top with other states
  const [expandedProjects, setExpandedProjects] = useState(false);

  // API Fetching
  const fetchProjectsData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/expense_types.php");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const transformedData = data.map(item => ({
          id: parseInt(item.expense_type_id),
          name: item.expense_type_name || 'Unnamed Project',
          createdAt: item.expense_type_created_at,
          createdBy: item.created_by || 'Unknown',
          isActive: parseInt(item.expense_type_is_active),
          status: parseInt(item.expense_type_is_active) === 1 ? "Active" : "Completed",
          // Mocking some data for timeline/Gantt display
          startDate: item.expense_type_created_at, // Use created_at as start_date
          endDate: new Date(new Date(item.expense_type_created_at).getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mock end date (7-37 days after start)
          progress: Math.floor(Math.random() * 100), // Mock progress
          tasks: [ // Mock tasks
            { id: 1, name: "Initial Planning", status: "Completed" },
            { id: 2, name: "Development", status: "In Progress" },
            { id: 3, name: "Testing", status: "Pending" },
          ]
        }));
        setProjects(transformedData);
      } else {
        setProjects([]);
        console.warn("API response is not an array or is empty:", data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setErrorMessage("Failed to fetch projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUserData = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userid");
      if (!userId) return;
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/dashboard.php", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const fullName = [data.data.u_fname, data.data.u_mname, data.data.u_lname].filter(Boolean).join(" ");
        setLoggedInUserCreatedBy(fullName);
      }
    } catch (error) { console.error("Error fetching user data:", error); }
  }, []);

  const checkUserPermissions = useCallback(async () => {
    const roleId = localStorage.getItem("roleId");
    const allowedRoles = ["1", "2", "3", "4", "8"]; // Example roles
    setUserHasEditPermission(allowedRoles.includes(roleId));
  }, []);

  const fetchEmployeesList = useCallback(async () => {
    try {
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/get_employees.php");
      const data = await response.json();
      if (data && data.status === "success" && Array.isArray(data.employees)) {
        setEmployeeList(data.employees);
      } else { console.error("Invalid employee data format:", data); }
    } catch (error) { console.error("Error fetching employees:", error); }
  }, []);

  // New function to fetch user projects
  const fetchUserProjects = async () => {
    setIsLoadingUserProjects(true);
    try {
      const userId = localStorage.getItem("userid");
      
      const response = await fetch("/api/get_user_projects.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: userId }),
});
      const data = await response.json();
      console.log("User Projects Response:", data);
      if (data.status === "success" && Array.isArray(data.projects)) {
        setUserProjects(data.projects);
      } else {
        setUserProjects([]);
        console.error("Invalid response format:", data);
      }
    } catch (error) {
      console.error("Error fetching user projects:", error);
      setUserProjects([]);
    } finally {
      setIsLoadingUserProjects(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
    fetchCurrentUserData();
    checkUserPermissions();
    fetchEmployeesList();
  }, [fetchProjectsData, fetchCurrentUserData, checkUserPermissions, fetchEmployeesList]);

  // Add to your useEffect to fetch projects when component mounts
  useEffect(() => {
    fetchCurrentUserData();
    fetchUserProjects();
  }, []);

  // Form Handling
  const resetFormFields = () => {
    setCurrentProjectName('');
    setProjectManager(null);
    setTeamLead(null);
    setSupervisor(null);
    setGeneralEmployees([]);
    setEditingProjectId(null);
  };

  const handleOpenAddModal = () => {
    resetFormFields();
    setShowFormModal(true);
  };

  const handleOpenEditModal = (project) => {
    resetFormFields();
    setEditingProjectId(project.id);
    setCurrentProjectName(project.name);
    // TODO: Set PM, TL, Sup, Employees if this data is available on the project object
    // For now, these will be reset and need to be re-selected on edit.
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    if (!currentProjectName.trim()) {
      alert("Please enter project name.");
      return;
    }

    const assignments = [];
    if (projectManager) assignments.push({ u_id: projectManager, role: "Project Manager" });
    if (teamLead) assignments.push({ u_id: teamLead, role: "Team Lead" });
    if (supervisor) assignments.push({ u_id: supervisor, role: "Supervisor" });
    generalEmployees.forEach(u_id => assignments.push({ u_id, role: "Employee" }));

    const payload = {
      project_name: currentProjectName,
      created_by: loggedInUserCreatedBy, // Use fetched logged-in user's name
      created_by_id: localStorage.getItem("userid"),
      assigned_employees: assignments,
      ...(editingProjectId && { expense_type_id: editingProjectId }) // Include ID if editing
    };
    
    // The API endpoint `add_project.php` seems to be for a different data structure
    // than `expense_types.php`. For this demo, we'll simulate by calling the
    // `expense_types.php` for PUT if editing, or POST if adding a new one.
    // This might need adjustment based on actual backend capabilities.
    const isEditing = !!editingProjectId;
    const apiUrl = "https://demo-expense.geomaticxevs.in/ET-api/expense_types.php"; // Assuming this for add/edit too
    
    // Constructing a payload that might work with expense_types.php for add/edit
    // This is an assumption as the original code used add_project.php
    const apiPayload = isEditing ? {
        expense_type_id: editingProjectId,
        expense_type_name: currentProjectName,
        // expense_type_is_active might need to be set or defaulted
    } : {
        expense_type_name: currentProjectName,
        created_by: loggedInUserCreatedBy, // Or a user ID if backend expects that
        expense_type_is_active: 1, // Default to active
    };


    try {
      const response = await fetch(apiUrl, {
        method: isEditing ? "PUT" : "POST", // Adjust method based on actual API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      const result = await response.json();
      if (result.success || response.ok) { // Check response.ok for broader success cases
        alert(`Project ${isEditing ? "updated" : "added"} successfully!`);
        fetchProjectsData();
        setShowFormModal(false);
        resetFormFields();
      } else {
        alert(result.error || "Operation failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while saving the project.");
    }
  };

  const handleMarkProjectAsCompleted = async (projectId) => {
    if (!window.confirm("Are you sure you want to mark this project as completed?")) return;
    try {
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/expense_types.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_type_id: projectId, expense_type_is_active: 0 }),
      });
      const result = await response.json();
      if (result.success) {
        alert("Project marked as completed.");
        fetchProjectsData();
      } else {
        alert(result.error || "Failed to mark project as completed.");
      }
    } catch (error) {
      console.error("Error marking as completed:", error);
      alert("An error occurred.");
    }
  };


  // Filtering and Sorting
  const filteredAndSortedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    let result = [...projects];

    // Filter by status
    if (activeFilterStatus !== 'All') {
      result = result.filter(p => p.status === activeFilterStatus);
    }

    // Filter by global search query (project name)
    if (globalSearchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(globalSearchQuery.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [projects, activeFilterStatus, globalSearchQuery, sortOrder]);

  // Stats for dashboard cards
  const runningProjectsCount = useMemo(() => projects.filter(p => p.isActive === 1).length, [projects]);
  const completedProjectsCount = useMemo(() => projects.filter(p => p.isActive === 0).length, [projects]);
  const dueSoonProjectsCount = useMemo(() => { // Mocking "due soon"
    return projects.filter(p => p.isActive === 1 && new Date(p.endDate) > new Date() && new Date(p.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;
  }, [projects]);

  // Data for Pie Chart
  const pieChartData = [
    { name: 'Completed', value: completedProjectsCount, color: '#22c55e' },
    { name: 'Running', value: runningProjectsCount, color: '#6366f1' },
    { name: 'Due Soon', value: dueSoonProjectsCount, color: '#f59e0b' },
  ];
  
  const getMonthName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
  }

  const getDay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return String(date.getDate()).padStart(2, '0');
  }

  // Mock timeline days for display
  const timelineDays = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 15 + i); // Center around today
      return {
          day: String(date.getDate()).padStart(2, '0'),
          month: date.toLocaleString('default', { month: 'short'}),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          fullDate: date.toISOString().split('T')[0]
      };
  });


  if (isLoading) {
    return (
      <div className="dashboard-loading-state">
        <div className="loader"></div>
        <p>Loading Project Dashboard...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="dashboard-error-state">
        <AlertCircle size={48} />
        <p>{errorMessage}</p>
        <button onClick={fetchProjectsData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="project-dashboard-page">
      {/* Dashboard Header */}
      <header className="dashboard-header-main">
        <div className="dashboard-header-left">
          
          <div className="search-global-container">
            <Search size={20} className="search-icon-global" />
            <input
              type="text"
              placeholder="Search projects..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="search-input-global"
            />
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => {
              setShowUserProjectsModal(true);
              fetchUserProjects();
            }}>
            <UserCircle size={22} />
          </button>
          {userHasEditPermission && (
            <button className="btn btn-primary add-project-header-btn" onClick={handleOpenAddModal}>
              <Plus size={18} /> Add Project
            </button>
          )}
        </div>
      </header>

      <div className="dashboard-content-area">
        <main className="dashboard-main-content">
          {/* Stats Cards */}
          <section className="stats-card-section">
            <div className="stat-card">
              <div className="stat-card-icon-bg" style={{backgroundColor: 'rgba(99, 102, 241, 0.1)'}}><FileText size={24} style={{color: '#6366f1'}}/></div>
              <div className="stat-card-info">
                <span className="stat-value">{runningProjectsCount}</span>
                <span className="stat-label">Running Projects</span>
              </div>
              {/* <span className="stat-trend text-danger">-2 from last month</span> */}
            </div>
            <div className="stat-card">
              <div className="stat-card-icon-bg" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}><CheckSquare size={24} style={{color: '#22c55e'}}/></div>
              <div className="stat-card-info">
                <span className="stat-value">{completedProjectsCount}</span>
                <span className="stat-label">Completed</span>
              </div>
              {/* <span className="stat-trend text-success">+5 from last week</span> */}
            </div>
            <div className="stat-card">
              <div className="stat-card-icon-bg" style={{backgroundColor: 'rgba(245, 158, 11, 0.1)'}}><Clock size={24} style={{color: '#f59e0b'}}/></div>
              <div className="stat-card-info">
                <span className="stat-value">{dueSoonProjectsCount}</span>
                <span className="stat-label">Due Soon</span>
              </div>
              {/* <span className="stat-deadline">Deadline: 03 Mar</span> */}
            </div>
          </section>

          {/* Project Timeline Section */}
          <section className="project-timeline-section">
            <div className="section-header">
              <h2>Project Timeline</h2>
              <div className="timeline-controls">
                {/* <select className="month-selector">
                  <option>May</option> <option>June</option> <option>July</option>
                </select> */}
                 <div className="view-mode-toggle">
                    <button 
                        className={`icon-btn ${currentViewMode === 'timeline' ? 'active' : ''}`} 
                        onClick={() => setCurrentViewMode('timeline')}
                        title="Timeline View"
                    >
                        <CalendarDays size={18} />
                    </button>
                    <button 
                        className={`icon-btn ${currentViewMode === 'grid' ? 'active' : ''}`} 
                        onClick={() => setCurrentViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        className={`icon-btn ${currentViewMode === 'list' ? 'active' : ''}`} 
                        onClick={() => setCurrentViewMode('list')}
                        title="List View"
                    >
                        <List size={18} />
                    </button>
                 </div>
              </div>
            </div>

            {currentViewMode === 'timeline' && (
                <div className="timeline-view-container">
                    <div className="timeline-header-row">
                        <div className="timeline-project-name-header">All Projects</div>
                        <div className="timeline-days-header">
                            {timelineDays.map(d => (
                                <div key={d.fullDate} className={`timeline-day-label ${d.isWeekend ? 'weekend-day' : ''}`}>
                                    <span>{d.day}</span>
                                    <span className="timeline-day-month">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {filteredAndSortedProjects.length > 0 ? filteredAndSortedProjects.map(project => (
                        <div key={project.id} className="timeline-project-row">
                            <div className="timeline-project-name">{project.name}</div>
                            <div className="timeline-project-bar-container">
                                {/* This is a simplified bar. A real Gantt would calculate position and width based on dates. */}
                                <div 
                                    className={`timeline-project-bar status-${project.status.toLowerCase()}`}
                                    style={{ 
                                        width: `${project.progress || 50}%`, // Use mock progress
                                        // In a real Gantt, marginLeft and width would be calculated based on project.startDate, project.endDate relative to timelineDays
                                        // marginLeft: `calc(${timelineDays.findIndex(d => d.fullDate === project.startDate) / timelineDays.length * 100}%)`,
                                        // width: `calc(${(new Date(project.endDate) - new Date(project.startDate)) / (24*60*60*1000) / timelineDays.length * 100}%)`
                                    }}
                                    title={`${project.name} - ${project.progress}%`}
                                >
                                    {/* You could display task names here if available and space permits */}
                                </div>
                            </div>
                        </div>
                    )) : <p className="no-projects-message">No projects match your current filters.</p>}
                </div>
            )}

            {currentViewMode === 'grid' && (
                 <div className="projects-grid-view">
                    {filteredAndSortedProjects.length > 0 ? filteredAndSortedProjects.map(project => (
                        <div key={project.id} className={`project-card-item status-border-${project.status.toLowerCase()}`}>
                            <div className="project-card-header">
                                <h3>{project.name}</h3>
                                {/* <button className="icon-btn project-card-actions-btn"><MoreVertical size={18}/></button> */}
                            </div>
                            <p className="project-card-detail"><Users size={14}/> Team: Placeholder</p>
                            <p className="project-card-detail"><Briefcase size={14}/> Created by: {project.createdBy}</p>
                            <div className="project-card-progress">
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{width: `${project.progress}%`, backgroundColor: project.status === 'Active' ? '#6366f1' : '#22c55e'}}></div>
                                </div>
                                <span className="progress-text">{project.progress}%</span>
                            </div>
                            <div className="project-card-footer">
                                <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
                                {userHasEditPermission && project.isActive === 1 && (
                                    <div className="card-actions">
                                        <button className="icon-btn" onClick={() => handleOpenEditModal(project)} title="Edit"><Edit size={16}/></button>
                                        <button className="icon-btn" onClick={() => handleMarkProjectAsCompleted(project.id)} title="Mark Complete"><CheckSquare size={16}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : <p className="no-projects-message">No projects match your current filters.</p>}
                </div>
            )}
            {/* TODO: Implement List View if needed */}
            {currentViewMode === 'list' && (
                <div className="projects-list-view">
                    <div className="list-header-row">
                        <div className="list-col list-col-name">Project Name</div>
                        <div className="list-col list-col-status">Status</div>
                        <div className="list-col list-col-progress">Progress</div>
                        <div className="list-col list-col-created">Created At</div>
                        <div className="list-col list-col-actions">Actions</div>
                    </div>
                    {filteredAndSortedProjects.length > 0 ? filteredAndSortedProjects.map(project => (
                        <div key={project.id} className="list-project-row">
                            <div className="list-col list-col-name">{project.name}</div>
                            <div className="list-col list-col-status">
                                <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
                            </div>
                            <div className="list-col list-col-progress">
                                <div className="progress-bar-container small">
                                    <div className="progress-bar-fill" style={{width: `${project.progress}%`, backgroundColor: project.status === 'Active' ? '#6366f1' : '#22c55e'}}></div>
                                </div>
                            </div>
                            <div className="list-col list-col-created">{new Date(project.createdAt).toLocaleDateString()}</div>
                            <div className="list-col list-col-actions">
                                {userHasEditPermission && project.isActive === 1 && (
                                    <>
                                    <button className="icon-btn" onClick={() => handleOpenEditModal(project)} title="Edit"><Edit size={16}/></button>
                                    <button className="icon-btn" onClick={() => handleMarkProjectAsCompleted(project.id)} title="Mark Complete"><CheckSquare size={16}/></button>
                                    </>
                                )}
                                 {/* <button className="icon-btn"><MoreVertical size={16}/></button> */}
                            </div>
                        </div>
                    )) : <p className="no-projects-message">No projects match your current filters.</p>}
                </div>
            )}

          </section>
        </main>

        {/* Right Sidebar for Stats/Deadlines */}
        <aside className="dashboard-right-sidebar">
          <div className="sidebar-section">
            <h4>Project Deadlines</h4>
            <div className="circular-progress-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                   {/* Custom label in the center */}
                   <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="pie-center-text">
                    {projects.length} Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="deadline-stats">
              <div className="deadline-stat-item">
                <span className="stat-dot" style={{backgroundColor: '#22c55e'}}></span>
                Completed on deadline: <span className="stat-value">{completedProjectsCount}</span>
                {/* <span className="stat-trend-small text-danger">-18% than previous</span> */}
              </div>
              <div className="deadline-stat-item">
                <span className="stat-dot" style={{backgroundColor: '#f59e0b'}}></span>
                Complete after deadline: <span className="stat-value">{/* Mock data */} {Math.floor(completedProjectsCount * 0.2)}</span>
                 {/* <span className="stat-trend-small text-success">+20% than previous</span> */}
              </div>
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="sidebar-section">
            <h4>Filters</h4>
            <div className="filter-group">
                <label htmlFor="statusFilter">Status</label>
                <select 
                    id="statusFilter" 
                    className="form-select"
                    value={activeFilterStatus}
                    onChange={(e) => setActiveFilterStatus(e.target.value)}
                >
                    <option value="All">All Projects</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
             <div className="filter-group">
                <label htmlFor="sortOrder">Sort by Date</label>
                <select 
                    id="sortOrder" 
                    className="form-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h4>My Projects</h4>
              {userProjects.length > 0 && (
                <span className="project-count">{userProjects.length} projects</span>
              )}
            </div>
            <div className="sidebar-projects-container">
              {isLoadingUserProjects ? (
                <div className="sidebar-loading">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading projects...</span>
                </div>
              ) : userProjects.length > 0 ? (
                <div className="sidebar-projects-list">
                  {userProjects
                    .slice(0, expandedProjects ? 13 : 3)
                    .map((project) => (
                      <div 
                        key={project.project_id} 
                        className="sidebar-project-card"
                      >
                        <div className="project-card-content">
                          <h5>{project.project_name}</h5>
                          <span className={`status-badge status-${project.status?.toLowerCase()}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="project-meta">
                          <span className="project-id">#{project.project_id}</span>
                        </div>
                      </div>
                  ))}
                  {userProjects.length > 3 && (
                    <button 
                      className="view-all-projects-btn"
                      onClick={() => setExpandedProjects(!expandedProjects)}
                    >
                      {expandedProjects ? (
                        <>
                          Show less
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          View {userProjects.length - 3} more
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="no-projects-message">
                  <p>No projects assigned</p>
                </div>
              )}
            </div>
          </div>
          

        </aside>
      </div>

      {/* Add/Edit Project Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal project-form-modal">
            <div className="modal-header">
              <h2>{editingProjectId ? 'Edit Project' : 'Add New Project'}</h2>
              <button className="close-btn icon-btn" onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  className="form-input"
                  placeholder="Enter project name"
                  value={currentProjectName}
                  onChange={(e) => setCurrentProjectName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Project Manager</label>
                <button className="employee-select-btn-modal" onClick={() => setShowPMModal(true)}>
                  {employeeList.find(e => e.u_id === projectManager)?.name || "Select Project Manager"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Team Lead</label>
                <button className="employee-select-btn-modal" onClick={() => setShowTLModal(true)}>
                  {employeeList.find(e => e.u_id === teamLead)?.name || "Select Team Lead"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Supervisor</label>
                <button className="employee-select-btn-modal" onClick={() => setShowSupModal(true)}>
                  {employeeList.find(e => e.u_id === supervisor)?.name || "Select Supervisor"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Team Members</label>
                <button className="employee-select-btn-modal add-members-btn" onClick={() => setShowEmployeeModal(true)}>
                  Add Team Members <Plus size={16}/>
                </button>
                <div className="selected-employees-tags">
                  {generalEmployees.map(u_id => {
                    const emp = employeeList.find(e => e.u_id === u_id);
                    return emp ? (
                      <div key={u_id} className="employee-tag-item">
                        <span>{emp.name}</span>
                        <button className="icon-btn" onClick={() => setGeneralEmployees(generalEmployees.filter(id => id !== u_id))}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowFormModal(false); resetFormFields(); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingProjectId ? 'Update Project' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection Modals */}
      <SearchableDropdownModal
        visible={showPMModal}
        onClose={() => setShowPMModal(false)}
        onSelect={(emp) => { setProjectManager(emp.u_id); setShowPMModal(false); }}
        selected={employeeList.find(e => e.u_id === projectManager)}
        employeeList={employeeList}
        label="Select Project Manager"
        onCut={() => { setProjectManager(null); setShowPMModal(false); }}
      />
       <SearchableDropdownModal
        visible={showTLModal}
        onClose={() => setShowTLModal(false)}
        onSelect={(emp) => { setTeamLead(emp.u_id); setShowTLModal(false); }}
        selected={employeeList.find(e => e.u_id === teamLead)}
        employeeList={employeeList}
        label="Select Team Lead"
        onCut={() => { setTeamLead(null); setShowTLModal(false); }}
      />
       <SearchableDropdownModal
        visible={showSupModal}
        onClose={() => setShowSupModal(false)}
        onSelect={(emp) => { setSupervisor(emp.u_id); setShowSupModal(false); }}
        selected={employeeList.find(e => e.u_id === supervisor)}
        employeeList={employeeList}
        label="Select Supervisor"
        onCut={() => { setSupervisor(null); setShowSupModal(false); }}
      />
      <SearchableDropdownModal
        visible={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSelect={(emp) => {
          if (!generalEmployees.includes(emp.u_id)) {
            setGeneralEmployees([...generalEmployees, emp.u_id]);
          }
          // Keep modal open to select more, or close:
          // setShowEmployeeModal(false); 
        }}
        selected={null} // No single 'selected' for multi-select, but could highlight already chosen
        employeeList={employeeList.filter(emp => !generalEmployees.includes(emp.u_id))} // Show only unselected
        label="Add Team Members"
        onCut={() => {}} // Not applicable for multi-add in this way
      />

      {/* User Projects Modal */}
      {showUserProjectsModal && (
        <div className="modal-overlay">
          <div className="modal user-projects-modal">
            <div className="modal-header">
              <h2>My Projects</h2>
              <button className="close-btn icon-btn" onClick={() => setShowUserProjectsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              {isLoadingUserProjects ? (
                <div className="loading-container">
                  <Loader2 size={30} className="animate-spin" />
                  <p>Loading your projects...</p>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="no-projects-message">
                  <p>No projects found</p>
                </div>
              ) : (
                <div className="user-projects-list">
                  {userProjects.map((project) => (
                    <div 
                      key={project.project_id || project.project_name} 
                      className="user-project-card"
                    >
                      <div className="project-card-content">
                        <h3>{project.project_name}</h3>
                        <span className={`project-status status-${project.status?.toLowerCase()}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.created_at && (
                        <div className="project-card-footer">
                          <span className="project-date">
                            Created: {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectManagementDashboard;

