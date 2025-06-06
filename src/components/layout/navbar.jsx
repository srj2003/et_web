import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import "./navbar.css";

const NAV_ACCESS = {
  dashboard: "all",
  users: [1, 2, 3, 4, 8],
  analytics: {
    useranalytics: "all",
    adminanalytics: "all",
  },
  holidays: "all",
};

const Navbar = () => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleId, setRoleId] = useState(null);

  // Add state for sidebar visibility
  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userid");
        const storedRoleId = localStorage.getItem("roleId");
        setRoleId(parseInt(storedRoleId));

        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          }
        );

        const result = await response.json();
        if (result.status === "success") {
          const roleResponse = await fetch(
            "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ user_id: parseInt(userId, 10) }),
            }
          );

          const roleResult = await roleResponse.json();

          setUserData({
            ...result.data,
            userid: userId,
            role_name: roleResult.role_name || "No role assigned",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const notifications = [
    {
      id: 1,
      message: "New expense request from John Doe",
      time: "5 minutes ago",
    },
    {
      id: 2,
      message: "Your expense has been approved",
      time: "1 hour ago",
    },
  ];

  const hasAccess = (path) => {
    const access = NAV_ACCESS[path];
    if (access === "all") return true;
    if (Array.isArray(access)) return access.includes(roleId);
    if (typeof access === "object") {
      // For nested paths like analytics
      const subPath = path.split("/")[1];
      return (
        access[subPath] === "all" ||
        (Array.isArray(access[subPath]) && access[subPath].includes(roleId))
      );
    }
    return false;
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        {hasAccess("dashboard") && (
          <Link to="/dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        {hasAccess("users") && (
          <Link to="/users" className="navbar-item">
            Users
          </Link>
        )}
        {/* Always show Analytics since useranalytics is set to "all" */}
        <Link to="/analytics/useranalytics" className="navbar-item">
          Analytics
        </Link>
        {hasAccess("holidays") && (
          <Link to="/holiday" className="navbar-item">
            Holidays
          </Link>
        )}
      </div>

      <div className="navbar-right">
        

        <div className="profile-container">
          <button
            className="profile-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <img
              src={userData?.u_pro_img || "/assets/images/default_profile.png"}
              alt="Profile"
              className="profile-image"
            />
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <img
                  src={
                    userData?.u_pro_img || "/assets/images/default_profile.png"
                  }
                  alt="Profile"
                  className="dropdown-profile-image"
                />
                <div className="profile-details">
                  <p className="profile-name">
                    {userData
                      ? `${userData.u_fname} ${userData.u_lname}`
                      : "User"}
                  </p>
                  <p className="profile-role">
                    {userData?.role_name || "Loading..."}
                  </p>
                </div>
              </div>
              <div className="profile-actions">
                <Link to="/profile" className="profile-action-link">
                  View Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;