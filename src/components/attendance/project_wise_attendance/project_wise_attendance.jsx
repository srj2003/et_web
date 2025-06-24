import React, { useState, useEffect } from "react";
import "./project_wise_attendance.css";
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

  return (
    <div className="users-container">
      <div className="header">
        <h1 className="title">User Attendance</h1>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search attendance..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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

      {activeTab === "all" ? (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr className="user-th">
                <th>ID</th>
                <th>NAME</th>
                {/* <th>PROJECT</th> */}
                <th>STATUS</th>
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
                      {/* <td>{item.expense_type_name}</td> */}
                      <td>
                        <span className={item.is_logged_out === 0 ? 'status-present-text' : 'status-absent-text'}>
                          {item.is_logged_out === 0 ? 'Present' : 'Absent'}
                        </span>
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
    </div>
  );
};

export default Attendance;
