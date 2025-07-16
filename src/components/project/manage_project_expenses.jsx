import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./manage_project_expenses.css";
import {
  Shield,
  CalendarPlus,
  CalendarCheck,
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
  Users,
  UserCircle, // For header
  Loader2,
  CreditCard,
  Eye,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"; // Added for charts
// Utility function to format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString();
}

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
  onCut,
}) => {
  const [search, setSearch] = useState("");

  if (!visible) return null;

  const filtered = employeeList.filter((e) =>
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
          {filtered.length > 0 ? (
            filtered.map((emp) => (
              <button
                key={emp.u_id}
                className={`employee-item ${
                  selected?.u_id === emp.u_id ? "selected" : ""
                }`}
                onClick={() => onSelect(emp)}
              >
                <span>{emp.name}</span>
                {selected?.u_id === emp.u_id && <Check size={16} />}
              </button>
            ))
          ) : (
            <p className="no-results-text">No employees found.</p>
          )}
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
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [currentViewMode, setCurrentViewMode] = useState("grid"); // 'timeline', 'grid', 'list'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loggedInUserCreatedBy, setLoggedInUserCreatedBy] = useState("");
  const [userHasEditPermission, setUserHasEditPermission] = useState(false);
  const [myvar, setMyVar] = useState(0); // Example variable to reset
  const [employeeList, setEmployeeList] = useState([]);
  const [projectManager, setProjectManager] = useState(null);
  const [teamLead, setTeamLead] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [generalEmployees, setGeneralEmployees] = useState([]);

  const [showPMModal, setShowPMModal] = useState(false);
  const [showTLModal, setShowTLModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [activeFilterStatus, setActiveFilterStatus] = useState("All"); // 'All', 'Active', 'Completed'
  const [userFilter, setUserFilter] = useState("");

  // New states for user projects modal
  const [showUserProjectsModal, setShowUserProjectsModal] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [isLoadingUserProjects, setIsLoadingUserProjects] = useState(false);

  // Add this state at the top with other states
  const [expandedProjects, setExpandedProjects] = useState(false);

  // Modal state for project details
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [showTeamMembers, setShowTeamMembers] = useState(false);

  // New state for team members modal
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);

  // API Fetching
  const fetchProjectsData = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Change to GET method for fetching projects list
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/expense_types.php?action=get_all",
        {
          method: "GET", // Changed from POST to GET
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const data = await response.json();
      console.log(data);
      // Check for error response
      if (data.status === "error") {
        console.error("API Error:", data.message);
        setErrorMessage(data.message);
        setProjects([]);
        return;
      }

      // Check if data.data exists and is an array
      const projectsData = data.data || [];
      if (Array.isArray(projectsData)) {
        // Map backend response to frontend state
        const mappedProjects = projectsData.map((proj) => {
          // Extract roles from team_members (preferred) or assigned_users (fallback)
          let projectLead = "";
          let teamLead = "";
          let supervisor = "";
          let teamMembers = [];
          // Prefer team_members array for roles
          if (
            Array.isArray(proj.team_members) &&
            proj.team_members.length > 0
          ) {
            for (const member of proj.team_members) {
              if (
                member.role === "Project Manager" ||
                member.role === "Project Manager"
              ) {
                projectLead = member.full_name;
              } else if (member.role === "Team Lead") {
                teamLead = member.full_name;
              } else if (member.role === "Supervisor") {
                supervisor = member.full_name;
              } else if (member.role === "Team Member") {
                teamMembers.push(member.full_name);
              }
            }
          }
          // Fallback to assigned_users if team_members missing
          if (
            (!projectLead || !teamLead || !supervisor) &&
            Array.isArray(proj.assigned_users)
          ) {
            for (const member of proj.assigned_users) {
              if (
                !projectLead &&
                (member.role === "Project Manager" ||
                  member.role === "Project Manager")
              ) {
                projectLead = member.full_Name;
              } else if (!teamLead && member.role === "Team Lead") {
                teamLead = member.full_Name;
              } else if (!supervisor && member.role === "Supervisor") {
                supervisor = member.full_Name;
              } else if (member.role === "Team Member") {
                if (!teamMembers.includes(member.full_Name))
                  teamMembers.push(member.full_Name);
              }
            }
          }
          // Map status and other fields
          let status =
            proj.expense_type_is_active === 1 ? "Active" : "Completed";
          let isActive = proj.expense_type_is_active;
          // Progress is not in API, so mock as 0 or 100
          let progress = status === "Active" ? 0 : 100;
          // Budget fields not in API, so set as empty
          return {
            id: proj.expense_type_id,
            name: proj.expense_type_name,
            createdAt: proj.expense_type_created_at,
            updatedAt: proj.expense_type_updated_at,
            isActive,
            status,
            createdBy: proj.created_by,
            projectLead,
            teamLead,
            supervisor,
            teamMembers,
            budgetAllotted: "",
            budgetExpended: "",
            progress,
          };
        });
        setProjects(mappedProjects);
        mappedProjects.map((proj) => {
          console.log(proj.name, proj.projectLead);
        });
      } else {
        setProjects([]);
        console.warn("API response data is not an array:", data);
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
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const fullName = [
          data.data.u_fname,
          data.data.u_mname,
          data.data.u_lname,
        ]
          .filter(Boolean)
          .join(" ");
        setLoggedInUserCreatedBy(fullName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  const checkUserPermissions = useCallback(async () => {
    const roleId = localStorage.getItem("roleId");
    const allowedRoles = ["1", "2", "3", "4", "8"]; // Example roles
    setUserHasEditPermission(allowedRoles.includes(roleId));
  }, []);

  const fetchEmployeesList = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/get_employees.php",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const data = await response.json();
      if (data && data.status === "success" && Array.isArray(data.employees)) {
        setEmployeeList(data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, []);

  // New function to fetch user projects
  const fetchUserProjects = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setIsLoadingUserProjects(true);
    try {
      const userId = localStorage.getItem("userid");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.projects)) {
        setUserProjects(data.projects);
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
  }, [
    fetchProjectsData,
    fetchCurrentUserData,
    checkUserPermissions,
    fetchEmployeesList,
  ]);

  // Add to your useEffect to fetch projects when component mounts
  useEffect(() => {
    fetchCurrentUserData();
    fetchUserProjects();
  }, []);

  // Form Handling
  const resetFormFields = () => {
    setCurrentProjectName("");
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
    console.log("Editing project:", project);
    setMyVar(0);
    setEditingProjectId(project.id);
    setCurrentProjectName(project.name);
    setProjectManager(project.projectLead || null);
    setTeamLead(project.teamLead || null);
    setSupervisor(project.supervisor || null);
    setGeneralEmployees(
      Array.isArray(project.teamMembers) ? project.teamMembers : []
    );
    // Print all employee names for debugging
    console.log(
      "All employee names:",
      employeeList.map((e) => e.name)
    );
    // Compare names ignoring spaces
    console.log(
      employeeList.find(
        (e) =>
          e.name.replace(/\s+/g, "").toLowerCase() ===
          String(project.projectLead).replace(/\s+/g, "").toLowerCase()
      )
    );
    console.log(project.projectLead);
    console.log("General Employees:", generalEmployees);
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!currentProjectName.trim()) {
      alert("Please enter project name.");
      return;
    }

    const apiUrl =
      "https://demo-expense.geomaticxevs.in/ET-api/add_project.php";
    const isEditing = !!editingProjectId;
    console.log("Editing:", isEditing);

    // Build assigned_employees array
    const assigned_employees = [];
    if (projectManager) {
      assigned_employees.push({
        u_id: projectManager,
        role: "Project Manager",
      });
    }
    if (teamLead) {
      assigned_employees.push({ u_id: teamLead, role: "Team Lead" });
    }
    if (supervisor) {
      assigned_employees.push({ u_id: supervisor, role: "Supervisor" });
    }
    generalEmployees.forEach((u_id) => {
      assigned_employees.push({ u_id, role: "Team Member" });
    });

    // Get created_by_id from localStorage (assuming userId is stored)
    const created_by_id = localStorage.getItem("userid");

    // New payload for backend
    const apiPayload = {
      project_name: currentProjectName,
      created_by: loggedInUserCreatedBy,
      assigned_employees,
      ...(isEditing && { expense_type_id: editingProjectId }),
    };
    console.log(apiPayload);
    try {
      const response = await fetch(apiUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const result = await response.json();
      if (result.success || response.ok) {
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
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to mark this project as completed?"
      )
    )
      return;

    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/expense_types.php",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            expense_type_id: projectId,
            expense_type_is_active: 0,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const result = await response.json();
      if (result.success) {
        alert("Project marked as completed.");
        fetchProjectsData();
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
    if (activeFilterStatus !== "All") {
      result = result.filter((p) => p.status === activeFilterStatus);
    }

    // Filter by user
    if (userFilter) {
      result = result.filter((p) => String(p.createdBy) === String(userFilter));
    }

    // Filter by global search query (project name)
    if (globalSearchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(globalSearchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [projects, activeFilterStatus, globalSearchQuery, sortOrder, userFilter]);

  // Stats for dashboard cards
  const runningProjectsCount = useMemo(
    () => projects.filter((p) => p.isActive === 1).length,
    [projects]
  );
  const completedProjectsCount = useMemo(
    () => projects.filter((p) => p.isActive === 0).length,
    [projects]
  );
  const dueSoonProjectsCount = useMemo(() => {
    // Mocking "due soon"
    return projects.filter(
      (p) =>
        p.isActive === 1 &&
        new Date(p.endDate) > new Date() &&
        new Date(p.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;
  }, [projects]);

  // Data for Pie Chart
  const pieChartData = [
    { name: "Completed", value: completedProjectsCount, color: "#22c55e" },
    { name: "Running", value: runningProjectsCount, color: "#6366f1" },
    { name: "Due Soon", value: dueSoonProjectsCount, color: "#f59e0b" },
  ];

  const getMonthName = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "short" });
  };

  const getDay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return String(date.getDate()).padStart(2, "0");
  };

  // Helper to open modal with project
  const handleOpenProjectDetailModal = (project) => {
    setSelectedProject(project);
    setEditFields({
      projectLead: project.projectLead || "",
      teamLead: project.teamLead || "",
      teamMembers: project.teamMembers || [],
      createdAt: project.createdAt,
      endDate: project.endDate,
      budgetAllotted: project.budgetAllotted || "",
      budgetExpended: project.budgetExpended || "",
    });
    setEditMode(false);
    setShowProjectDetailModal(true);
    setShowTeamMembers(false);
  };

  // Handler for editing fields
  const handleEditFieldChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  // Handler for saving edits (mock, you can connect to API)
  const handleSaveProjectEdits = () => {
    // Here you would call your API to update the project
    // For now, just update local state for demo
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id ? { ...p, ...editFields } : p
      )
    );
    setSelectedProject((prev) => ({ ...prev, ...editFields }));
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="project-loading-container">
        <div className="project-animate-spin"></div>
        <pre className="loading-text"> Loading Project Dashboard...</pre>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="dashboard-error-state">
        <AlertCircle size={48} />
        <p>{errorMessage}</p>
        <button onClick={fetchProjectsData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="project-dashboard-page">
      {/* Dashboard Header */}
      <header className="dashboard-header-main">
        <div className="dashboard-header-left">
          <div className="search-global-container">
            <Search size={25} className="search-icon-global" />
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
          <button
            className="icon-btn"
            onClick={() => {
              setShowUserProjectsModal(true);
              fetchUserProjects();
            }}
          >
            <UserCircle size={22} />
          </button>
          {userHasEditPermission && (
            <button
              className="btn btn-primary add-project-header-btn"
              onClick={handleOpenAddModal}
            >
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
              <div
                className="stat-card-icon-bg"
                style={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
              >
                <FileText size={24} style={{ color: "#6366f1" }} />
              </div>
              <div className="stat-card-info">
                <span className="stat-value">{runningProjectsCount}</span>
                <span className="stat-label">Running Projects</span>
              </div>
              {/* <span className="stat-trend text-danger">-2 from last month</span> */}
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon-bg"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
              >
                <CheckSquare size={24} style={{ color: "#22c55e" }} />
              </div>
              <div className="stat-card-info">
                <span className="stat-value">{completedProjectsCount}</span>
                <span className="stat-label">Completed</span>
              </div>
              {/* <span className="stat-trend text-success">+5 from last week</span> */}
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon-bg"
                style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
              >
                <Clock size={24} style={{ color: "#f59e0b" }} />
              </div>
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
              <h2>Projects</h2>
            </div>
            <div className="projects-grid-view">
              {filteredAndSortedProjects.length > 0 ? (
                filteredAndSortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-card-item status-border-${project.status.toLowerCase()} clickable-project-card`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenProjectDetailModal(project)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleOpenProjectDetailModal(project);
                    }}
                  >
                    <div className="project-card-header">
                      <h3>{project.name}</h3>
                    </div>
                    <p className="project-card-detail">
                      <Shield size={14} className="mr-1" /> created by:{" "}
                      {project.createdBy}
                    </p>
                    <p className="project-card-detail">
                      <Users size={14} className="mr-1" /> Total Members:{" "}
                      {project.teamMembers.length}
                    </p>
                    <p className="project-card-detail">
                      <CalendarPlus size={14} className="mr-1" /> created At:{" "}
                      {formatDate(project.createdAt)}
                    </p>
                    <p className="project-card-detail">
                      <CalendarCheck size={14} className="mr-1" /> updated At:{" "}
                      {formatDate(project.updatedAt)}
                    </p>
                    {/* Expense Progress Tracker - Consistent UI */}
                    <p className="project-card-detail">
                      <CreditCard
                        size={14}
                        style={{
                          marginRight: "0.3rem",
                          color: "#6366f1",
                          verticalAlign: "middle",
                        }}
                      />
                      Total Expense:{" "}
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#6366f1",
                          marginLeft: "0.3rem",
                        }}
                      >
                        ₹0.0
                      </span>
                      <span style={{ color: "#a5b4fc", margin: "0 0.2rem" }} />
                    </p>
                    <div className="project-card-progress">
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor:
                              project.status === "Active"
                                ? "#6366f1"
                                : "#22c55e",
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{project.progress}%</span>
                    </div>
                    <div className="project-card-footer">
                      {userHasEditPermission && project.isActive === 1 && (
                        <div className="card-actions">
                          <button
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(project);
                            }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkProjectAsCompleted(project.id);
                            }}
                            title="Mark Complete"
                          >
                            <CheckSquare size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-projects-message">
                  No projects match your current filters.
                </p>
              )}
            </div>
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
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pie-center-text"
                  >
                    {projects.length} Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="deadline-stats">
              <div className="deadline-stat-item">
                <span
                  className="stat-dot"
                  style={{ backgroundColor: "#22c55e" }}
                ></span>
                Completed on deadline:{" "}
                <span className="stat-value">{completedProjectsCount}</span>
                {/* <span className="stat-trend-small text-danger">-18% than previous</span> */}
              </div>
              <div className="deadline-stat-item">
                <span
                  className="stat-dot"
                  style={{ backgroundColor: "#f59e0b" }}
                ></span>
                Complete after deadline:{" "}
                <span className="stat-value">
                  {/* Mock data */} {Math.floor(completedProjectsCount * 0.2)}
                </span>
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
              <label htmlFor="userFilter">Sort by User</label>
              <select
                id="userFilter"
                className="form-select"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="">All Users</option>
                {(() => {
                  const myRoleId = parseInt(localStorage.getItem("roleId"));
                  return employeeList
                    .filter((emp) => parseInt(emp.roleId) < myRoleId)
                    .map((emp) => (
                      <option key={emp.u_id} value={emp.u_id}>
                        {emp.name}
                      </option>
                    ));
                })()}
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
                <span className="project-count">
                  {userProjects.length} projects
                </span>
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
                        <div className="project-card-content"></div>
                        <div className="project-meta">
                          <span className="project-id">
                            #{project.project_id}
                          </span>
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
              <h2>{editingProjectId ? "Edit Project" : "Add New Project"}</h2>
              <button
                className="close-btn icon-btn"
                onClick={() => setShowFormModal(false)}
              >
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
                <button
                  className="employee-select-btn-modal"
                  onClick={() => setShowPMModal(true)}
                >
                  {projectManager || "Select Project Manager"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Team Lead</label>
                <button
                  className="employee-select-btn-modal"
                  onClick={() => setShowTLModal(true)}
                >
                  {employeeList.find((e) => e.u_id === teamLead)?.name ||
                    "Select Team Lead"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Supervisor</label>
                <button
                  className="employee-select-btn-modal"
                  onClick={() => setShowSupModal(true)}
                >
                  {supervisor || "Select Supervisor"}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="form-group">
                <label>Team Members</label>
                <button
                  className="employee-select-btn-modal add-members-btn"
                  onClick={() => setShowEmployeeModal(true)}
                >
                  Add Team Members <Plus size={16} />
                </button>
                <div className="selected-employees-tags">
                  {generalEmployees.map((u_id, idx) => {
                    const emp = generalEmployees[idx];
                    return emp ? (
                      <div key={u_id} className="employee-tag-item">
                        <span>{emp}</span>
                        <button
                          className="icon-btn"
                          onClick={() =>
                            setGeneralEmployees(
                              generalEmployees.filter((id) => id !== u_id)
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      generalEmployees[0]
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowFormModal(false);
                  resetFormFields();
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingProjectId ? "Update Project" : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection Modals */}
      <SearchableDropdownModal
        visible={showPMModal}
        onClose={() => setShowPMModal(false)}
        onSelect={(emp) => {
          setProjectManager(emp.u_id);
          setShowPMModal(false);
        }}
        selected={employeeList.find((e) => e.u_id === projectManager)}
        employeeList={employeeList}
        label="Select Project Manager"
        onCut={() => {
          setProjectManager(null);
          setShowPMModal(false);
        }}
      />
      <SearchableDropdownModal
        visible={showTLModal}
        onClose={() => setShowTLModal(false)}
        onSelect={(emp) => {
          setTeamLead(emp.u_id);
          setShowTLModal(false);
        }}
        selected={employeeList.find((e) => e.u_id === teamLead)}
        employeeList={employeeList}
        label="Select Team Lead"
        onCut={() => {
          setTeamLead(null);
          setShowTLModal(false);
        }}
      />
      <SearchableDropdownModal
        visible={showSupModal}
        onClose={() => setShowSupModal(false)}
        onSelect={(emp) => {
          setSupervisor(emp.u_id);
          setShowSupModal(false);
        }}
        selected={employeeList.find((e) => e.u_id === supervisor)}
        employeeList={employeeList}
        label="Select Supervisor"
        onCut={() => {
          setSupervisor(null);
          setShowSupModal(false);
        }}
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
        employeeList={employeeList.filter(
          (emp) => !generalEmployees.includes(emp.u_id)
        )} // Show only unselected
        label="Add Team Members"
        onCut={() => {}} // Not applicable for multi-add in this way
      />

      {/* User Projects Modal */}
      {showUserProjectsModal && (
        <div className="modal-overlay">
          <div className="modal user-projects-modal">
            <div className="modal-header">
              <h2>My Projects</h2>
              <button
                className="close-btn icon-btn"
                onClick={() => setShowUserProjectsModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              {isLoadingUserProjects ? (
                <div className="project-loading-container">
                  <Loader2 size={30} className="project-animate-spin" />
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
                        {/* <span className={`project-status status-${project.status?.toLowerCase()}`}>
                          {project.status}
                        </span> */}
                      </div>
                      {project.created_at && (
                        <div className="project-card-footer">
                          <span className="project-date">
                            Created:{" "}
                            {new Date(project.created_at).toLocaleDateString()}
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

      {/* Project Detail Modal */}
      {showProjectDetailModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal project-detail-modal scrollable-modal">
            <div className="modal-header project-detail-modal-header">
              <div className="modal-title-with-icon">
                <span className="modal-title-icon">
                  <FileText size={22} />
                </span>
                <h2>Project Details</h2>
              </div>
              <button
                className="close-btn icon-btn"
                onClick={() => {
                  setShowProjectDetailModal(false);
                  setEditMode(false);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content project-detail-modal-content">
              {/* TEAM INFORMATION */}
              <div className="modal-section-title">TEAM INFORMATION</div>
              <div className="project-detail-row">
                <span className="row-icon">
                  <UserCircle size={18} />
                </span>
                <span className="row-label">Project Manager</span>
                {editMode ? (
                  <select
                    className="form-input team-members-dropdown"
                    value={editFields.projectLead || ""}
                    onChange={(e) =>
                      handleEditFieldChange("projectLead", e.target.value)
                    }
                  >
                    <option value="">Select Project Manager...</option>
                    {employeeList
                      // Filter by designation if available, fallback to all
                      .filter(
                        (emp) =>
                          emp.designation === "Project Manager" ||
                          !employeeList.some(
                            (e) => e.designation === "Project Manager"
                          )
                      )
                      .map((emp) => (
                        <option key={emp.u_id} value={emp.u_id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <span className="row-value row-value-pill">
                    {selectedProject.projectLead ? (
                      selectedProject.projectLead
                    ) : (
                      <span className="row-value-unassigned">Not Assigned</span>
                    )}
                  </span>
                )}
              </div>
              <div className="project-detail-row">
                <span className="row-icon">
                  <Shield size={18} />
                </span>
                <span className="row-label">Team Lead</span>
                {editMode ? (
                  <select
                    className="form-input team-members-dropdown"
                    value={editFields.teamLead || ""}
                    onChange={(e) =>
                      handleEditFieldChange("teamLead", e.target.value)
                    }
                  >
                    <option value="">Select Team Lead...</option>
                    {employeeList
                      .filter(
                        (emp) =>
                          emp.designation === "Team Lead" ||
                          !employeeList.some(
                            (e) => e.designation === "Team Lead"
                          )
                      )
                      .map((emp) => (
                        <option key={emp.u_id} value={emp.u_id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <span className="row-value row-value-pill">
                    {selectedProject.teamLead ? (
                      selectedProject.teamLead
                    ) : (
                      <span className="row-value-unassigned">Not Assigned</span>
                    )}
                  </span>
                )}
              </div>
              <div className="project-detail-row">
                <span className="row-icon">
                  <Users size={18} />
                </span>
                <span className="row-label">Supervisor</span>
                {editMode ? (
                  <select
                    className="form-input team-members-dropdown"
                    value={editFields.supervisor || ""}
                    onChange={(e) =>
                      handleEditFieldChange("supervisor", e.target.value)
                    }
                  >
                    <option value="">Select Supervisor...</option>
                    {employeeList
                      .filter(
                        (emp) =>
                          emp.designation === "Supervisor" ||
                          !employeeList.some(
                            (e) => e.designation === "Supervisor"
                          )
                      )
                      .map((emp) => (
                        <option key={emp.u_id} value={emp.u_id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <span className="row-value row-value-pill">
                    {selectedProject.supervisor ? (
                      selectedProject.supervisor
                    ) : (
                      <span className="row-value-unassigned">Not Assigned</span>
                    )}
                  </span>
                )}
              </div>
              <div className="project-detail-row team-members-row">
                <span className="row-icon">
                  <Users size={18} />
                </span>
                <span className="row-label">Total Team Members</span>
                <span className="row-value team-members-count">
                  {editMode
                    ? editFields.teamMembers
                      ? editFields.teamMembers.length
                      : 0
                    : selectedProject.teamMembers
                    ? selectedProject.teamMembers.length
                    : 0}
                </span>
                {editMode ? (
                  <div className="team-members-multiselect">
                    {employeeList
                      .filter((emp) =>
                        (editFields.teamMembers || []).includes(emp.u_id)
                      )
                      .map((emp) => (
                        <span key={emp.u_id} className="team-member-tag">
                          {emp.name}
                          <button
                            className="remove-tag-btn"
                            onClick={() =>
                              handleEditFieldChange(
                                "teamMembers",
                                editFields.teamMembers.filter(
                                  (id) => id !== emp.u_id
                                )
                              )
                            }
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    <select
                      className="form-input team-members-dropdown"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !editFields.teamMembers.includes(val)) {
                          handleEditFieldChange("teamMembers", [
                            ...editFields.teamMembers,
                            val,
                          ]);
                        }
                      }}
                    >
                      <option value="" disabled>
                        Add team member...
                      </option>
                      {employeeList
                        .filter(
                          (emp) =>
                            !(editFields.teamMembers || []).includes(emp.u_id)
                        )
                        .map((emp) => (
                          <option key={emp.u_id} value={emp.u_id}>
                            {emp.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <button
                    className="view-members-btn"
                    onClick={() => setShowTeamMembersModal(true)}
                  >
                    <Eye size={16} style={{ marginRight: 4 }} />
                    View Members
                  </button>
                )}
              </div>

              <div className="modal-section-divider" />
              {/* TIMELINE */}
              <div className="modal-section-title">TIMELINE</div>
              <div className="project-detail-row timeline-row timeline-row-green align-timeline-row">
                <span className="row-icon">
                  <CalendarPlus size={18} />
                </span>
                <span className="row-label">Created On</span>
                {editMode ? (
                  <input
                    className="form-input"
                    type="date"
                    value={
                      editFields.createdAt
                        ? editFields.createdAt.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleEditFieldChange("createdAt", e.target.value)
                    }
                  />
                ) : (
                  <span className="row-value timeline-value-green">
                    {selectedProject.createdAt ? (
                      new Date(selectedProject.createdAt).toLocaleDateString()
                    ) : (
                      <span className="row-value-unassigned">Not Set</span>
                    )}
                  </span>
                )}
              </div>
              <div className="project-detail-row timeline-row timeline-row-orange align-timeline-row">
                <span className="row-icon">
                  <CalendarCheck size={18} />
                </span>
                <span className="row-label">Expected End Date</span>
                {editMode ? (
                  <input
                    className="form-input"
                    type="date"
                    value={editFields.endDate || ""}
                    onChange={(e) =>
                      handleEditFieldChange("endDate", e.target.value)
                    }
                  />
                ) : (
                  <span className="row-value timeline-value-orange">
                    {selectedProject.endDate || (
                      <span className="row-value-unassigned">Not Set</span>
                    )}
                  </span>
                )}
              </div>

              <div className="modal-section-divider" />
              {/* BUDGET */}
              <div className="modal-section-title">BUDGET</div>
              <div className="project-detail-row">
                <span className="row-icon">
                  <CreditCard size={18} />
                </span>
                <span className="row-label">Allotted Budget</span>
                {editMode ? (
                  <input
                    className="form-input"
                    type="number"
                    value={editFields.budgetAllotted}
                    onChange={(e) =>
                      handleEditFieldChange("budgetAllotted", e.target.value)
                    }
                  />
                ) : (
                  <span className="row-value row-value-pill">
                    ₹{" "}
                    {selectedProject.budgetAllotted || (
                      <span className="row-value-unassigned">Not Set</span>
                    )}
                  </span>
                )}
              </div>
              <div className="project-detail-row">
                <span className="row-icon">
                  <CreditCard size={18} />
                </span>
                <span className="row-label">Budget Expended Till Date</span>
                {editMode ? (
                  <input
                    className="form-input"
                    type="number"
                    value={editFields.budgetExpended}
                    onChange={(e) =>
                      handleEditFieldChange("budgetExpended", e.target.value)
                    }
                  />
                ) : (
                  <span className="row-value row-value-pill">
                    ₹{" "}
                    {selectedProject.budgetExpended || (
                      <span className="row-value-unassigned">Not Set</span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              {selectedProject.status === "Completed" && !editMode && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              )}
              {editMode ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setEditFields({
                        projectLead: selectedProject.projectLead || "",
                        teamLead: selectedProject.teamLead || "",
                        supervisor: selectedProject.supervisor || "",
                        teamMembers: selectedProject.teamMembers || [],
                        createdAt: selectedProject.createdAt,
                        endDate: selectedProject.endDate,
                        budgetAllotted: selectedProject.budgetAllotted || "",
                        budgetExpended: selectedProject.budgetExpended || "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProjectEdits}
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowProjectDetailModal(false);
                    setEditMode(false);
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamMembersModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal team-members-modal">
            <div className="modal-header">
              <h3>Team Members</h3>
              <button
                className="close-btn icon-btn"
                onClick={() => setShowTeamMembersModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content team-members-modal-content">
              {selectedProject.teamMembers &&
              selectedProject.teamMembers.length > 0 ? (
                <ul className="team-members-list-modal">
                  {selectedProject.teamMembers.map((u_id, idx) => {
                    const emp = employeeList.find((e) => e.u_id === u_id);
                    return (
                      <li
                        key={u_id || idx}
                        className="team-member-list-item-modal"
                      >
                        {emp ? emp.name : u_id}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="no-projects-message">
                  No team members assigned.
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
