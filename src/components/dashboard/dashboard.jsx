import React, { useState, useEffect, useCallback, useRef } from "react";
import "./dashboard.css";
import {
  Bell,
  Search,
  Users,
  Settings,
  LogOut,
  User,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  FileCheck,
  ClipboardList,
  RefreshCw,
  Wallet,
  Receipt,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
// import Calendar  from './calendar';// Add this import at the top

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-content">
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
    <div className={`icon-container ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);

const ActiveUserCard = ({ user }) => (
  <div className="active-user-card">
    <img src={user.avatar} alt={user.name} className="active-user-avatar" />
    <div className="active-user-info">
      <h4 className="active-user-name">{user.name}</h4>
      <p className="active-user-status">{user.status}</p>
    </div>
  </div>
);

const AttendanceDetails = ({ attendance }) => {
  const formatLocation = (latLongStr) => {
    if (!latLongStr) return "";
    const [lat, long] = latLongStr.split(",");
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(long).toFixed(6)}`;
  };

  return (
    <div className="attendance-details">
      <div className="attendance-card">
        <h3 className="attendance-card-title">Login Details</h3>
        <div className="attendance-row">
          <span className="attendance-label">Login Time:</span>
          <span className="attendance-value">
            {new Date(attendance?.login_timestamp || "").toLocaleTimeString()}
          </span>
        </div>
        <div className="attendance-row">
          <span className="attendance-label">Login Location:</span>
          <span className="attendance-value">
            {formatLocation(attendance?.login_lat_long)}
          </span>
        </div>
      </div>

      {attendance?.is_logged_out && (
        <div className="attendance-card">
          <h3 className="attendance-card-title">Logout Details</h3>
          <div className="attendance-row">
            <span className="attendance-label">Logout Time:</span>
            <span className="attendance-value">
              {new Date(
                attendance?.logout_timestamp || ""
              ).toLocaleTimeString()}
            </span>
          </div>
          <div className="attendance-row">
            <span className="attendance-label">Logout Location:</span>
            <span className="attendance-value">
              {formatLocation(attendance?.logout_lat_long)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const QuoteSection = ({ quote, loading }) => (
  <div className="quote-section">
    <div className="quote-content">
      {loading ? (
        <div className="loading-spinner"></div>
      ) : quote ? (
        <>
          <p className="quote-text">"{quote.quote}"</p>
          <p className="quote-author">- {quote.author}</p>
        </>
      ) : (
        <p className="error-text">Failed to load quote</p>
      )}
    </div>
  </div>
);

const FinancialCharts = ({ analytics }) => {
  // Prepare data from analytics
  const monthlyData = [
    {
      name: "Expenses",
      value: analytics?.monthly_analytics?.expense || 0,
      color: "#818cf8",
    },
    {
      name: "Expense Requests",
      value: analytics?.monthly_analytics?.expense_requests || 0,
      color: "#10b981",
    },
    {
      name: "Requisition Requests",
      value: analytics?.monthly_analytics?.requisition_requests || 0,
      color: "#f59e0b",
    },
  ];

  const cashFlowData = [
    {
      name: "Credit Amount",
      value: analytics?.cash_in_hand?.details?.credit_amount || 0,
      color: "#4338ca",
    },
    {
      name: "Debit Amount",
      value: analytics?.cash_in_hand?.details?.debit_amount || 0,
      color: "#ef4444",
    },
    {
      name: "Requisition Debit",
      value: analytics?.cash_in_hand?.details?.req_debit_amount || 0,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="charts-section">
      <h2 className="section-title">Financial Overview</h2>
      <div className="charts-grid">
        {/* Monthly Analytics Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Monthly Analytics</h3>
          <div className="chart-header">
            <div className="chart-legend">
              {monthlyData.map((item) => (
                <div key={item.name} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="legend-text">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="chart-tooltip">
                        <p className="tooltip-title">
                          {payload[0].payload.name}
                        </p>
                        <p className="tooltip-value">
                          ₹{payload[0].value.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Distribution Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Cash Flow Distribution</h3>
          <div className="chart-header">
            <div className="chart-legend">
              {cashFlowData.map((item) => (
                <div key={item.name} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cashFlowData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {cashFlowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="chart-tooltip">
                        <p className="tooltip-title">
                          {payload[0].payload.name}
                        </p>
                        <p className="tooltip-value">
                          ₹{payload[0].value.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default function DashboardWeb() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);

  const initialLoadDone = useRef(false);

  const notifications = [
    { id: "1", text: "New user registered" },
    { id: "2", text: "Order #1234 has been placed" },
    { id: "3", text: "Server maintenance scheduled" },
  ];

  const resetDashboardState = useCallback(() => {
    setIsLoggedIn(false);
    setShowNotifications(false);
    setShowProfile(false);
    setSearchQuery("");
    setLocation(null);
    setErrorMsg(null);
    setUserData(null);
    setLoading(true);
    setError(null);
    setIsLoggingIn(false);
    setIsLoggingOut(false);
    setUserCount(null);
    setTodayAttendance(null);
    setCheckingAttendance(true);
    setQuote(null);
    setLoadingQuote(true);
  }, []);

  const fetchQuote = async () => {
    try {
      if (!loadingQuote) {
        setLoadingQuote(true);
      }

      const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
        headers: {
          "X-Api-Key": "NclrlAIgpBUj9Whzx7lryA==T9eUEYNbjapuFWmA",
        },
      });

      if (!response.ok) {
        throw new Error("Quote fetch failed");
      }

      const data = await response.json();
      const allowedCategories = [
        "success",
        "morning",
        "money",
        "life",
        "learning",
        "leadership",
        "knowledge",
        "intelligence",
        "hope",
        "health",
        "god",
        "future",
        "faith",
        "experience",
        "education",
      ];

      const matchingQuote = data.find((quote) =>
        allowedCategories.includes(quote.category.toLowerCase())
      );

      if (matchingQuote) {
        setQuote(matchingQuote);
      } else {
        await fetchQuote();
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  const checkTodaysAttendance = async (userId) => {
    try {
      setCheckingAttendance(true);
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/check_login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result = await response.json();
      setTodayAttendance(result);

      if (result.has_login && !result.attendance?.is_logged_out) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userid");
      const storedRoleId = localStorage.getItem("roleId");
      setRoleId(storedRoleId);

      if (!userId) {
        setError("No user ID found");
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

        checkTodaysAttendance(userId);
      } else {
        setError(result.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCount = useCallback(async () => {
    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_count.php"
      );
      const result = await response.json();
      setUserCount(result.user_count);
    } catch (error) {
      console.error("Error fetching user count:", error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userid");
      if (!userId) return;

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/cash_calculator.php?user_id=${userId}&date=${formattedDate}`
      );

      const result = await response.json();
      console.log("Analytics API result:", result); // <-- Add this line

      if (result.status === 200) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, []);

  const fetchAttendanceStats = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userid");
      if (!userId) return;

      // Example endpoint, adjust as per your backend
      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/fetch_analytics.php?user_id=${userId}`
      );
      const result = await response.json();
      if (result.status === 200) {
        setAttendanceStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            });
          },
          (error) => {
            setErrorMsg("Permission to access location was denied");
          }
        );
      }

      await Promise.all([
        fetchUserData(),
        fetchUserCount(),
        fetchQuote(),
        fetchAnalytics(),
        fetchAttendanceStats(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    }
  }, [
    fetchUserData,
    fetchUserCount,
    fetchQuote,
    fetchAnalytics,
    fetchAttendanceStats,
  ]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      loadDashboardData();
      initialLoadDone.current = true;
    }
  }, [loadDashboardData]);

  const handleLogin = async () => {
    if (!location) {
      alert("Location not available. Please try again.");
      return;
    }

    if (!userData?.userid) {
      alert("User information not available.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const loginData = {
        user_id: parseInt(userData.userid),
        login_lat_long: `${location.coords.latitude},${location.coords.longitude}`,
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_attendance_login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("attn_id", result.attn_id.toString());
        setIsLoggedIn(true);
        checkTodaysAttendance(userData.userid);
        alert("Attendance logged successfully!");
      } else {
        alert(result.error || "Failed to log attendance");
      }
    } catch (error) {
      console.error("Error logging attendance:", error);
      alert("Failed to connect to server");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!location) {
      alert("Location not available. Please try again.");
      return;
    }

    if (!userData?.userid) {
      alert("User information not available.");
      return;
    }

    setIsLoggingOut(true);

    try {
      const logoutData = {
        user_id: parseInt(userData.userid),
        logout_lat_long: `${location.coords.latitude},${location.coords.longitude}`,
      };

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/user_attendance_logout.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logoutData),
        }
      );

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem("attn_id");
        setIsLoggedIn(false);
        checkTodaysAttendance(userData.userid);
        alert("Logout recorded successfully!");
      } else {
        alert(result.error || "Failed to record logout");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to connect to server");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderLoginSection = () => {
    if (!todayAttendance?.has_login) {
      return (
        <>
          <p className="login-status-text">Login to register your attendance</p>
          <button
            className={`login-button ${isLoggingIn ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </>
      );
    }

    if (todayAttendance.attendance?.is_logged_out) {
      return (
        <>
          <p className="login-status-text">Today's attendance completed</p>
          <AttendanceDetails attendance={todayAttendance.attendance} />
        </>
      );
    }

    return (
      <>
        <p className="login-status-text">Currently logged in</p>
        <AttendanceDetails attendance={todayAttendance.attendance} />
        <button
          className={`logout-button ${isLoggingOut ? "loading" : ""}`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </>
    );
  };

  // Choose an icon for each field (optional, can expand as needed)
  const analyticsIcons = {
    expense: <Wallet size={28} />,
    expense_requests: <Receipt size={28} />,
    cash_in_hand: <ClipboardList size={28} />,
    requisition_requests: <FileCheck size={28} />,
    // Add more mappings as needed
  };

  // Prepare cards for all numeric analytics fields
  const analyticsCards = analytics
    ? Object.entries(analytics)
        .filter(([key, value]) => typeof value === "number")
        .map(([key, value]) => (
          <div className="analytics-generic-card" key={key}>
            <div className="analytics-generic-icon">
              {analyticsIcons[key] || <BarChart size={28} />}
            </div>
            <div className="analytics-generic-title">
              {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
            <div className="analytics-generic-value">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
          </div>
        ))
    : null;

  // Prepare chart data for all numeric fields
  const analyticsChartData = analytics
    ? Object.entries(analytics)
        .filter(([key, value]) => typeof value === "number")
        .map(([key, value]) => ({
          name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
        }))
    : [];

  // Add this function to prepare data for charts
  const prepareChartData = (analytics) => {
    if (!analytics) return { pieData: [], barData: [] };

    const pieData = [
      {
        name: "Credit Amount",
        value: analytics.cash_in_hand.details.credit_amount || 0,
      },
      {
        name: "Debit Amount",
        value: analytics.cash_in_hand.details.debit_amount || 0,
      },
      {
        name: "Requisition Debit",
        value: analytics.cash_in_hand.details.req_debit_amount || 0,
      },
    ];

    const barData = [
      {
        name: "Expenses",
        value: analytics.monthly_analytics.expense || 0,
      },
      {
        name: "Expense Requests",
        value: analytics.monthly_analytics.expense_requests || 0,
      },
      {
        name: "Requisition Requests",
        value: analytics.monthly_analytics.requisition_requests || 0,
      },
    ];

    return { pieData, barData };
  };

  // Add these colors for the pie chart
  const COLORS = ["#6366f1", "#10b981", "#f59e0b"];

  if (loading || checkingAttendance) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  let locationText = "Waiting for location...";
  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Latitude: ${location.coords.latitude.toFixed(
      4
    )}, Longitude: ${location.coords.longitude.toFixed(4)}`;
  }

  return (
    <div className="dashboard-main">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2 className="welcome-text">Welcome back,</h2>
              {userData ? (
                <>
                  <h1 className="name-text">
                    {`${userData.u_fname}${
                      userData.u_mname ? ` ${userData.u_mname} ` : " "
                    }${userData.u_lname}`}
                  </h1>
                  <p className="role-text">{userData.role_name}</p>
                </>
              ) : (
                <h1 className="name-text">User</h1>
              )}
            </div>
            <img
              src={userData?.u_pro_img || "/assets/images/default_profile.png"}
              alt="Profile"
              className="welcome-image"
            />
          </div>
        </div>

        <div className="analytics-section">
          <h2 className="section-title">Your Expense Overview</h2>
          <div className="analytics-grid">
            <div className="analytics-card my-expense">
              <div className="analytics-content">
                <h3 className="analytics-label">My Expenses</h3>
                <p
                  className={`analytics-value ${
                    (analytics?.monthly_analytics?.expense ?? 0) < 0
                      ? "negative"
                      : ""
                  }`}
                >
                  ₹
                  {(
                    analytics?.monthly_analytics?.expense ?? 0
                  ).toLocaleString()}
                </p>
              </div>
              <div className="analytics-icon">
                <Wallet size={24} />
              </div>
            </div>

            {!["7", "9", "10", "11", "12", "14"].includes(roleId || "") && (
              <div className="analytics-card requested">
                <div className="analytics-content">
                  <h3 className="analytics-label">Requested Expenses</h3>
                  <p
                    className={`analytics-value ${
                      (analytics?.monthly_analytics?.expense_requests ?? 0) < 0
                        ? "negative"
                        : ""
                    }`}
                  >
                    ₹
                    {(
                      analytics?.monthly_analytics?.expense_requests ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="analytics-icon">
                  <Receipt size={24} />
                </div>
              </div>
            )}

            {roleId !== "8" && (
              <div className="analytics-card cash-in-hand">
                <div className="analytics-content">
                  <h3 className="analytics-label">Cash in Hand</h3>
                  <p
                    className={`analytics-value ${
                      (analytics?.cash_in_hand?.cash_in_hand ?? 0) < 0
                        ? "negative"
                        : ""
                    }`}
                  >
                    ₹
                    {(
                      analytics?.cash_in_hand?.cash_in_hand ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="analytics-icon">
                  <ClipboardList size={24} />
                </div>
              </div>
            )}

            {!["7", "9", "10", "11", "12", "14"].includes(roleId || "") && (
              <div className="analytics-card requisition">
                <div className="analytics-content">
                  <h3 className="analytics-label">Requested Requisition</h3>
                  <p
                    className={`analytics-value ${
                      (analytics?.monthly_analytics?.requisition_requests ??
                        0) < 0
                        ? "negative"
                        : ""
                    }`}
                  >
                    ₹
                    {(
                      analytics?.monthly_analytics?.requisition_requests ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="analytics-icon">
                  <FileCheck size={24} />
                </div>
              </div>
            )}
          </div>
        </div>

        {userData && userData.not_logged_out_count > 0 && (
          <div className="warning-container">
            <p className="warning-text">
              Warning: you have not logged out for{" "}
              {userData.not_logged_out_count} day
              {userData.not_logged_out_count > 1 ? "s" : ""}
            </p>
            <button
              className="info-button"
              onClick={() =>
                alert(
                  "If not logged out for 3 consecutive days, the user will be marked absent on the 3rd day"
                )
              }
            >
              i
            </button>
          </div>
        )}

        <div className="login-section">{renderLoginSection()}</div>

        {/* <div className="location-section">
          <div className="section-header">
            <MapPin size={20} />
            <h2 className="section-title">Your Location</h2>
          </div>
          <div className="location-details">
            <p>{locationText}</p>
          </div>
        </div> */}

        <QuoteSection quote={quote} loading={loadingQuote} />

        {/* {attendanceStats && (
          <div className="dashboard-analytics-graph">
            <h2 className="section-title">Attendance Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="attendance-stats-summary">
              <div>Present: <b>{attendanceStats.present_days}</b></div>
              <div>Absent: <b>{attendanceStats.absent_days}</b></div>
              <div>Late: <b>{attendanceStats.late_days}</b></div>
              <div>Half Days: <b>{attendanceStats.half_days}</b></div>
              <div>Total Working Days: <b>{attendanceStats.total_working_days}</b></div>
            </div>
          </div>
        )}

        {analyticsCards && analyticsCards.length > 0 && (
          <div className="analytics-cards-flex">
            {analyticsCards}
          </div>
        )}

        {analyticsChartData.length > 0 && (
          <div className="dashboard-analytics-graph">
            <h2 className="section-title">Analytics Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )} */}

        {/* Add this after your existing analytics section */}
        <FinancialCharts analytics={analytics} />
      </div>

      {/* <div className="dashboard-right-section">
        <Calendar/>
      </div> */}
    </div>
  );
}
