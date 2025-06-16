import React, { useEffect, useState } from "react";
import "./my_projects.css";
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      window.location.href = "/";
      return;
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        alert("Session expired. Please login again.");
        window.location.href = '/';
        return;
      }

      const res = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.projects)) {
        setProjects(data.projects);
        setFilteredProjects(data.projects);
        
        // Calculate stats
        setStats({
          total: data.projects.length,
          ongoing: data.projects.filter(p => p.status.toLowerCase() === "ongoing").length,
          completed: data.projects.filter(p => p.status.toLowerCase() === "complete").length
        });
      } else {
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert("Error: Failed to load projects.");
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [searchQuery, projects]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchProjectDetails = async (projectId) => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      alert("Session expired. Please login again.");
      window.location.href = '/';
      return;
    }

    setLoadingDetails(true);
    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/get_project_details.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            user_id: userId,
            project_id: projectId 
          }),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      
      const data = await response.json();
      console.log('Project details response:', data);
      
      if (data.status === "success" && data.project_details) {
        const allUsers = [...(data.project_details.assigned_users || [])];
        
        setSelectedProject({
          ...data.project_details,
          assigned_users: allUsers
        });
        setModalVisible(true);
      } else {
        alert("Error: Failed to load project details.");
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert("Error: Failed to load project details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const ProjectDetailsModal = () => (
    modalVisible && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Project Details</h2>
            <button className="close-button" onClick={() => setModalVisible(false)}>
              <X size={20} />
            </button>
          </div>
          
          {loadingDetails ? (
            <div className="loader">Loading...</div>
          ) : selectedProject ? (
            <div className="modal-body">
              <div className="details-section">
                <h3>{selectedProject.project_name}</h3>
                <span className={`status-badge ${selectedProject.status.toLowerCase()}`}>
                  {selectedProject.status}
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Start Date</span>
                  <span className="detail-value">
                    {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">End Date</span>
                  <span className="detail-value">
                    {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="team-section">
                <h3>Project Team</h3>
                {selectedProject.assigned_users && selectedProject.assigned_users.length > 0 ? (
                  <div className="team-members">
                    {selectedProject.assigned_users.map((user) => (
                      <div key={user.user_id} className="member-card">
                        <div className="member-info">
                          <h4>{user.full_name}</h4>
                          <span className="member-role">{user.role}</span>
                        </div>
                        <div className="member-contact">
                          <p>{user.email}</p>
                          <p>{user.mobile}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No team members assigned</p>
                )}
              </div>
            </div>
          ) : (
            <p className="error-text">No project details available</p>
          )}
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h1 className="page-title">My Projects</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Briefcase size={24} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>Total Projects</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <h3>Ongoing</h3>
            <p className="stat-value">{stats.ongoing}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-value">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {currentProjects.map((project) => (
          <div
            key={`project-${project.project_id || Math.random()}`}
            className="project-card"
            onClick={() => project.project_id && fetchProjectDetails(project.project_id)}
          >
            <div className="project-header">
              <div className="project-header-content">
                <h3 className="project-name">{project.project_name}</h3>
              </div>
              <span className={`status-badge ${project.status.toLowerCase()}`}>
                {project.status}
              </span>
            </div>
            <div className="project-details">
              <div className="date-section">
                <div className="date-item">
                  <span className="date-label">Start Date:</span>
                  <span className="date-value">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="date-item">
                  <span className="date-label">End Date:</span>
                  <span className="date-value">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <div className="pagination-number">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <ProjectDetailsModal />
    </div>
  );
};

export default MyProjects;