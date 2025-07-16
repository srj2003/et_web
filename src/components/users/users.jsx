import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Pen as Edit2,
  Lock,
  LockOpen,
  Trash2,
  ArrowLeft,
  Plus,
  Upload,
  Check,
  Mail,
  FileText,
  X,
  Eye,
  AlertCircle,
  Download,
} from "lucide-react";
import moment from "moment";
import Select from "react-select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./users.css";
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
  const [activeTab, setActiveTab] = useState("all");
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [userRoleSearch, setUserRoleSearch] = useState("");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
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
    cvName: "",
    cvSize: 0,
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

  // Add default avatar data URL
  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik03NSA4OUM1Ny4zMjY5IDg5IDQzIDczLjY3MzEgNDMgNTZDNDMgMzguMzI2OSA1Ny4zMjY5IDI0IDc1IDI0QzkyLjY3MzEgMjQgMTA3IDM4LjMyNjkgMTA3IDU2QzEwNyA3My42NzMxIDkyLjY3MzEgODkgNzUgODlaIiBmaWxsPSIjOTRBM0I4Ii8+CjxwYXRoIGQ9Ik0xMDcuNzc4IDE0NS45MjVDMTA1LjY3NiAxMzQuODIxIDk1LjU1NjQgMTI2IDgzLjY2NjcgMTI2SDY2LjMzMzRDNTQuNDQzNiAxMjYgNDQuMzIzOCAxMzQuODIxIDQyLjIyMjIgMTQ1LjkyNUM0Mi4wNzU0IDE0Ni42MzcgNDIgMTQ3LjM2NyA0MiAxNDhDNDIgMTQ5LjEwNSA0Mi44OTU0IDE1MCA0NCAxNTBIMTA2QzEwNy4xMDUgMTUwIDEwOCAxNDkuMTA1IDEwOCAxNDhDMTA4IDE0Ny4zNjcgMTA3LjkyNSAxNDYuNjM3IDEwNy43NzggMTQ1LjkyNVoiIGZpbGw9IiM5NEEzQjgiLz4KPC9zdmc+Cg==";

  // Get roleId from localStorage and check if user can download
  const roleId = localStorage.getItem('roleId');
  const canDownload = ["1", "2", "8"].includes(roleId);

  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [roleDetailsLoading, setRoleDetailsLoading] = useState(false);
  const [roleDetailsError, setRoleDetailsError] = useState(null);
  const [roleDetailsSaving, setRoleDetailsSaving] = useState(false);

  const [userCapping, setUserCapping] = useState(null);
  const [userCappingLoading, setUserCappingLoading] = useState(false);
  const [userCappingError, setUserCappingError] = useState(null);
  const [userCappingEdit, setUserCappingEdit] = useState(null);
  const [userCappingSaving, setUserCappingSaving] = useState(false);

  // Add at the top of the Users component:
  const profileSections = [
    { key: "personal", label: "Personal Information" },
    { key: "organization", label: "Organization Details" },
    { key: "location", label: "Location" },
    { key: "documents", label: "Documents" },
    { key: "capping", label: "Capping Amount" },
    { key: "additional", label: "Additional Information" },
  ];
  const [activeProfileSection, setActiveProfileSection] = useState("personal");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_roles.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      const jsonData = await response.json();

      if (!Array.isArray(jsonData)) {
        throw new Error("Data is not in the expected format");
      }

      setData(jsonData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error
          ? `Error: ${err.message}`
          : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchData1 = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_details.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
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
          u_active: user.u_active,
          user_status:
            loginDate === today && user.u_active === 1
              ? "ACTIVE"
              : "NOT ACTIVE",
        };
      });

      setMOCK_USERS(newusers);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error
          ? `Error: ${err.message}`
          : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      window.location.href = "/";
      return;
    }
    
    fetchData();
    fetchData1();
  }, []);

  // Calculate last role ID when data is loaded
  useEffect(() => {
    if (data.length > 0) {
      const maxRoleId = Math.max(...data.map((role) => role.role_id));
      setLastRoleId(maxRoleId + 1);
    }
  }, [data]);

  // Update form role data when showAddUserRole changes
  useEffect(() => {
    if (showAddUserRole) {
      const currentTimestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      setFormRoleData((prev) => ({ 
        ...prev, 
        role_id: lastRoleId,
        created_at: currentTimestamp 
      }));
    }
  }, [showAddUserRole, lastRoleId]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result);
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCVUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size should not exceed 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          cv: reader.result,
          cvName: file.name,
          cvSize: file.size,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.userId?.trim()) {
      errors.userId = "User ID is required";
    }
    if (!formData.firstName?.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.mobile?.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/[^0-9]/g, ''))) {
      errors.mobile = "Mobile number must be 10 digits";
    }
    if (!formData.password?.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!selectedRole) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUser = async () => {
    setSubmitError("");

    if (!validateForm()) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    try {
      // Create FormData object for multipart/form-data
      const formDataObj = new FormData();

      // Required fields as per PHP API
      formDataObj.append("user_id", formData.userId);
      formDataObj.append("first_name", formData.firstName);
      formDataObj.append("last_name", formData.lastName || "");
      formDataObj.append("email", formData.email);
      formDataObj.append("mobile", formData.mobile);
      formDataObj.append("password", formData.password);
      formDataObj.append("role_name", selectedRole || "user");

      // Optional fields
      formDataObj.append("middle_name", formData.middleName || "");
      formDataObj.append("gender", formData.gender || "male");
      formDataObj.append("city", formData.city || "");
      formDataObj.append("state", formData.state || "");
      formDataObj.append("country", formData.country || "");
      formDataObj.append("zip_code", formData.zipCode || "");
      formDataObj.append("street_address", formData.streetAddress || "");
      formDataObj.append("organization", formData.organization || "");
      formDataObj.append("active", formData.active ? "1" : "0");
      formDataObj.append("is_deleted", "0");
      formDataObj.append("created_at", moment().format("YYYY-MM-DD HH:mm:ss"));
      formDataObj.append("updated_at", moment().format("YYYY-MM-DD HH:mm:ss"));

      // Handle profile image
      if (formData.profileImage) {
        const profileImageBlob = await fetch(formData.profileImage).then((r) =>
          r.blob()
        );
        formDataObj.append("profile_image", profileImageBlob, "profile_image.jpg");
      }

      // Handle CV
      if (formData.cv) {
        const cvBlob = await fetch(formData.cv).then((r) => r.blob());
        formDataObj.append("cv", cvBlob, formData.cvName || "document.pdf");
      }
      console.log("Submitting user data:", {
        userId: formData.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        role_name: selectedRole,
        profileImage: formData.profileImage,
        cv: formData.cv,
      });
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add_users.php",
        {
          method: "POST",
          body: formDataObj,
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        toast.success("User added successfully!");
        setShowAddUser(false);
        setSelectedRole(null);
        await fetchData();
        await fetchData1();
        resetForm();
      } else {
        throw new Error(result.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error submitting user:", error);
      setSubmitError(error.message || "Something went wrong while adding the user");
      toast.error(error.message || "Failed to add user");
    }
  };

  const handleSubmitUserRole = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        toast.error("Authentication required");
        window.location.href = '/';
        return;
      }

      if (!formRoleData.role_name.trim()) {
        toast.error("Role Name is mandatory. Please enter a role name.");
        return;
      }

      const roleDataToSend = {
        role_id: lastRoleId, // Use the auto-generated ID
        role_name: formRoleData.role_name,
        role_parent: formRoleData.role_parent || 0, // Default to 0 if no parent
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        role_active: 1, // Set as active by default
        role_is_del: 0, // Set as not deleted by default
      };

      console.log("Role Data to Send:", roleDataToSend);

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/role_form.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(roleDataToSend),
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      const result = await response.json();
      console.log("Server Response:", result);
      
      if (result.success) {
        toast.success(result.message);
        fetchData(); // Refresh role list
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
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        window.location.href = '/';
        return;
      }
      // Toggle between 1 (active) and 0 (inactive)
      const newStatus = user.u_active === 1 ? 0 : 1;
      const confirmationMessage = newStatus === 0
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
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: user.u_id,
              u_active: newStatus,
            }),
          }
        );
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }
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
          fetchData1(); // Refresh user list
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
      // Find the role ID from data array
      const currentRole = data.find(role => role.role_name === editedUser?.role_name);
      
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
        profile_image: editedUser?.u_pro_img || null,
        cv: editedUser?.u_cv,
        role_id: currentRole ? currentRole.role_id : null
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
      toast.error(
        "Something went wrong while updating the user. Please try again!"
      );
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
      cvName: "",
      cvSize: 0,
      active: true,
      isDeleted: false,
      is_logged_out: false,
      created_at: "",
      updated_at: "",
    });
    setSelectedRole(null);
    setFormErrors({});
    setSubmitError("");
    setImageUri(null);
  };

  const resetFormRole = () => {
    setFormRoleData({
      role_id: 0,
      role_name: "",
      role_parent: 0,
      created_at: "",
      updated_at: "",
      role_active: 1,
      role_is_del: 0,
    });
  };

  const ITEMS_PER_PAGE = 10;
  const filteredRoles = data.filter((role) =>
    role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoles.length / ITEMS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRoles = filteredRoles.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const filteredUsers = Object.values(MOCK_USERS).filter((user) => {
    const searchLower = searchQuery.toLowerCase();

    // Inactive toggle: show only inactive users
    if (showInactiveOnly) {
      if (user.u_active !== 0) return false;
    } else if (activeTab === "all") {
      // In All tab, show only active users
      if (user.u_active !== 1) return false;
    } else if (activeTab === "categories" && selectedRole) {
      // In categories tab, filter by role
      if (user.role_name !== selectedRole) return false;
    }

    // Search filter
    return (
      (user.user && user.user.toLowerCase().includes(searchLower)) ||
      (user.u_mob && user.u_mob.toLowerCase().includes(searchLower)) ||
      (user.u_email && user.u_email.toLowerCase().includes(searchLower))
    );
  });

  const totalFilteredPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedFilteredUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleViewProfile = (user) => {
    console.log("Opening profile for user:", user); // Debug log
    setEditedUser(user);
    setShowUserProfile(true);
    setIsEditing(false);
  };

  const handleRoleChange = async (roleId) => {
    try {
      if (!editedUser?.u_id || !roleId) {
        throw new Error('Missing user ID or role ID');
      }

      // Find the role from data array
      const selectedRole = data.find(role => 
        role.role_id.toString() === roleId || role.role_name === roleId
      );
      
      if (!selectedRole) {
        console.log('Available roles:', data);
        console.log('Attempted role ID:', roleId);
        throw new Error('Invalid role selected');
      }

      // Update the local state with the new role
      setEditedUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          role_name: selectedRole.role_name
        };
      });
      
      toast.success('User role updated successfully!');
      setShowUserRoleModal(false);

    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'An unknown error occurred');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Download handler for dropdown
  const handleDownloadFiltered = async (filter) => {
    setDownloadDropdownOpen(false);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        window.location.href = '/';
        return;
      }
      const loadingToast = toast.loading("Generating user report...");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/filtered_user_report_download.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ filter })
        }
      );
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === "success" && result.file) {
        const blob = new Blob([atob(result.file)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.file_name || "user_report.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss(loadingToast);
        toast.success("User report downloaded successfully!");
      } else {
        throw new Error(result.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error(error.message || "Failed to download user report");
    }
  };

  // Dynamic header title and count
  let headerTitle = "Users";
  let headerCount = 0;
  if (showInactiveOnly) {
    headerTitle = "Inactive Users";
    headerCount = filteredUsers.length;
  } else if (activeTab === "categories") {
    if (selectedRole) {
      headerTitle = `Users in ${selectedRole}`;
      headerCount = filteredUsers.length;
    } else {
      headerTitle = "User Roles";
      headerCount = filteredRoles.length;
    }
  } else if (activeTab === "all") {
    headerTitle = "All Active Users";
    headerCount = filteredUsers.length;
  }

  const handleEditRole = async (roleId) => {
    setRoleDetailsLoading(true);
    setRoleDetailsError(null);
    setShowEditRoleModal(true);
    setEditingRole(roleId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/role_api.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ role_id: roleId }),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch role details");
      const result = await response.json();
      // Defensive: ensure all fields are present and not undefined
      const d = result.data || {};
      setRoleDetails({
        role_id: d.role_id ?? 0,
        role_name: d.role_name ?? "",
        role_active: typeof d.role_active !== "undefined" ? d.role_active : "1",
        created_at: d.created_at ?? "",
        updated_at: d.updated_at ?? "",
        total_expense_amount: typeof d.total_expense_amount !== "undefined" && d.total_expense_amount !== null ? d.total_expense_amount : "",
      });
    } catch (err) {
      setRoleDetailsError(err.message || "Error fetching role details");
    } finally {
      setRoleDetailsLoading(false);
    }
  };

  const handleSaveRoleDetails = async () => {
    setRoleDetailsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/role_expense_api.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(roleDetails),
        }
      );
      if (!response.ok) throw new Error("Failed to update role details");
      const result = await response.json();
      if (result.success) {
        toast.success("Role updated successfully!");
        setShowEditRoleModal(false);
        setEditingRole(null);
        setRoleDetails(null);
        fetchData(); // Refresh roles list
      } else {
        toast.error(result.message || "Failed to update role");
      }
    } catch (err) {
      toast.error(err.message || "Error updating role");
    } finally {
      setRoleDetailsSaving(false);
    }
  };

  // Helper to get token
  const token = localStorage.getItem("authToken");

  // Fetch capping amount when User Profile modal opens
  useEffect(() => {
    if (showUserProfile && editedUser?.u_id) {
      setUserCappingLoading(true);
      setUserCappingError(null);
      const token = localStorage.getItem("authToken");
      fetch("https://demo-expense.geomaticxevs.in/ET-api/capping_amount_api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ u_id: editedUser.u_id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setUserCapping(data.data.total_expense_amount);
            setUserCappingEdit(data.data.total_expense_amount);
          } else {
            setUserCapping(null);
            setUserCappingEdit("");
          }
        })
        .catch(err => {
          console.error("Capping API error:", err);
          setUserCappingError("Failed to fetch capping amount");
          setUserCapping(null);
          setUserCappingEdit("");
        })
        .finally(() => setUserCappingLoading(false));
    }
  }, [showUserProfile, editedUser?.u_id]);

  const fetchCappingAmount = () => {
    if (!editedUser?.u_id) return;
    setUserCappingLoading(true);
    setUserCappingError(null);
    fetch("https://demo-expense.geomaticxevs.in/ET-api/capping_amount_api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ u_id: editedUser.u_id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUserCapping(data.data.total_expense_amount);
          setUserCappingEdit(data.data.total_expense_amount);
        } else {
          setUserCapping(null);
          setUserCappingEdit("");
        }
      })
      .catch(err => {
        console.error("Capping API error:", err);
        setUserCappingError("Failed to fetch capping amount");
        setUserCapping(null);
        setUserCappingEdit("");
      })
      .finally(() => setUserCappingLoading(false));
  };

  // Handler to save capping amount
  const handleSaveCapping = async () => {
    if (!editedUser?.u_id) return;
    setUserCappingSaving(true);
    setUserCappingError(null);
    try {
      const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/user_expense_amount_change_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          u_id: editedUser.u_id,
          total_expense_amount: parseFloat(userCappingEdit) || 0
        })
      });
      const result = await response.json();
      if (result.success) {
        setUserCapping(userCappingEdit);
        toast.success("Capping amount updated!");
        // Optionally re-fetch to ensure fresh data
        // await fetchCappingAmount();
      } else {
        setUserCappingError(result.message || "Failed to update capping amount");
        toast.error(result.message || "Failed to update capping amount!");
      }
    } catch (err) {
      setUserCappingError("Failed to update capping amount");
      toast.error("Failed to update capping amount!");
    } finally {
      setUserCappingSaving(false);
    }
  };

  if (showUserProfile && editedUser) {
    return (
      <div className="profile-page-container">
        <div className="profile-page-header">
          <button
            className="back-button"
            onClick={() => {
              setShowUserProfile(false);
              setIsEditing(false);
              setEditedUser(null);
            }}
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className="profile-page-title">User Profile</h2>
          <button
            className="edit-button"
            onClick={async () => {
              if (isEditing) {
                await handleSaveCapping();
                handleSave(editedUser.u_id);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
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
        <div className="profile-table-section-content">
          {/* Personal Information */}
          <h3 className="profile-section-heading">Personal Information</h3>
          <div className="profile-personal-container">
            <div className="profile-personal-info-container">
              <div className="profile-personal-info-item"><strong>First Name: </strong> {isEditing ? (<input type="text" value={editedUser.u_fname} onChange={e => setEditedUser({ ...editedUser, u_fname: e.target.value })} />) : editedUser.u_fname}</div>
              <div className="profile-personal-info-item"><strong>Middle Name: </strong> {isEditing ? (<input type="text" value={editedUser.u_mname} onChange={e => setEditedUser({ ...editedUser, u_mname: e.target.value })} />) : editedUser.u_mname}</div>
              <div className="profile-personal-info-item"><strong>Last Name: </strong> {isEditing ? (<input type="text" value={editedUser.u_lname} onChange={e => setEditedUser({ ...editedUser, u_lname: e.target.value })} />) : editedUser.u_lname}</div>
              <div className="profile-personal-info-item"><strong>Email: </strong> {isEditing ? (<input type="email" value={editedUser.u_email} onChange={e => setEditedUser({ ...editedUser, u_email: e.target.value })} />) : editedUser.u_email}</div>
            </div>
            <div className="profile-image-outer">
              <div className="profile-image-container">
                <img
                  src={imageUri || editedUser.u_pro_img || defaultAvatar}
                  alt="Profile"
                  className="profile-image"
                />
                {isEditing && (
                  <div className="profile-image-actions-container">
                    {(imageUri || editedUser.u_pro_img) && (
                      <button
                        className="image-action-button remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUri(null);
                          setEditedUser({
                            ...editedUser,
                            u_pro_img: null
                          });
                        }}
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  id="editProfileImage"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUri(reader.result);
                        setEditedUser({
                          ...editedUser,
                          u_pro_img: reader.result
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: "none" }}
                />
              </div>
              {isEditing && (
                <button
                  className="image-action-button update"
                  onClick={() =>
                    document.getElementById("editProfileImage").click()
                  }
                >
                  <Upload size={16} />
                  Update
                </button>
              )}
            </div>
          </div>

          {/* Organization Details */}
          <h3 className="profile-section-heading">Organization Details</h3>
          <div className="profile-organization-container">
            <div><strong>Organization: </strong> {isEditing ? (<input type="text" value={editedUser.u_organization} onChange={e => setEditedUser({ ...editedUser, u_organization: e.target.value })} />) :<span style={{fontSize: '1rem'}}>{ editedUser.u_organization}</span>}</div>
            <div><strong>Role: </strong> {isEditing ? (
              <div className="role-select-input" onClick={() => setShowUserRoleModal(true)}>
                <span>{editedUser.role_name}</span>
                <Edit2 size={9} />
              </div>
            ) : (
              <span style={{fontSize: '1rem'}}>{editedUser.role_name}</span>
            )}</div>
          </div>

          {/* Location */}
          <h3 className="profile-section-heading">Location</h3>
          <div className="profile-location-container">
            <div><strong>City: </strong> {isEditing ? (<input type="text" value={editedUser.u_city} onChange={e => setEditedUser({ ...editedUser, u_city: e.target.value })} />) : editedUser.u_city}</div>
            <div><strong>State: </strong> {isEditing ? (<input type="text" value={editedUser.u_state} onChange={e => setEditedUser({ ...editedUser, u_state: e.target.value })} />) : editedUser.u_state}</div>
            <div><strong>Country: </strong> {isEditing ? (<input type="text" value={editedUser.u_country} onChange={e => setEditedUser({ ...editedUser, u_country: e.target.value })} />) : editedUser.u_country}</div>
          </div>

          {/* Documents */}
          <h3 className="profile-section-heading">Documents</h3>
          <div className="profile-documents-container">
            <div>
              <strong>CV/Resume: </strong>
              {editedUser.u_cv ? (
                <div className="document-container">
                  <span className="document-text">
                    {editedUser.u_cv.split("/").pop()}
                  </span>
                  <button className="view-button">View</button>
                </div>
              ) : (
                <span style={{fontSize: '1rem'}}>No document uploaded </span>
              )}
              {isEditing && (
                <button
                  className="upload-document-button"
                  onClick={() =>
                    document.getElementById("editCVFile").click()
                  }
                >
                  <Upload size={16} />
                  <span style={{fontSize: '1rem', marginLeft: '.1rem', padding: '.5rem'}}>
                    {editedUser.u_cv ? " Update CV" : " Upload CV"}
                  </span>
                </button>
              )}
              <input
                type="file"
                id="editCVFile"
                accept=".pdf"
                onChange={handleCVUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Capping Amount */}
          <h3 className="profile-section-heading">Capping Amount</h3>
          <div className="profile-capping-container">
            <strong>Capping: </strong>{" "}
            {userCappingLoading ? (
              <span>Loading... </span>
            ) : userCappingError ? (
              <span className="error-message">{userCappingError}</span>
            ) : isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={userCappingEdit ?? ""}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (e.target.value === "" || ( !isNaN(val) && val >= 0 && val <= 100000 )) {
                      setUserCappingEdit(e.target.value);
                    }
                  }}
                  style={{ width: '120px' }}
                />
              </div>
            ) : (
              <span>{userCapping !== null && userCapping !== undefined ? userCapping : 'Not set'}</span>
            )}
          </div>

          {/* Additional Information */}
          <h3 className="profile-section-heading">Additional Information</h3>
          <div className="profile-additional-container">
            <div>
              <strong>Created At: </strong>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="the-header">
        <h1 className="header-title">{headerTitle} :-<span className="header-count">({headerCount})</span></h1>
        <button 
          className="add-button" 
          onClick={() => activeTab === "categories" ? setShowAddUserRole(true) : setShowAddUser(true)}
        >
          <Plus size={20} />
          <span>{activeTab === "categories" ? "Add Role" : "Add User"}</span>
        </button>
      </div>

      <div className="user-search-container">
        <Search size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {canDownload && (
          <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
            <button
              className="download-button"
              onClick={() => setDownloadDropdownOpen((open) => !open)}
              title="Download User Report"
              type="button"
            >
              <Download size={20}/>Download
            </button>
            {downloadDropdownOpen && (
              <div className="download-dropdown-menu">
                <button className="download-button" onClick={() => handleDownloadFiltered('all')}>Download All Users</button>
                <button className="download-button" onClick={() => handleDownloadFiltered('present')}>Download Present Users</button>
                <button className="download-button" onClick={() => handleDownloadFiltered('absent')}>Download Absent Users</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setSelectedRole(null);
            setShowInactiveOnly(false);
          }}
        >
          All Active users
        </button>
        <button
          className={`tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("categories");
            setShowInactiveOnly(false);
          }}
        >
          Categories
        </button>
        <button
          className={`tab ${showInactiveOnly ? "active" : ""}`}
          onClick={() => {
            setShowInactiveOnly((prev) => !prev);
            setActiveTab("all");
            setSelectedRole(null);
          }}
        >
          Inactive
        </button>
      </div>

      {activeTab === "all" ? (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr className="user-th">
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
                        className={`status-badge1 ${user.is_logged_out === 0 ? "active" : "inactive"}`}
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
                          title="Edit user's status"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(user);
                          }}
                          title="Active / Inactive"
                        >
                          {user.u_active === 1 ? (
                            <LockOpen size={16} color="#22c55e" />
                          ) : (
                            <Lock size={16} color="#ef4444" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-text">
              Showing <strong>{startIndex + 1}</strong> to{" "}
              <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</strong> of{" "}
              <strong>{filteredUsers.length}</strong> entries
            </div>
            <div className="pagination-controls">
              <button
                className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="page-numbers">
                <span className="current-page">{currentPage}</span>
                <span className="total-pages">of {totalFilteredPages}</span>
              </div>
              <button
                className={`page-button ${
                  currentPage === totalFilteredPages ? "disabled" : ""
                }`}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))
                }
                disabled={currentPage === totalFilteredPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {selectedRole ? (
            <div className="categories-header">
              <div className="header-content">
                <button
                  className="back-button"
                  onClick={() => setSelectedRole(null)}
                >
                  <ArrowLeft size={20} />
                  <span>Back to Roles</span>
                </button>
              </div>
              <div className="user-search-container">
                <Search size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {canDownload && (
                  <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
                    <button
                      className="download-button"
                      onClick={() => setDownloadDropdownOpen((open) => !open)}
                      title="Download User Report"
                      type="button"
                    >
                      <Download size={20} />
                    </button>
                    {downloadDropdownOpen && (
                      <div className="download-dropdown-menu">
                        <button onClick={() => handleDownloadFiltered('all')}>Download All Users</button>
                        <button onClick={() => handleDownloadFiltered('present')}>Download Present Users</button>
                        <button onClick={() => handleDownloadFiltered('absent')}>Download Absent Users</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr className="user-th">
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
                            className={`status-badge1 ${user.is_logged_out === 0 ? "active" : "inactive"}`}
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
                              title="Edit user's status"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserStatus(user);
                              }}
                              title="Active / Inactive"
                            >
                              {user.u_active === 1 ? (
                                <LockOpen size={16} color="#22c55e" />
                              ) : (
                                <Lock size={16} color="#ef4444" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-text">
                  Showing <strong>{startIndex + 1}</strong> to{" "}
                  <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</strong> of{" "}
                  <strong>{filteredUsers.length}</strong> entries
                </div>
                <div className="pagination-controls">
                  <button
                    className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="page-numbers">
                    <span className="current-page">{currentPage}</span>
                    <span className="total-pages">of {totalFilteredPages}</span>
                  </div>
                  <button
                    className={`page-button ${
                      currentPage === totalFilteredPages ? "disabled" : ""
                    }`}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalFilteredPages, p + 1))
                    }
                    disabled={currentPage === totalFilteredPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>USER ROLE</th>
                      <th>TOTAL COUNT</th>
                      <th>Edit</th>
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
                        <td>
                          <button
                            className="action-button"
                            onClick={e => {
                              e.stopPropagation();
                              handleEditRole(role.role_id);
                            }}
                            title="Edit Role"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-text">
                  Showing <strong>{startIndex + 1}</strong> to{" "}
                  <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredRoles.length)}</strong> of{" "}
                  <strong>{filteredRoles.length}</strong> entries
                </div>
                <div className="pagination-controls">
                  <button
                    className={`page-button ${currentPage === 1 ? "disabled" : ""}`}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="page-numbers">
                    <span className="current-page">{currentPage}</span>
                    <span className="total-pages">of {totalPages}</span>
                  </div>
                  <button
                    className={`page-button ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
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

            <div className="modal-scrollable">
              <div className="form-container">
                <div className="form-section">
                  <h3 className="section-title">Profile Details</h3>

                  <div
                    className="profile-upload-container"
                    onClick={() =>
                      document.getElementById("profileImage").click()
                    }
                  >
                    {imageUri ? (
                      <>
                        <img
                          src={imageUri}
                          alt="Profile Preview"
                          className="profile-image-preview"
                        />
                        <div className="profile-upload-overlay">
                          <Upload size={24} />
                          <span className="profile-upload-text">
                            Change Photo
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="profile-upload-placeholder">
                        <Upload size={32} />
                        <span className="profile-upload-placeholder-text">
                          Upload Profile Photo
                        </span>
                      </div>
                    )}
                    {imageUri && (
                      <div
                        className="profile-image-actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUri(null);
                          setFormData((prev) => ({
                            ...prev,
                            profileImage: null,
                          }));
                        }}
                      >
                        <X size={16} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />

                  <div
                    className={`form-group ${formErrors.userId ? "error" : ""}`}
                  >
                    <label className="required-field">User ID</label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => {
                        setFormData({ ...formData, userId: e.target.value });
                        setFormErrors({ ...formErrors, userId: "" });
                      }}
                      placeholder="Enter user ID"
                    />
                    {formErrors.userId && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.userId}
                      </div>
                    )}
                  </div>

                  <div className={`form-group ${formErrors.firstName ? "error" : ""}`}>
                    <label className="required-field">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        setFormErrors({ ...formErrors, firstName: "" });
                      }}
                      placeholder="Enter first name"
                    />
                    {formErrors.firstName && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.firstName}
                      </div>
                    )}
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

                  <div className={`form-group ${formErrors.lastName ? "error" : ""}`}>
                    <label className="required-field">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        setFormErrors({ ...formErrors, lastName: "" });
                      }}
                      placeholder="Enter last name"
                    />
                    {formErrors.lastName && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.lastName}
                      </div>
                    )}
                  </div>

                  <div className={`form-group ${formErrors.email ? "error" : ""}`}>
                    <label className="required-field">Email</label>
                    <div className="email-input-container">
                      <Mail size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setFormErrors({ ...formErrors, email: "" });
                        }}
                        placeholder="Enter email address"
                      />
                    </div>
                    {formErrors.email && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.email}
                      </div>
                    )}
                  </div>

                  <div className={`form-group ${formErrors.mobile ? "error" : ""}`}>
                    <label className="required-field">Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => {
                        setFormData({ ...formData, mobile: e.target.value });
                        setFormErrors({ ...formErrors, mobile: "" });
                      }}
                      placeholder="Enter mobile number"
                    />
                    {formErrors.mobile && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.mobile}
                      </div>
                    )}
                  </div>

                  <div className={`form-group ${formErrors.password ? "error" : ""}`}>
                    <label className="required-field">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setFormErrors({ ...formErrors, password: "" });
                      }}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.password}
                      </div>
                    )}
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

                  <div className="form-group">
                    <label>CV/Resume</label>
                    <div
                      className="cv-upload-container"
                      onClick={() => document.getElementById("cvFile").click()}
                    >
                      <div className="cv-upload-icon">
                        <Upload size={24} />
                      </div>
                      <h3 className="cv-upload-text">
                        {formData.cv ? "Update CV" : "Upload your CV"}
                      </h3>
                      <p className="cv-upload-subtext">PDF format up to 10MB</p>

                      {formData.cv && (
                        <div className="cv-file-info">
                          <FileText className="cv-file-icon" size={24} />
                          <div className="cv-file-details">
                            <div className="cv-file-name">
                              {formData.cvName || "Document.pdf"}
                            </div>
                            <div className="cv-file-size">
                              {formatFileSize(formData.cvSize)}
                            </div>
                          </div>
                          <div className="cv-file-actions">
                            <button
                              className="cv-action-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add preview functionality here if needed
                              }}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="cv-action-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({
                                  ...prev,
                                  cv: "",
                                  cvName: "",
                                  cvSize: 0,
                                }));
                              }}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="cvFile"
                      accept=".pdf"
                      onChange={handleCVUpload}
                      style={{ display: "none" }}
                    />
                  </div>
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

                  <div className={`form-group ${formErrors.role ? "error" : ""}`}>
                    <label className="required-field">Role</label>
                    <Select
                      options={data.map((role) => ({
                        value: role.role_name,
                        label: role.role_name,
                      }))}
                      value={
                        selectedRole
                          ? { value: selectedRole, label: selectedRole }
                          : null
                      }
                      onChange={(option) => {
                        setSelectedRole(option ? option.value : null);
                        setFormErrors({ ...formErrors, role: "" });
                      }}
                      placeholder="Select Role"
                      className={formErrors.role ? "select-error" : ""}
                    />
                    {formErrors.role && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {formErrors.role}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Street Address</label>
                    <textarea
                      value={formData.streetAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          streetAddress: e.target.value,
                        })
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
                      value={moment().format("YYYY-MM-DD HH:mm:ss")}
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

                {submitError && (
                  <div className="form-submit-error">
                    <AlertCircle size={18} />
                    {submitError}
                  </div>
                )}

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

            <div className="modal-scrollable">
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
                        placeholder="Auto-Generated ID"
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
                        placeholder="Created At"
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
                    className="submit-button"
                    onClick={handleSubmitUserRole}
                  >
                    Add User Role
                  </button>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showUserRoleModal && (
        <div className="modal-overlay">
          <div className="modal role-selection-modal">
            <div className="modal-header">
              <h2 className="modal-title">Select Role</h2>
              <button
                className="close-button"
                onClick={() => setShowUserRoleModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-scrollable modal-content">
              {/* Search Bar */}
              <div className="search-container">
                <Search size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search roles..."
                  value={userRoleSearch}
                  onChange={(e) => setUserRoleSearch(e.target.value)}
                />
                {userRoleSearch.length > 0 && (
                  <button
                    className="clear-search-button"
                    onClick={() => setUserRoleSearch("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Role List */}
              <div className="role-list">
                {data
                  .filter((role) =>
                    role.role_name.toLowerCase().includes(userRoleSearch.toLowerCase())
                  )
                  .map((role) => (
                    <div
                      key={role.role_id}
                      className={`role-item ${
                        editedUser?.role_name === role.role_name ? "selected" : ""
                      }`}
                      onClick={() => {
                        if (editedUser && editedUser.u_id) {
                          handleRoleChange(role.role_id.toString());
                        }
                      }}
                    >
                      <span className="role-text">{role.role_name}</span>
                      {editedUser?.role_name === role.role_name && (
                        <Check size={16} className="check-icon" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && roleDetails && typeof roleDetails.total_expense_amount !== 'undefined' && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <button
                className="back-button"
                onClick={() => {
                  setShowEditRoleModal(false);
                  setEditingRole(null);
                  setRoleDetails(null);
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="modal-title">Edit Role</h2>
            </div>
            <div className="modal-scrollable">
              <div className="profile-table-section-content">
                <h3 className="profile-section-heading">Edit Role Details</h3>
                {/* Full-page loader overlay */}
                {roleDetailsLoading && (
                  <div className="modal-fullpage-loader">
                    <span className="loader-large" />
                    <div style={{marginTop: '1em', fontSize: '1.2em', color: '#333'}}>Loading role details...</div>
                  </div>
                )}
                {!roleDetailsLoading && (
                  <>
                    <div className="profile-personal-info-item" style={{marginBottom: '1rem'}}>
                      <strong>Role id</strong>
                      <input
                        type="text"
                        value={roleDetails.role_id ?? ""}
                        readOnly
                        style={{width: '100%'}}
                      />
                    </div>
                    <div className="profile-personal-info-item" style={{marginBottom: '1rem'}}>
                      <strong>Role name</strong>
                      <input
                        type="text"
                        value={roleDetails.role_name ?? ""}
                        onChange={e =>
                          setRoleDetails({ ...roleDetails, role_name: e.target.value })
                        }
                        style={{width: '100%'}}
                      />
                    </div>
                    <div className="profile-personal-info-item" style={{ marginBottom: '1.5rem' }}>
                        <label 
                          htmlFor="active-status" 
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '600',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}
                        >
                          Active Status
                        </label>
                        <select
                          id="active-status"
                          value={roleDetails.role_active ?? ""}
                          onChange={e => setRoleDetails({ ...roleDetails, role_active: e.target.value })}
                          style={{
                            width: '76%',
                            padding: '0.75rem',
                            marginLeft: '1rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fff',
                            fontSize: '0.9rem',
                            color: '#333',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            outline: 'none'
                          }}
                        >
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      </div>
                    <div className="profile-personal-info-item" style={{marginBottom: '1rem'}}>
                      <strong>Created at</strong>
                      <input
                        type="text"
                        value={roleDetails.created_at ?? ""}
                        readOnly
                        style={{width: '100%'}}
                      />
                    </div>
                    <div className="profile-personal-info-item" style={{marginBottom: '1rem'}}>
                      <strong>Updated at</strong>
                      <input
                        type="text"
                        value={roleDetails.updated_at ?? ""}
                        onChange={e =>
                          setRoleDetails({ ...roleDetails, updated_at: e.target.value })
                        }
                        style={{width: '100%'}}
                      />
                    </div>
                    <div className="profile-personal-info-item" style={{marginBottom: '1rem'}}>
                      <strong>Capping Amount</strong>
                      <input
                        type="number"
                        value={
                          typeof roleDetails.total_expense_amount === "number" || typeof roleDetails.total_expense_amount === "string"
                            ? roleDetails.total_expense_amount
                            : ""
                        }
                        onChange={e =>
                          setRoleDetails({ ...roleDetails, total_expense_amount: e.target.value })
                        }
                        style={{width: '100%'}}
                      />
                    </div>
                  </>
                )}
                <div className="role-button-container">
                  <button
                    className="submit-button"
                    onClick={handleSaveRoleDetails}
                    disabled={roleDetailsSaving || roleDetailsLoading}
                  >
                    {roleDetailsSaving ? (
                      <span className="loader loader-inline" style={{marginRight: '8px'}} />
                    ) : null}
                    {roleDetailsSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowEditRoleModal(false);
                      setEditingRole(null);
                      setRoleDetails(null);
                    }}
                    disabled={roleDetailsSaving || roleDetailsLoading}
                  >
                    Cancel
                  </button>
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
