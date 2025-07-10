import React, { useState, useEffect } from "react";
import "./add_requisition.css";
import { Calendar, Upload, X, Search, Plus, Trash2, Edit2 } from "lucide-react";

const RequisitionFormWeb = () => {
  const [userData, setUserData] = useState({
    userId: "",
    role: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [requisitionTitle, setrequisitionTitle] = useState("");
  const [currentRequisition, setcurrentRequisition] = useState({
    id: Math.random().toString(36).substring(7),
    title: "",
    description: "",
    amount: 0,
    remarks: "",
    billDate: "",
  });
  const [requisitions, setrequisitions] = useState([]);
  const [submittedToCategory, setSubmittedToCategory] = useState("");
  const [submittedToName, setSubmittedToName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate] = useState(new Date().toLocaleString());
  const [currentLocation, setCurrentLocation] = useState({
    latitude: "0",
    longitude: "0",
  });

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingUser(true);
      try {
        const userId = localStorage.getItem("userid");
        const token = localStorage.getItem("authToken");

        if (!userId || !token) {
          window.location.href = "/";
          return;
        }

        const roleResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        // Add token to dashboard API call
        const userResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          }
        );

        const roleData = await roleResponse.json();
        if (!roleData.role_name) {
          throw new Error("Role not found");
        }

        const userData = await userResponse.json();
        if (userData.status !== "success" || !userData.data) {
          throw new Error("User details not found");
        }

        setUserData({
          userId: userId,
          role: roleData.role_name,
          firstName: userData.data.u_fname || "",
          middleName: userData.data.u_mname || "",
          lastName: userData.data.u_lname || "",
        });
      } catch (error) {
        if (error.message.includes("401")) {
          window.location.href = "/";
          return;
        }
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    // Update fetchRoles to include token
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_roles=true",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        if (data.status === "success") {
          setRoles(
            data.roles.map((role) => ({
              label: role.label,
              value: String(role.value),
            }))
          );
        }
      } catch (error) {
        if (error.message.includes("401")) {
          window.location.href = "/";
          return;
        }
        console.error("Error fetching roles", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      // Update fetchUsers to include token
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(
            `https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?role_id=${selectedRole}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const data = await res.json();
          if (data.status === "success") {
            setUsers(
              data.users.map((user) => ({
                label: user.name,
                value: user.id,
              }))
            );
          }
        } catch (error) {
          if (error.message.includes("401")) {
            window.location.href = "/";
            return;
          }
          console.error("Error fetching users", error);
        }
      };

      fetchUsers();
    }
  }, [selectedRole]);

  useEffect(() => {
    const getLocation = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString(),
              });
            },
            (error) => {
              console.error("Error getting location:", error);
              alert("Location permission is required");
            }
          );
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getLocation();
  }, []);

  const resetForm = () => {
    setcurrentRequisition({
      id: Math.random().toString(36).substring(7),
      title: "",
      description: "",
      amount: 0,
      remarks: "",
      billDate: "",
    });
    setSelectedRole(null);
    setSelectedUser(null);
    setUsers([]);
    setSearchQuery("");
  };

  const handleSubmitrequisitions = async () => {
    // Validation for all required fields
    if (
      !requisitionTitle ||
      !currentRequisition.amount ||
      !currentRequisition.description ||
      !currentRequisition.billDate ||
      !selectedUser ||
      !selectedRole
    ) {
      alert("Fill all the fields");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setIsSubmitting(true);

    try {
      const requisitionData = {
        requisition_title: requisitionTitle,
        requisition_desc: currentRequisition.description,
        requisition_req_amount: currentRequisition.amount,
        requisition_submitted_to: selectedUser,
        requisition_created_by: userData.userId,
        requisition_latitude: currentLocation.latitude,
        requisition_longitude: currentLocation.longitude,
        requisition_date: currentRequisition.billDate,
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add_requisition.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requisitionData),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      const result = await response.json();

      if (result.status === "success") {
        alert("requisitions submitted successfully!");
        currentRequisition.amount = 0;
        resetForm();
        setrequisitions([]);
        setrequisitionTitle("");
        setSubmittedToCategory("");
        setSubmittedToName("");
      } else {
        throw new Error(result.message || "Failed to submit requisitions");
      }
    } catch (error) {
      if (error.message.includes("401")) {
        window.location.href = "/";
        return;
      }
      console.error("Submission error:", error);
      alert("Fill all the fields or check your internet connection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = requisitions.reduce((sum, exp) => sum + exp.amount, 0);

  const renderModal = (title, items, selectedValue, onSelect, onClose) => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="modal-content">
          {items
            .filter((item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item) => (
              <div
                key={item.value}
                className={`modal-item ${
                  selectedValue === item.value ? "selected" : ""
                }`}
                onClick={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                {item.label}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  if (isLoadingUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="expense-form-container">
      <h1 className="form-title">Add New Requisition</h1>

      {/* Personal Information Section */}
      <section className="form-section">
        <h2 className="section-title">Personal Information</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>USER ID</label>
            <input type="text" value={userData.userId} readOnly />
          </div>
          <div className="form-group">
            <label>USER TYPE</label>
            <input type="text" value={userData.role} readOnly />
          </div>
          <div className="form-group">
            <label>FULL NAME</label>
            <input
              type="text"
              value={`${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim()}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>DATE & TIME</label>
            <input type="text" value={currentDate} readOnly />
          </div>
          <div className="form-group">
            <label>LOCATION</label>
            <input
              type="text"
              value={`Lat: ${currentLocation.latitude}, Long: ${currentLocation.longitude}`}
              readOnly
            />
          </div>
        </div>
      </section>

      {/* Expense Details Section */}
      <section className="form-section">
        <h2 className="section-title">Requsitions Details</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Requisition Title</label>
            <input
              type="text"
              value={requisitionTitle}
              onChange={(e) => setrequisitionTitle(e.target.value)}
              placeholder="Enter Requisition Title"
            />
          </div>
          <div className="form-group">
            <label>Requested Amount</label>
            <input
              type="number"
              value={currentRequisition.amount}
              onChange={(e) =>
                setcurrentRequisition({
                  ...currentRequisition,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Describe Purpose</label>
            <textarea
              value={currentRequisition.description}
              onChange={(e) =>
                setcurrentRequisition({
                  ...currentRequisition,
                  description: e.target.value,
                })
              }
              placeholder="Describe the purpose of this requisition"
            />
          </div>
          <div className="form-group">
            <label>Bill Date</label>
            <div className="date-input-container">
              <input
                type="date"
                value={currentRequisition.billDate}
                onChange={(e) => {
                  setcurrentRequisition({
                    ...currentRequisition,
                    billDate: e.target.value,
                  });
                }}
                className="date-input"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Submit To Section */}
      <section className="form-section">
        <h2 className="section-title">Submit To</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="role-label">Role</label>
            <select
              className="select-input role-select"
              value={selectedRole || ""}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setSelectedUser(null);
              }}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {selectedRole && (
            <div className="form-group">
              <label className="role-label">Name</label>
              <select
                className="select-input role-select"
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select Name</option>
                {users.map((user) => (
                  <option key={user.value} value={user.value}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <button
        className={`submit-all-button ${isSubmitting ? "loading" : ""}`}
        onClick={handleSubmitrequisitions}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Requisition"}
      </button>

      {/* Modals */}

      {showRoleModal &&
        renderModal("Select Role", roles, selectedRole, setSelectedRole, () =>
          setShowRoleModal(false)
        )}

      {showNameModal &&
        renderModal("Select Name", users, selectedUser, setSelectedUser, () =>
          setShowNameModal(false)
        )}
    </div>
  );
};

export default RequisitionFormWeb;
