import React, { useState, useEffect } from "react";
import "./addleaves.css";
import {
  Calendar,
  Search,
  X,
  Upload,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

const leaveGroundOptions = [
  { label: "Half-day Leave", value: "Half-day Leave" },
  { label: "Casual Leave (CL)", value: "Casual Leave (CL)" },
  { label: "Medical Leave", value: "Medical Leave" },
];

const AddLeaves = () => {
  const [userData, setUserData] = useState({
    userId: "",
    role: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [leaveTitle, setLeaveTitle] = useState("");
  const [leaveGround, setLeaveGround] = useState("");
  const [leaveDescription, setLeaveDescription] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentDate] = useState(new Date().toLocaleString());

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = localStorage.getItem("userid");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }
        );
        const roleResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        const roleData = await roleResponse.json();
        if (!roleData.role_name) {
          throw new Error("Role not found");
        }
        const data = await response.json();
        if (data.status === "success" && data.data) {
          setUserData({
            userId: userId,
            role: roleData.role_name || "",
            firstName: data.data.u_fname || "",
            middleName: data.data.u_mname || "",
            lastName: data.data.u_lname || "",
          });
          console.log("User data loaded successfully:", data.data);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add-leaves1.php?fetch_roles=true"
        );
        const data = await response.json();
        console.log("Fetched roles:", data);
        if (data.status === "success" && data.roles) {
          setRoles(data.roles);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchUsersByRole(selectedRole);
    }
  }, [selectedRole]);

  const fetchUsersByRole = async (roleId) => {
    try {
      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/add-leaves1.php?role_id=${roleId}`
      );
      const data = await response.json();
      if (data.status === "success" && data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!leaveTitle || !leaveGround || !fromDate || !toDate || !selectedUser) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("leave_title", leaveTitle);
      formData.append("leave_ground", leaveGround);
      formData.append("leave_from_date", fromDate);
      formData.append("leave_to_date", toDate);
      formData.append("leave_comment", leaveDescription);
      formData.append("leave_track_submitted_to", selectedUser);
      formData.append("leave_track_created_by", userData.userId);

      selectedFiles.forEach((file) => {
        formData.append("file[]", file);
      });

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add-leaves1.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        alert("Leave request submitted successfully!");
        resetForm();
      } else {
        throw new Error(result.message || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeaveTitle("");
    setLeaveGround("");
    setLeaveDescription("");
    setFromDate("");
    setToDate("");
    setSelectedFiles([]);
    setSelectedRole(null);
    setSelectedUser(null);
  };

  if (isLoadingUser) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="expense-form-container">
      <h1 className="form-title">Apply for Leave</h1>

      {/* Personal Information Section */}
      <section className="form-section">
        <h2 className="section-title">Personal Information</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>User ID</label>
            <input type="text" value={userData.userId} readOnly />
          </div>
          <div className="form-group">
            <label>User Type</label>
            <input type="text" value={userData.role} readOnly />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={`${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim()}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input type="text" value={currentDate} readOnly />
          </div>
        </div>
      </section>

      {/* Leave Details Section */}
      <section className="form-section">
        <h2 className="section-title">Leave Details</h2>
        <button className="reset-button" onClick={resetForm}>
          Reset
        </button>
        <div className="form-grid">
          <div className="form-group">
            <label>Leave Ground *</label>
            <select
              value={leaveGround}
              onChange={(e) => setLeaveGround(e.target.value)}
              className="select-input"
            >
              <option value="">Select Leave Ground</option>
              {leaveGroundOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Leave Title *</label>
            <input
              type="text"
              value={leaveTitle}
              onChange={(e) => setLeaveTitle(e.target.value)}
              placeholder="Enter Leave Title"
            />
          </div>

          <div className="form-group full-width">
            <label>Leave Description *</label>
            <textarea
              value={leaveDescription}
              onChange={(e) => setLeaveDescription(e.target.value)}
              placeholder="Describe your leave request"
            />
          </div>

          <div className="form-group">
            <label>From Date *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="form-group">
            <label>To Date *</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Upload Documents (Optional)</label>
            <div className="file-upload">
              <input
                type="file"
                id="document-upload"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="file-input"
              />
              <label htmlFor="document-upload" className="file-label">
                <span className="file-upload-icon">
                  <Upload size={18} />
                </span>
                <span className="file-upload-text">Upload Documents</span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      className="remove-file"
                      onClick={() => removeFile(index)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Submit To Section */}
      <section className="form-section">
        <h2 className="section-title">Submit To</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Role *</label>
            <div
              className="select-input"
              onClick={() => setShowRoleModal(true)}
            >
              {selectedRole
                ? roles.find((role) => role.value === selectedRole)?.label
                : "Select Role"}
            </div>
          </div>

          {selectedRole && (
            <div className="form-group">
              <label>Name *</label>
              <div
                className="select-input"
                onClick={() => setShowNameModal(true)}
              >
                {selectedUser
                  ? users.find((user) => user.id === selectedUser)?.name
                  : "Select Name"}
              </div>
            </div>
          )}
        </div>
      </section>
      <div className="submit-button-container">
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Leave Request"}
        </button>
      </div>
      {/* Modals */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Role</h3>
              <button
                className="modal-close"
                onClick={() => setShowRoleModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="modal-list">
                {roles.length > 0 ? (
                  roles
                    .filter((role) =>
                      role.label
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((role) => (
                      <div
                        key={role.value}
                        className={`modal-item ${
                          selectedRole === role.value ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedRole(role.value);
                          setSelectedUser(null);
                          setShowRoleModal(false);
                          setSearchQuery("");
                        }}
                      >
                        {role.label}
                      </div>
                    ))
                ) : (
                  <div className="no-data">No roles available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Name</h3>
              <button
                className="modal-close"
                onClick={() => setShowNameModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="modal-list">
                {users.length > 0 ? (
                  users
                    .filter((user) =>
                      user.name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className={`modal-item ${
                          selectedUser === user.id ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedUser(user.id);
                          setShowNameModal(false);
                          setSearchQuery("");
                        }}
                      >
                        {user.name}
                      </div>
                    ))
                ) : (
                  <div className="no-data">
                    No users available for selected role
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddLeaves;
