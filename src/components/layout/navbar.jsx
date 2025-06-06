import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

const NAV_ACCESS = {
  dashboard: "all",
  users: [1, 2, 3, 4, 8],
  analytics: {
    useranalytics: "all",
    adminanalytics: [1, 2, 3, 4, 8],
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
        {(hasAccess("analytics/useranalytics") ||
          hasAccess("analytics/adminanalytics")) && (
          <Link to="/analytics/useranalytics" className="navbar-item">
            Analytics
          </Link>
        )}
        {hasAccess("holidays") && (
          <Link to="/team" className="navbar-item">
            Holidays
          </Link>
        )}
      </div>

      <div className="navbar-right">
        <div className="notification-container">
          {/* <button
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button> */}

          {showNotifications && (
            <div className="notification-dropdown">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-content">
                    {notification.message}
                  </div>
                  <div className="notification-time">{notification.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

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
