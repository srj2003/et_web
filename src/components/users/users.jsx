import React, { useState, useEffect } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    CreditCard as Edit2,
    Lock,
    Trash2,
    ArrowLeft,
    Plus,
    Upload,
    Check,
} from "lucide-react";
import moment from "moment";
import Select from "react-select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Users.css";
// import defaultProfileImage from "../../assets/images/default_profile.png";

const Users = () => {
    const [MOCK_USERS, setMOCK_USERS] = useState({});
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [showAddUserRole, setShowAddUserRole] = useState(false);
    const [lastRoleId, setLastRoleId] = useState(1);
    const [profileImageLoading, setProfileImageLoading] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const [formData, setFormData] = useState({
        userId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "male",
        email: "",
        mobile: "",
        city: "",
        role_name: "",
        state: "",
        country: "",
        zipCode: "",
        streetAddress: "",
        organization: "",
        password: "",
        profileImage: "",
        cv: "",
        active: false,
        isDeleted: false,
        is_logged_out: false,
        created_at: "",
        updated_at: "",
    });

    const [formRoleData, setFormRoleData] = useState({
        role_id: 0,
        role_name: "",
        role_parent: 0,
        created_at: "",
        updated_at: "",
        role_active: false,
        role_is_del: false,
    });

    const fetchData = async () => {
        try {
            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/user_roles.php",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Origin: window.location.origin,
                    },
                    credentials: "same-origin",
                }
            );

            if (!response.ok) {
                throw new Error(`https error! status: ${response.status}`);
            }

            const jsonData = await response.json();

            if (!Array.isArray(jsonData)) {
                throw new Error("Data is not in the expected format");
            }

            setData(jsonData);
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err instanceof Error ? `Error: ${err.message}` : "An unexpected error occurred");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchData1 = async () => {
        try {
            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/user_details.php",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            if (!response.ok) {
                throw new Error(`https error! status: ${response.status}`);
            }

            const jsonData = await response.json();

            if (!Array.isArray(jsonData)) {
                throw new Error("Users data is not in the expected format");
            }

            const newusers = {};
            const today = moment().format("YYYY-MM-DD");

            jsonData.forEach((user, index) => {
                const loginDate = moment(user.most_recent_login).format("YYYY-MM-DD");

                newusers[String(index + 1)] = {
                    u_id: user.u_id.toString(),
                    user_id: user.user_id,
                    u_fname: user.u_fname,
                    u_mname: user.u_mname,
                    u_lname: user.u_lname,
                    user: user.user,
                    u_email: user.u_email,
                    u_mob: user.u_mob,
                    u_city: user.u_city,
                    u_state: user.u_state,
                    u_country: user.u_country,
                    u_organization: user.u_organization,
                    u_pro_img: user.u_pro_img,
                    u_cv: user.u_cv,
                    u_created_at: user.u_created_at,
                    role_name: user.role_name,
                    is_logged_out: user.is_logged_out,
                    user_status: loginDate === today && user.is_logged_out === 1 ? "ACTIVE" : "NOT ACTIVE",
                };
            });

            setMOCK_USERS(newusers);
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err instanceof Error ? `Error: ${err.message}` : "An unexpected error occurred");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchData1();
    }, []);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUri(reader.result);
                setFormData(prev => ({
                    ...prev,
                    profileImage: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCVUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    cv: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitUser = async () => {
        try {
            const userData = {
                ...formData,
                role_name: selectedRole,
                created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            };

            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/user_form.php",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success("User added successfully!");
                setShowAddUser(false);
                setSelectedRole(null);
                fetchData();
                fetchData1();
            } else {
                toast.error(result.message || "Failed to add user");
            }
        } catch (error) {
            console.error("Error submitting user:", error);
            toast.error("Something went wrong while adding the user. Please try again!");
        } finally {
            setImageUri(null);
            resetForm();
        }
    };

    const handleSubmitUserRole = async () => {
        if (!formRoleData.role_name.trim()) {
            toast.error("Role Name is mandatory. Please enter a role name.");
            return;
        }

        const roleDataToSend = {
            ...formRoleData,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            role_active: 1,
            role_is_del: 0,
        };

        try {
            const response = await fetch(
                "https://demo-expense.geomaticxevs.in/ET-api/role_form.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(roleDataToSend),
                }
            );

            const result = await response.json();
            if (result.success) {
                toast.success(result.message);
                fetchData();
                setShowAddUserRole(false);
                setSelectedRole(null);
            } else {
                toast.error("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Something went wrong!");
        }
        resetFormRole();
    };

    const toggleUserStatus = async (user) => {
        try {
            const newStatus = user.is_logged_out === 0 ? 0 : 1;
            const confirmationMessage =
                newStatus === 0
                    ? "Are you sure you want to deactivate this account? The user will no longer be able to log in."
                    : "Are you sure you want to activate this account?";

            if (window.confirm(confirmationMessage)) {
                const response = await fetch(
                    "https://demo-expense.geomaticxevs.in/ET-api/toggle_user_status.php",
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user_id: user.u_id,
                            u_active: newStatus,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to update user status");
                }

                const result = await response.json();
                if (result.success) {
                    toast.success(
                        newStatus === 0
                            ? "User account has been deactivated."
                            : "User account has been activated."
                    );
                    fetchData1();
                } else {
                    toast.error("Error updating user status: " + result.message);
                }
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            toast.error("Something went wrong while updating the user status.");
        }
    };

    const handleSave = async (userId) => {
        try {
            const userData = {
                user_id: editedUser?.u_id,
                first_name: editedUser?.u_fname,
                middle_name: editedUser?.u_mname,
                last_name: editedUser?.u_lname,
                email: editedUser?.u_email,
                mobile: editedUser?.u_mob,
                city: editedUser?.u_city,
                state: editedUser?.u_state,
                country: editedUser?.u_country,
                organization: editedUser?.u_organization,
                profile_image: editedUser?.u_pro_img,
                cv: editedUser?.u_cv,
            };

            const response = await fetch(
                `https://demo-expense.geomaticxevs.in/ET-api/user_save.php/${userId}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                }
            );

            if (!response.ok) {
                throw new Error(`https error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success("User updated successfully!");
                setShowAddUser(false);
                setSelectedRole(null);
                fetchData1();
            } else {
                toast.error(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Something went wrong while updating the user. Please try again!");
        }

        resetForm();
        setIsEditing(false);
    };

    const resetForm = () => {
        setFormData({
            userId: "",
            firstName: "",
            middleName: "",
            lastName: "",
            gender: "male",
            email: "",
            mobile: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
            role_name: "",
            streetAddress: "",
            organization: "",
            password: "",
            profileImage: "",
            cv: "",
            active: false,
            isDeleted: false,
            is_logged_out: false,
            created_at: "",
            updated_at: "",
        });
    };

    const resetFormRole = () => {
        setFormRoleData({
            role_id: 0,
            role_name: "",
            role_parent: 0,
            created_at: "",
            updated_at: "",
            role_active: false,
            role_is_del: false,
        });
    };

    const ITEMS_PER_PAGE = 10;
    const filteredRoles = data.filter((role) =>
        role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRoles = filteredRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const filteredUsers = Object.values(MOCK_USERS).filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            (user.user && user.user.toLowerCase().includes(searchLower)) ||
            (user.u_mob && user.u_mob.toLowerCase().includes(searchLower)) ||
            (user.u_email && user.u_email.toLowerCase().includes(searchLower))
        );
    });

    const totalFilteredPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedFilteredUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleViewProfile = (user) => {
        console.log("Opening profile for user:", user); // Debug log
        setEditedUser(user);
        setShowUserProfile(true);
        setIsEditing(false);
    };

    return (
        <div className="users-container">
            <div className="header">
                <h1 className="title">Users</h1>
                <button className="add-button" onClick={() => setShowAddUser(true)}>
                    <Plus size={20} />
                    <span>Add User</span>
                </button>
            </div>

            <div className="search-container">
                <Search size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('all');
                        setSelectedRole(null);
                    }}
                >
                    All
                </button>
                <button
                    className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    Categories
                </button>
            </div>

            {activeTab === 'all' ? (
                <>
                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>USER</th>
                                    <th>EMAIL</th>
                                    <th>MOBILE</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedFilteredUsers.map((user) => (
                                    <tr
                                        key={user.u_id}
                                        className="user-row"
                                        onClick={() => handleViewProfile(user)}
                                    >
                                        <td>
                                            <div className="user-info">
                                                <span className="user-name">{user.user}</span>
                                                <span className="user-id">{user.u_id}</span>
                                            </div>
                                        </td>
                                        <td>{user.u_email}</td>
                                        <td>{user.u_mob}</td>
                                        <td>
                                            <div
                                                className={`status-badge ${user.is_logged_out === 0 ? "active" : "inactive"}`}
                                            />
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="action-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewProfile(user);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleUserStatus(user);
                                                    }}
                                                >
                                                    <Lock
                                                        size={16}
                                                        color={user.is_logged_out === 0 ? "#22c55e" : "#ef4444"}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span className="pagination-text">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
                            {filteredUsers.length} entries
                        </span>
                        <div className="pagination-controls">
                            <button
                                className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="page-numbers">
                                <span className="current-page">{currentPage}</span>
                                <span>of {totalFilteredPages}</span>
                            </div>
                            <button
                                className={`page-button ${currentPage === totalFilteredPages ? "disabled" : ""}`}
                                onClick={() => setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))}
                                disabled={currentPage === totalFilteredPages}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {selectedRole ? (
                        <>
                            <div className="table-container">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>USER</th>
                                            <th>EMAIL</th>
                                            <th>MOBILE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedFilteredUsers.map((user) => (
                                            <tr
                                                key={user.u_id}
                                                className="user-row"
                                                onClick={() => handleViewProfile(user)}
                                            >
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">{user.user}</span>
                                                        <span className="user-id">{user.u_id}</span>
                                                    </div>
                                                </td>
                                                <td>{user.u_email}</td>
                                                <td>{user.u_mob}</td>
                                                <td>
                                                    <div
                                                        className={`status-badge ${user.is_logged_out === 0 ? "active" : "inactive"}`}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button
                                                            className="action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewProfile(user);
                                                            }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className="action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleUserStatus(user);
                                                            }}
                                                        >
                                                            <Lock
                                                                size={16}
                                                                color={user.is_logged_out === 0 ? "#22c55e" : "#ef4444"}
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <span className="pagination-text">
                                    Showing {startIndex + 1} to{" "}
                                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
                                    {filteredUsers.length} entries
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="page-numbers">
                                        <span className="current-page">{currentPage}</span>
                                        <span>of {totalFilteredPages}</span>
                                    </div>
                                    <button
                                        className={`page-button ${currentPage === totalFilteredPages ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))}
                                        disabled={currentPage === totalFilteredPages}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="roles-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>USER ROLE</th>
                                            <th>TOTAL COUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRoles.map((role) => (
                                            <tr
                                                key={role.role_id}
                                                onClick={() => setSelectedRole(role.role_name)}
                                                className="role-row"
                                            >
                                                <td>{role.role_id}</td>
                                                <td className="role-name">{role.role_name}</td>
                                                <td>{role.user_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <span className="pagination-text">
                                    Showing {startIndex + 1} to{" "}
                                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredRoles.length)} of{" "}
                                    {filteredRoles.length} entries
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="page-numbers">
                                        <span className="current-page">{currentPage}</span>
                                        <span>of {totalPages}</span>
                                    </div>
                                    <button
                                        className={`page-button ${currentPage === totalPages ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <button
                                className="back-button"
                                onClick={() => {
                                    resetForm();
                                    setShowAddUser(false);
                                }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="modal-title">Add New User</h2>
                        </div>

                        <div className="form-container">
                            <div className="form-section">
                                <h3 className="section-title">Profile Details</h3>

                                <div className="upload-container" onClick={() => document.getElementById('profileImage').click()}>
                                    {imageUri && (
                                        <img src={imageUri} alt="Profile" className="preview-image" />
                                    )}
                                    <div className="upload-circle">
                                        <Upload size={24} />
                                    </div>
                                    <span className="upload-text">Upload Profile Image</span>
                                </div>
                                <input
                                    type="file"
                                    id="profileImage"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />

                                <div className="form-group">
                                    <label>User ID</label>
                                    <input
                                        type="text"
                                        value={formData.userId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, userId: e.target.value })
                                        }
                                        placeholder="Enter user ID"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                        placeholder="Enter first name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Middle Name</label>
                                    <input
                                        type="text"
                                        value={formData.middleName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, middleName: e.target.value })
                                        }
                                        placeholder="Enter middle name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, lastName: e.target.value })
                                        }
                                        placeholder="Enter last name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        placeholder="Enter email address"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(e) =>
                                            setFormData({ ...formData, mobile: e.target.value })
                                        }
                                        placeholder="Enter mobile number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        placeholder="Enter password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Gender</label>
                                    <div className="radio-group">
                                        <label className="radio-button">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                checked={formData.gender === "male"}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, gender: e.target.value })
                                                }
                                            />
                                            <span className="radio-label">Male</span>
                                        </label>

                                        <label className="radio-button">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                checked={formData.gender === "female"}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, gender: e.target.value })
                                                }
                                            />
                                            <span className="radio-label">Female</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="upload-container" onClick={() => document.getElementById('cvFile').click()}>
                                    <div className="upload-circle">
                                        <Upload size={24} />
                                    </div>
                                    <span className="upload-text">
                                        {formData.cv ? "Update CV (PDF)" : "Upload CV (PDF)"}
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    id="cvFile"
                                    accept=".pdf"
                                    onChange={handleCVUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="form-section">
                                <h3 className="section-title">Organization Details</h3>

                                <div className="form-group">
                                    <label>Organization</label>
                                    <input
                                        type="text"
                                        value={formData.organization}
                                        onChange={(e) =>
                                            setFormData({ ...formData, organization: e.target.value })
                                        }
                                        placeholder="Enter organization name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Role</label>
                                    <input
                                        type="text"
                                        value={selectedRole || ""}
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Street Address</label>
                                    <textarea
                                        value={formData.streetAddress}
                                        onChange={(e) =>
                                            setFormData({ ...formData, streetAddress: e.target.value })
                                        }
                                        placeholder="Enter street address"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>State</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                            placeholder="Enter state"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            placeholder="Enter city"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Created At</label>
                                    <input
                                        type="text"
                                        value={formData.created_at}
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>
                            </div>

                            <div className="toggle-container">
                                <label>Active</label>
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) =>
                                        setFormData({ ...formData, active: e.target.checked })
                                    }
                                />
                            </div>

                            <div className="toggle-container">
                                <label>Deleted</label>
                                <input
                                    type="checkbox"
                                    checked={formData.isDeleted}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isDeleted: e.target.checked })
                                    }
                                />
                            </div>

                            <div className="button-container">
                                <button className="submit-button" onClick={handleSubmitUser}>
                                    Add User
                                </button>
                                <button
                                    className="cancel-button"
                                    onClick={() => {
                                        setImageUri(null);
                                        resetForm();
                                        setShowAddUser(false);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Role Modal */}
            {showAddUserRole && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <button
                                className="back-button"
                                onClick={() => {
                                    setSelectedRole(null);
                                    resetFormRole();
                                    setShowAddUserRole(false);
                                }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="modal-title">Add New Role</h2>
                        </div>

                        <div className="form-container">
                            <div className="form-section">
                                <h3 className="section-title">Role Details</h3>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role Id</label>
                                        <input
                                            type="text"
                                            value={formRoleData.role_id || lastRoleId}
                                            readOnly
                                            className="readonly-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Role Name</label>
                                        <input
                                            type="text"
                                            value={formRoleData.role_name}
                                            onChange={(e) =>
                                                setFormRoleData({
                                                    ...formRoleData,
                                                    role_name: e.target.value,
                                                })
                                            }
                                            placeholder="Enter Role Name"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Created At</label>
                                        <input
                                            type="text"
                                            value={formRoleData.created_at}
                                            readOnly
                                            className="readonly-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Parent Role</label>
                                        <Select
                                            options={data.map((role) => ({
                                                value: role.role_id.toString(),
                                                label: role.role_name,
                                            }))}
                                            value={
                                                formRoleData.role_parent
                                                    ? {
                                                        value: formRoleData.role_parent.toString(),
                                                        label: data.find(
                                                            (r) => r.role_id === formRoleData.role_parent
                                                        )?.role_name,
                                                    }
                                                    : null
                                            }
                                            onChange={(option) =>
                                                setFormRoleData({
                                                    ...formRoleData,
                                                    role_parent: option ? parseInt(option.value) : 0,
                                                })
                                            }
                                            placeholder="Select Parent Role"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="button-container">
                                <button
                                    className="cancel-button"
                                    onClick={() => {
                                        setSelectedRole(null);
                                        resetFormRole();
                                        setShowAddUserRole(false);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button className="submit-button" onClick={handleSubmitUserRole}>
                                    Add User Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showUserProfile && editedUser && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <button
                                className="back-button"
                                onClick={() => {
                                    setShowUserProfile(false);
                                    setIsEditing(false);
                                    setEditedUser(null);
                                }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="modal-title">User Profile</h2>
                            <button
                                className="edit-button"
                                onClick={() => isEditing ? handleSave(editedUser.u_id) : setIsEditing(true)}
                            >
                                {isEditing ? (
                                    <>
                                        <Check size={20} />
                                        <span>Save</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit2 size={20} />
                                        <span>Edit</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="profile-content">
                            <div className="profile-image-container">
                                <img
                                    src={editedUser.u_pro_img || "https://via.placeholder.com/150"}
                                    alt="Profile"
                                    className="profile-image"
                                />
                                {isEditing && (
                                    <button
                                        className="upload-button"
                                        onClick={() => document.getElementById('editProfileImage').click()}
                                    >
                                        <Upload size={20} />
                                        <span>Update Photo</span>
                                    </button>
                                )}
                                <input
                                    type="file"
                                    id="editProfileImage"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="profile-section">
                                <h3 className="section-title">Personal Information</h3>
                                <div className="profile-details">
                                    <div className="detail-group">
                                        <label>First Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_fname}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_fname: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_fname}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>Middle Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_mname}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_mname: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_mname}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>Last Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_lname}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_lname: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_lname}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>Email</label>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editedUser.u_email}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_email: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3 className="section-title">Organization Details</h3>
                                <div className="profile-details">
                                    <div className="detail-group">
                                        <label>Organization</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_organization}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_organization: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_organization}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>Role</label>
                                        <span>{editedUser.role_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3 className="section-title">Location</h3>
                                <div className="profile-details">
                                    <div className="detail-group">
                                        <label>City</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_city}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_city: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_city}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>State</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_state}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_state: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_state}</span>
                                        )}
                                    </div>

                                    <div className="detail-group">
                                        <label>Country</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedUser.u_country}
                                                onChange={(e) =>
                                                    setEditedUser({
                                                        ...editedUser,
                                                        u_country: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <span>{editedUser.u_country}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3 className="section-title">Documents</h3>
                                <div className="profile-details">
                                    <div className="detail-group">
                                        <label>CV/Resume</label>
                                        {editedUser.u_cv ? (
                                            <div className="document-container">
                                                <span className="document-text">
                                                    {editedUser.u_cv.split("/").pop()}
                                                </span>
                                                <button className="view-button">View</button>
                                            </div>
                                        ) : (
                                            <span className="no-document">No document uploaded</span>
                                        )}
                                        {isEditing && (
                                            <button
                                                className="upload-document-button"
                                                onClick={() => document.getElementById('editCVFile').click()}
                                            >
                                                <Upload size={16} />
                                                <span>
                                                    {editedUser.u_cv ? "Update CV" : "Upload CV"}
                                                </span>
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            id="editCVFile"
                                            accept=".pdf"
                                            onChange={handleCVUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3 className="section-title">Additional Information</h3>
                                <div className="profile-details">
                                    <div className="detail-group">
                                        <label>Created At</label>
                                        <span>
                                            {new Date(editedUser.u_created_at).toLocaleDateString(
                                                "en-US",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users; 