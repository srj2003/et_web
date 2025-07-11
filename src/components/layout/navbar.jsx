import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const profileDropdownRef = useRef(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const breakTimerRef = useRef(null);
  const [showBreakNote, setShowBreakNote] = useState(false);

  // Add state for sidebar visibility
  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userid");
        const token = localStorage.getItem("authToken");
        const storedRoleId = localStorage.getItem("roleId");

        if (!userId || !token) {
          window.location.href = "/";
          return;
        }

        setRoleId(parseInt(storedRoleId));

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId }),
          }
        );

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }

        const result = await response.json();
        if (result.status === "success") {
          const roleResponse = await fetch(
            "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ user_id: parseInt(userId, 10) }),
            }
          );

          if (roleResponse.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            return;
          }

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

  useEffect(() => {
    if (!showProfileDropdown) return;
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        !event.target.classList.contains("profile-button")
      ) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

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

  const handleLogout = async () => {
    const userId = localStorage.getItem("userid");
    const authToken = localStorage.getItem("authToken");
    try {
      await fetch("https://demo-expense.geomaticxevs.in/ET-api/logout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, authToken })
      });
    } catch (err) {
      alert("Can not logout.");
    }
    localStorage.removeItem("userid");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("roleId");
    localStorage.removeItem("currentLoginTime");
    alert("You have been logged out. Please login again.");
    window.location.href = "/";
  };

  // Format seconds to HH:MM:SS
  const formatBreakTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Check if user is on break (same as dashboard.jsx)
  useEffect(() => {
    const checkUserOnBreak = async () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userid');
      if (!token || !userId) return;
      try {
        const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/break_check.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: parseInt(userId, 10) }),
        });
        const data = await response.json();
        if (data.status === 'success' && data.user_on_break) {
          setIsOnBreak(true);
          setBreakStartTime(new Date()); // Optionally, fetch actual break start time if available
          setBreakSeconds(0);
        } else {
          setIsOnBreak(false);
          setBreakStartTime(null);
          setBreakSeconds(0);
        }
      } catch (err) {
        setIsOnBreak(false);
      }
    };
    checkUserOnBreak();
  }, []);

  // Timer effect for break
  useEffect(() => {
    if (isOnBreak) {
      breakTimerRef.current = setInterval(() => {
        setBreakSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    }
    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    };
  }, [isOnBreak]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>
        <div className="navbar-links">
          {hasAccess("dashboard") && (
            <Link to="/dashboard" className={`navbar-item${location.pathname.startsWith('/dashboard') ? ' active' : ''}`}>
              Dashboard
            </Link>
          )}
          {hasAccess("users") && (
            <Link to="/users" className={`navbar-item${location.pathname.startsWith('/users') ? ' active' : ''}`}>
              Users
            </Link>
          )}
          <Link to="/analytics/useranalytics" className={`navbar-item${location.pathname.startsWith('/analytics') ? ' active' : ''}`}>
            Analytics
          </Link>
          {hasAccess("holidays") && (
            <Link to="/holiday" className={`navbar-item${location.pathname.startsWith('/holiday') ? ' active' : ''}`}>
              Holidays
            </Link>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {/* BREAK TIMER BUBBLE */}
        {isOnBreak && (
          <div className="break-timer-navbar" style={{ position: 'relative' }}>
            <span
              className="break-timer-label"
              onMouseEnter={() => setShowBreakNote(true)}
              onMouseLeave={() => setShowBreakNote(false)}
              style={{ cursor: 'pointer' }}
            >
              Your are currently on Break!
            </span>
            {showBreakNote && (
              <div className="break-timer-note-tooltip" style={{fontSize:"0.9rem", color:"red"}}>
                <div style={{width:"0.9rem"}}>Your break is active. Work done now won’t be counted. Go to the Dashboard to stop the break.</div>
              </div>
            )}
            {/* <img
              src={userData?.u_pro_img || "/assets/images/default_profile.png"}
              alt="Profile"
              className="break-timer-profile-img"
            /> */}
          </div>
        )}
        <div className="profile-container">
          <button
            className="profile-button"
            onClick={() => setShowProfileDropdown((prev) => !prev)}
          >
            <img
              src={userData?.u_pro_img || "/assets/images/default_profile.png"}
              alt="Profile"
              className="profile-image"
            />
          </button>

          {showProfileDropdown && (
            <div className={`profile-dropdown ${showProfileDropdown ? 'show' : ''}`}
             ref={profileDropdownRef}>
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
                <Link to="/help" className="profile-action-link">
                  Help
                </Link>
                <button onClick={handleLogout} className="profile-action-link" style={{color:'#ef4444'}}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;