import React, { useState, useEffect, useCallback, useRef } from "react";
import "./dashboard.css";
import {
  Users,
  Calendar as CalendarIcon,
  FileCheck,
  ClipboardList,
  Wallet,
  Receipt,
  Shield,
  CalendarPlus,
  CalendarCheck,
  CreditCard,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../attendance/my_attendance/myattendance.css';
import { useClickAway } from 'react-use';
import { createPortal } from 'react-dom';

const initialHolidays = [
  { id: "1", name: "Bengali New Year", date: "2025-04-15", isSunday: false },
  { id: "2", name: "Good Friday", date: "2025-04-18", isSunday: false },
  { id: "3", name: "May Day", date: "2025-05-01", isSunday: false },
  { id: "4", name: "Independence Day / Janmashtami", date: "2025-08-15", isSunday: false },
  { id: "5", name: "Maha Shasthi (Durgapuja)", date: "2025-09-28", isSunday: false },
  { id: "6", name: "Maha Saptami (Durgapuja)", date: "2025-09-29", isSunday: false },
  { id: "7", name: "Maha Ashtami (Durgapuja)", date: "2025-09-30", isSunday: false },
  { id: "8", name: "Maha Navami (Durgapuja)", date: "2025-10-01", isSunday: false },
  { id: "9", name: "Vijaya Dashami / Gandhi Jayanti", date: "2025-10-02", isSunday: false },
  { id: "10", name: "Diwali / Kali Puja", date: "2025-10-20", isSunday: false },
  { id: "11", name: "Bhatri Ditiya", date: "2025-10-23", isSunday: false },
  { id: "12", name: "Christmas", date: "2025-12-25", isSunday: false },
  { id: "13", name: "New Year Day", date: "2026-01-01", isSunday: false },
  { id: "14", name: "Republic Day", date: "2026-01-26", isSunday: false },
  { id: "15", name: "Dol Yatra", date: "2026-03-03", isSunday: false },
];


const AttendanceDetails = ({ attendance, breakCount, onViewBreakDetails }) => {
  const formatLocation = (latLongStr) => {
    if (!latLongStr) return "";
    const [lat, long] = latLongStr.split(",");
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(long).toFixed(6)}`;
  };

  return (
    <div className="attendance-details">
      <div className="attendance-card">
        {/* <h3 className="attendance-card-title">PunchIn Details</h3> */}
        <div className="attendance-row">
          <span className="attendance-label">PunchIn Time:</span>
          <span className="attendance-value">
            {new Date(attendance?.login_timestamp || "").toLocaleTimeString()}
          </span>
        </div>
        <div className="attendance-row">
          <span className="attendance-label">Punch In Location:</span>
          <span className="attendance-value">
            {formatLocation(attendance?.login_lat_long)}
          </span>
        </div>
        {typeof breakCount === 'number' && (
          <div className="attendance-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="attendance-label">Number of Breaks taken:</span>
            <span className="attendance-value">{breakCount}</span>
            <button
              className="view-break-details-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}
              title="View break details"
              onClick={onViewBreakDetails}
            >
              <Eye size={18} color="#6366f1" />
            </button>
          </div>
        )}
      </div>

      {attendance?.is_logged_out && (
        <div className="attendance-card">
          {/* <h3 className="attendance-card-title">PunchOut Details</h3> */}
          <div className="attendance-row">
            <span className="attendance-label">Punch Out Time:</span>
            <span className="attendance-value">
              {new Date(
                attendance?.logout_timestamp || ""
              ).toLocaleTimeString()}
            </span>
            </div>
            <div className="attendance-row">
              <span className="attendance-label">Punch Out Location:</span>
              <span className="attendance-value">
                {formatLocation(attendance?.logout_lat_long)}
              </span>
            </div>
          
        </div>
      )}
    </div>
  );
};



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
                  <span>{item.name}</span>
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
  const [userId, setUserId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);

  const [filterStatus, setFilterStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projectView, setProjectView] = useState('list');
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  useClickAway(dropdownRef, () => setDropdownOpen(false));

  const initialLoadDone = useRef(false);

  const notifications = [
    { id: "1", text: "New user registered" },
    { id: "2", text: "Order #1234 has been placed" },
    { id: "3", text: "Server maintenance scheduled" },
  ];

  const [projectExpenses, setProjectExpenses] = useState([]);

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
    const token = localStorage.getItem('authToken');
    try {
      setCheckingAttendance(true);
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/check_login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
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

      const token = localStorage.getItem("authToken");

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      console.log("Dashboard result:", result); 

      if (result.status === "success") {
        const roleResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
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

  const fetchProjectExpenses = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(
        'https://demo-expense.geomaticxevs.in/ET-api/get_project_expense.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch project expenses");
      }

      if (result.status === 'success') {
        setProjectExpenses(result.data);
        setProjects(prevProjects => 
          prevProjects.map(project => {
            const expenseData = result.data.find(
              exp => exp.project_id == project.project_id
            );
            return {
              ...project,
              total_expense: expenseData ? expenseData.total_expense : 0
            };
          })
        );
      } else {
        console.error("API Error:", result.message);
      }
    } catch (error) {
      console.error("Network/API Error:", error.message);
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
        fetchProjectExpenses(),
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
    fetchProjectExpenses,
  ]);

  useEffect(() => {
    // Check token expiry in localStorage before any API call
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.clear();
      window.location.href = '/';
      return;
    }
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    // Check if user is on break and show modal if so
    const checkUserOnBreak = async () => {
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
          setBreakModalOpen(true);
          setBreakStartTime(new Date()); // Optionally, you may want to fetch the actual break start time from backend if available
          setBreakSeconds(0); // Optionally, you may want to calculate elapsed time if break start time is known
        }
      } catch (err) {
        // Ignore error, do not block dashboard
      }
    };

    if (!token || !userId) {
      // Not logged in → redirect to login
      window.location.href = "/";
      return;
    }

    // Proceed with data load
    if (!initialLoadDone.current) {
      checkUserOnBreak();
      loadDashboardData();
      initialLoadDone.current = true;
    }
  }, [loadDashboardData]);



  // Fetch projects for role_id = 3
  useEffect(() => {
    if (roleId === "3") {
      const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
          const userId = localStorage.getItem("userid");
          const token = localStorage.getItem("authToken");
          if (!userId || !token) return;
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
          } else {
            setProjects([]);
          }
        } catch (error) {
          setProjects([]);
        } finally {
          setProjectsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [roleId]);

  // Fetch attendance for the visible month
  useEffect(() => {
    const fetchMonthAttendance = async () => {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");
      if (!userId || !token) return;
      
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const startDate = new Date(year, month, 1);
      
      // Calculate end date as today or last day of month, whichever is earlier
      const today = new Date();
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const endDate = today < lastDayOfMonth ? today : lastDayOfMonth;
      
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");
      
      try {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: userId,
              start_date: startDateStr,
              end_date: endDateStr,
            }),
          }
        );
        const data = await response.json();
        if (data && data.success) {
          const processed = processApiResponse(data.attendance, data.holidays);
          setAttendanceDetails(processed);
        } else {
          setAttendanceDetails([]);
        }
      } catch (err) {
        setAttendanceDetails([]);
      }
    };
    fetchMonthAttendance();
  }, [calendarMonth]);

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
          <p className="login-status-text">Punch-In to register your attendance</p>
          <button
            className={`login-button ${isLoggingIn ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Punch-Ing In..." : "Punch-In"}
          </button>
        </>
      );
    }

    if (todayAttendance.attendance?.is_logged_out) {
      return (
        <>
          <p className="login-status-text">Today's attendance completed (Punched Out)</p>
          <AttendanceDetails attendance={todayAttendance.attendance} breakCount={breakCount} onViewBreakDetails={handleViewBreakDetails} />
          {breakDetailsModalOpen && (
            <div className="break-details-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.35)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="break-details-modal-content" style={{ background: '#fff', borderRadius: 12, padding: '2.5rem 2.5rem 2rem 2.5rem', minWidth: 340, boxShadow: '0 4px 32px rgba(30,41,59,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '80vh', overflowY: 'auto' }}>
                <h2 style={{ marginBottom: 18, color: '#6366f1', fontWeight: 700 }}>Break Details</h2>
                {breakDetailsLoading ? (
                  <div style={{ margin: 24 }}>Loading...</div>
                ) : breakDetails.length === 0 ? (
                  <div style={{ margin: 24 }}>No breaks taken today.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                    {breakDetails.map((b, idx) => {
                      // Calculate duration if not present
                      let duration = b.break_duration;
                      if (!duration && b.break_start_timestamp && b.break_end_timestamp) {
                        const start = new Date(b.break_start_timestamp);
                        const end = new Date(b.break_end_timestamp);
                        const diffMs = end - start;
                        if (!isNaN(diffMs) && diffMs > 0) {
                          const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
                          const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
                          const s = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
                          duration = `${h}:${m}:${s}`;
                        } else {
                          duration = '-';
                        }
                      }
                      return (
                        <li key={b.break_id || idx} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                          <div style={{ fontWeight: 600, color: '#22223b', marginBottom: 2 }}>Break {idx + 1}:</div>
                          <div style={{ fontSize: '1rem', color: '#444', marginBottom: 2 }}>
                            Start: {b.break_start_timestamp ? new Date(b.break_start_timestamp).toLocaleTimeString() : '-'}
                          </div>
                          <div style={{ fontSize: '1rem', color: '#444', marginBottom: 2 }}>
                            End: {b.break_end_timestamp ? new Date(b.break_end_timestamp).toLocaleTimeString() : '-'}
                          </div>
                          <div style={{ fontSize: '1rem', color: '#444' }}>
                            Duration: {duration || '-'}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  style={{ marginTop: 18, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '0.7rem 2.2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}
                  onClick={closeBreakDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <p className="login-status-text">Currently Punched In</p>
        <AttendanceDetails attendance={todayAttendance.attendance} breakCount={breakCount} onViewBreakDetails={handleViewBreakDetails} />
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className={`logout-button ${isLoggingOut ? "loading" : ""}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Punch-Ing Out..." : "PunchOut"}
          </button>
          <button
            className={`break-start-button take-break-btn`}
            style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem 1.2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
            onClick={handleBreakStart}
            disabled={breakLoading}
          >
            {breakLoading ? 'Starting...' : <> Take Break <span role="img" aria-label="coffee" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>☕</span></>}
          </button>
        </div>
        {breakDetailsModalOpen && (
          <div className="break-details-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.35)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="break-details-modal-content" style={{ background: '#fff', borderRadius: 12, padding: '2.5rem 2.5rem 2rem 2.5rem', minWidth: 340, boxShadow: '0 4px 32px rgba(30,41,59,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 style={{ marginBottom: 18, color: '#6366f1', fontWeight: 700 }}>Break Details</h2>
              {breakDetailsLoading ? (
                <div style={{ margin: 24 }}>Loading...</div>
              ) : breakDetails.length === 0 ? (
                <div style={{ margin: 24 }}>No breaks taken today.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                  {breakDetails.map((b, idx) => {
                    // Calculate duration if not present
                    let duration = b.break_duration;
                    if (!duration && b.break_start_timestamp && b.break_end_timestamp) {
                      const start = new Date(b.break_start_timestamp);
                      const end = new Date(b.break_end_timestamp);
                      const diffMs = end - start;
                      if (!isNaN(diffMs) && diffMs > 0) {
                        const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
                        const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
                        const s = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
                        duration = `${h}:${m}:${s}`;
                      } else {
                        duration = '-';
                      }
                    }
                    return (
                      <li key={b.break_id || idx} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                        <div style={{ fontWeight: 600, color: '#22223b', marginBottom: 2 }}>Break {idx + 1}:</div>
                        <div style={{ fontSize: '1rem', color: '#444', marginBottom: 2 }}>
                          Start: {b.break_start_timestamp ? new Date(b.break_start_timestamp).toLocaleTimeString() : '-'}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#444', marginBottom: 2 }}>
                          End: {b.break_end_timestamp ? new Date(b.break_end_timestamp).toLocaleTimeString() : '-'}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#444' }}>
                          Duration: {duration || '-'}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                style={{ marginTop: 18, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '0.7rem 2.2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}
                onClick={closeBreakDetailsModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* Break Modal */}
        {breakModalOpen && (
          <div className="break-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.35)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="break-modal-content" style={{ background: '#fff', borderRadius: 12, padding: '2.5rem 2.5rem 2rem 2.5rem', minWidth: 320, boxShadow: '0 4px 32px rgba(30,41,59,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {breakStartTime && (
                <div style={{ marginBottom: 12, color: '#6366f1', fontWeight: 600, fontSize: '1.1rem' }}>
                  Your break started at: {breakStartTime.toLocaleTimeString()}
                </div>
              )}
              <h2 style={{ marginBottom: 24, color: '#f59e0b', fontWeight: 700 }}>Break Time</h2>
              {/* Enhanced Coffee with smoke animation */}
              <div className="coffee-cup-anim coffee-cup-anim-fancy" style={{ marginBottom: 32 }}>
                <div className="coffee-plate"></div>
                <div className="coffee-cup-fancy">
                  <div className="coffee-cup-inner"></div>
                  <div className="coffee-cup-handle"></div>
                  <div className="coffee-cup-shadow"></div>
                  <div className="coffee-liquid-fancy"></div>
                  <div className="coffee-smoke-group">
                    <div className="coffee-smoke coffee-smoke1"></div>
                    <div className="coffee-smoke coffee-smoke2"></div>
                    <div className="coffee-smoke coffee-smoke3"></div>
                  </div>
                </div>
              </div>
              
              <button
                className="break-stop-button"
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '0.7rem 2.2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', marginTop: 8 }}
                onClick={handleBreakStop}
                disabled={breakLoading}
              >
                {breakLoading ? 'Stopping...' : 'Stop Break'}
              </button>
            </div>
          </div>
        )}
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

  function processApiResponse(apiData, holidays) {
    const holidayDates = initialHolidays.map((holiday) => holiday.date);
    
    // Calculate today's date to filter out future dates
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    return apiData
      .filter((item) => {
        // Only include dates up to today
        return item.date <= todayStr;
      })
      .map((item) => {
        if (holidayDates.includes(item.date)) {
          return { date: item.date, status: "Holiday", reason: "Holiday" };
        }
        const dateObj = new Date(item.date);
        const isSunday = dateObj.getDay() === 0;
        if (isSunday) {
          if (!item.hasLogin) {
            return null;
          } else {
            return { date: item.date, status: "Present", reason: "" };
          }
        }
        if (!item.hasLogin) {
          return {
            date: item.date,
            status: "Absent",
            reason: "No login recorded",
          };
        }
        if (!item.is_logged_out) {
          return {
            date: item.date,
            status: "Not Logged Out",
            reason: "Did not log out",
          };
        }
        return { date: item.date, status: "Present", reason: "" };
      })
      .filter((item) => item !== null);
  }

  function calculateTotalCounts() {
    const counts = {
      presentCount: 0,
      absentCount: 0,
      notLoggedOutCount: 0,
      holidayCount: 0,
    };
    attendanceDetails.forEach((attendance) => {
      if (attendance.status === "Present") {
        counts.presentCount++;
      } else if (attendance.status === "Absent") {
        counts.absentCount++;
      } else if (attendance.status === "Not Logged Out") {
        counts.notLoggedOutCount++;
      } else if (attendance.status === "Holiday") {
        counts.holidayCount++;
      }
    });
    return counts;
  }

  const CountBox = ({ value, label, color }) => (
    <div className="count-box" style={{ backgroundColor: color }}>
      <span className="count-value">{value}</span>
      <span className="count-label">{label}</span>
    </div>
  );

  // Helper: all project ids
  const allProjectIds = projects.map(p => String(p.project_id));
  const isAllSelected = selectedProjectIds.length === allProjectIds.length;

  // Handle checkbox change
  const handleProjectCheckboxChange = (projectId) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  const handleAllProjectsChange = () => {
    if (isAllSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(allProjectIds);
    }
  };

  // Add state for view more/less
  const [showAllProjectsExpanded, setShowAllProjectsExpanded] = useState(false);

  // Inside DashboardWeb function, add state for modal
  const [modalProject, setModalProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeamMembers, setModalTeamMembers] = useState([]);
  const [modalSupervisor, setModalSupervisor] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Handler to open modal and fetch extra details if needed
  const handleViewProject = async (project) => {
    setModalProject(project);
    setModalOpen(true);
    setModalLoading(true);
    // Fetch team members and supervisor if not present
    try {
      const token = localStorage.getItem('authToken');
      // Example API endpoint, adjust as needed
      const res = await fetch(
        'https://demo-expense.geomaticxevs.in/ET-api/get_project_details.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ project_id: project.project_id }),
        }
      );
      const data = await res.json();
      if (data.status === 'success') {
        setModalTeamMembers(data.team_members || []);
        setModalSupervisor(data.supervisor || 'N/A');
      } else {
        setModalTeamMembers([]);
        setModalSupervisor('N/A');
      }
    } catch (e) {
      setModalTeamMembers([]);
      setModalSupervisor('N/A');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalProject(null);
    setModalTeamMembers([]);
    setModalSupervisor('');
  };

  // Break modal state
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breakLoading, setBreakLoading] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null); // Store break start time
  const [breakCount, setBreakCount] = useState(null); // Number of breaks today
  const breakTimerRef = useRef(null);

  // Format seconds to HH:MM:SS
  const formatBreakTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Start break handler (calls API)
  const handleBreakStart = async () => {
    const userId = localStorage.getItem('userid');
    const token = localStorage.getItem('authToken');
    if (!userId || !token) {
      alert('User not logged in.');
      return;
    }
    setBreakLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/break_start.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: parseInt(userId, 10) }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setBreakSeconds(0);
        setBreakStartTime(new Date()); // Store the JS time when break started
        setBreakModalOpen(true);
        window.location.reload(); // Reload navbar and dashboard
      } else {
        alert(data.message || 'Failed to start break.');
      }
    } catch (err) {
      alert('Network error while starting break.');
    } finally {
      setBreakLoading(false);
    }
  };

  // Stop break handler (calls API)
  const handleBreakStop = async () => {
    const userId = localStorage.getItem('userid');
    const token = localStorage.getItem('authToken');
    if (!userId || !token) {
      alert('User not logged in.');
      return;
    }
    setBreakLoading(true);
    try {
      const break_duration = formatBreakTime(breakSeconds);
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/break_end.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: parseInt(userId, 10), break_duration }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setBreakModalOpen(false);
        setBreakSeconds(0);
        setBreakStartTime(null); // Reset break start time
        if (breakTimerRef.current) {
          clearInterval(breakTimerRef.current);
          breakTimerRef.current = null;
        }
        fetchBreakCount(); // Refresh break count after stopping break
        window.location.reload(); // Reload navbar and dashboard
      } else {
        alert(data.message || 'Failed to end break.');
      }
    } catch (err) {
      alert('Network error while ending break.');
    } finally {
      setBreakLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (breakModalOpen) {
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
  }, [breakModalOpen]);

  // Fetch number of breaks taken today
  const fetchBreakCount = useCallback(async () => {
    const userId = localStorage.getItem('userid');
    const token = localStorage.getItem('authToken');
    if (!userId || !token) {
      setBreakCount(null);
      return;
    }
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/break_info.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: parseInt(userId, 10) }),
      });
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setBreakCount(data.data.length);
      } else {
        setBreakCount(0);
      }
    } catch (err) {
      setBreakCount(0);
    }
  }, []);

  // Fetch break count on mount and whenever stop break is clicked
  useEffect(() => {
    fetchBreakCount();
  }, [fetchBreakCount]);

  const [breakDetailsModalOpen, setBreakDetailsModalOpen] = useState(false);
  const [breakDetails, setBreakDetails] = useState([]);
  const [breakDetailsLoading, setBreakDetailsLoading] = useState(false);

  // Fetch break details for modal
  const fetchBreakDetails = useCallback(async () => {
    const userId = localStorage.getItem('userid');
    const token = localStorage.getItem('authToken');
    if (!userId || !token) {
      setBreakDetails([]);
      return;
    }
    setBreakDetailsLoading(true);
    try {
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/break_info.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: parseInt(userId, 10) }),
      });
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setBreakDetails(data.data);
      } else {
        setBreakDetails([]);
      }
    } catch (err) {
      setBreakDetails([]);
    } finally {
      setBreakDetailsLoading(false);
    }
  }, []);

  const handleViewBreakDetails = () => {
    fetchBreakDetails();
    setBreakDetailsModalOpen(true);
  };

  const closeBreakDetailsModal = () => {
    setBreakDetailsModalOpen(false);
  };

  if (loading || checkingAttendance) {
    return (
      <div className="dash-loading-container">
        <div className="dash-loading-spinner"></div>
        <pre className='dash-loading-text'>  Loading Project Dashboard...</pre>
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
          <div className="dashboard-header-left">
            <div className="dashboard-calendar-view">
              <div className="left-section">
                <Calendar
                  value={calendarMonth}
                  onActiveStartDateChange={({ activeStartDate }) => setCalendarMonth(activeStartDate)}
                  tileClassName={({ date, view }) => {
                    if (view !== 'month') return null;
                    const dateStr = format(date, "yyyy-MM-dd");
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    if (dateStr > todayStr) return "tile-future";
                    const attendance = attendanceDetails.find((a) => a.date === dateStr);
                    if (!attendance) return null;
                    if (attendance.status === "Present") return "tile-present";
                    if (attendance.status === "Absent") return "tile-absent";
                    if (attendance.status === "Not Logged Out") return "tile-not-logged-out";
                    if (attendance.status === "Holiday") return "tile-holiday";
                    return null;
                  }}
                />
              </div>
              <div className="middle-section">
                <div className="count-container">
                  <div className="count-inner-container">
                    <CountBox value={calculateTotalCounts().presentCount} label="Present" color="#3fd1a0" />
                    <CountBox value={calculateTotalCounts().absentCount} label="Absent" color="#f05b5b" />
                    <CountBox value={calculateTotalCounts().holidayCount} label="Holiday" color="#6b7280" />
                    <CountBox value={calculateTotalCounts().notLoggedOutCount} label="Not Logged Out" color="#fab541" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-header-right">
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
                !
              </button>
            </div>
          )}
          <div className="login-section">{renderLoginSection()}</div>
        </div>
        </div>
        {/* My Projects Card Section for role_id = 3 */}
        {roleId === "3" && (
          <div className="dashboard-projects-section">
            <div className="projects-banner">
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                <div style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(30,41,59,0.04)"
                }}>
                  {/* Main icon */}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <span className="projects-banner-title" style={{ fontSize: "2rem" }}>My Projects</span>
              </div>
              <div className="projects-status-info">
                <div style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "0.7rem 1.2rem",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "120px",
                  boxShadow: "0 2px 8px rgba(30,41,59,0.04)"
                }}>
                  <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
                  <div style={{ marginLeft: "0.7rem" }}>
                    <div style={{ color: "#64748b", fontWeight: 600, fontSize: "1rem" }}>Total Projects</div>
                    <div style={{ color: "#6366f1", fontWeight: 700, fontSize: "1.5rem" }}>{projects.length}</div>
                  </div>
                </div>
                <div className="status-pill ongoing" style={{
                  background: "#e0e7ff",
                  color: "#1e293b",
                  borderRadius: "12px",
                  padding: "0.7rem 1.2rem",
                  minWidth: "100px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <span style={{ marginRight: "0.5rem" }}>
                    <svg className="ongoing-clock-icon" width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2 2"/></svg>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                    {projects.filter(p => (p.status || '').toLowerCase() === 'ongoing').length}
                  </span>
                  <span style={{ marginLeft: "0.5rem", fontWeight: 600, fontSize: "1rem" }}>Ongoing</span>
                </div>
                <div className="status-pill completed" style={{
                  background: "#dcfce7",
                  color: "#22c55e",
                  borderRadius: "12px",
                  padding: "0.7rem 1.2rem",
                  minWidth: "100px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <span style={{ marginRight: "0.5rem" }}>
                    <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                    {projects.filter(p => (p.status || '').toLowerCase() === 'completed').length}
                  </span>
                  <span style={{ marginLeft: "0.5rem", fontWeight: 600, fontSize: "1rem" }}>Completed</span>
                </div>
                <div style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "0.7rem 1.2rem",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "120px",
                  boxShadow: "0 2px 8px rgba(30,41,59,0.04)"
                }}>
                  <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v3m0 16v3m9-9h-3M4 12H1m15.364 6.364l-2.12-2.12M6.344 6.344l-2.12-2.12m12.728 0l-2.12 2.12M6.344 17.656l-2.12 2.12M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  <div style={{ marginLeft: "0.7rem" }}>
                    <div style={{ color: "#64748b", fontWeight: 600, fontSize: "1rem" }}>Total Expenses</div>
                    <div style={{ color: "#6366f1", fontWeight: 700, fontSize: "1.5rem" }}>
                      ₹{projects.reduce((sum, p) => sum + (parseFloat(p.total_expense) || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="projects-banner-controls">
                <div className="custom-multiselect-dropdown" ref={dropdownRef} style={{ position: 'relative', minWidth: 180 }}>
                  <button
                    className="projects-filter"
                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                    onClick={() => setDropdownOpen(open => !open)}
                    type="button"
                  >
                    {selectedProjectIds.length === 0
                      ? 'Select'
                      : isAllSelected
                        ? 'All Projects'
                        : `${selectedProjectIds.length} selected`}
                    <span style={{ float: 'right' }}>&#9662;</span>
                  </button>
                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 10,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(30,41,59,0.08)',
                      minWidth: 180,
                      padding: '0.5rem 0',
                      maxHeight: 260,
                      overflowY: 'auto',
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 1rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleAllProjectsChange}
                          style={{ marginRight: 8 }}
                        />
                        All Projects
                      </label>
                      {projects.map(project => (
                        <label key={project.project_id} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 1rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(String(project.project_id))}
                            onChange={() => handleProjectCheckboxChange(String(project.project_id))}
                            style={{ marginRight: 8 }}
                          />
                          {project.project_name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="projects-view-toggle">
                  <button
                    className={`view-toggle-btn${projectView === 'list' ? ' active' : ''}`}
                    title="List View"
                    onClick={() => setProjectView('list')}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3" y2="6"/><line x1="3" y1="12" x2="3" y2="12"/><line x1="3" y1="18" x2="3" y2="18"/></svg>
                  </button>
                  <button
                    className={`view-toggle-btn${projectView === 'grid' ? ' active' : ''}`}
                    title="Grid View"
                    onClick={() => setProjectView('grid')}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </button>
                </div>
              </div>
            </div>
            {projectsLoading ? (
              <div className="dashboard-projects-loader">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="dashboard-projects-empty">No projects assigned.</div>
            ) : selectedProjectIds.length === 0 ? (
              <div className="dashboard-projects-empty">Please select project(s) to view details.</div>
            ) : isAllSelected ? (
              // All Projects selected: show 4 most recent, with View More
              <>
                {projectView === 'list' ? (
                  <div className="dashboard-projects-list">
                    {[...projects]
                      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      .slice(0, showAllProjectsExpanded ? projects.length : 3)
                      .map((project) => (
                        <nav key={project.project_id} className="dashboard-project-line-nav">
                          <div className="project-line-left">
                            <span className="project-line-title">{project.project_name}</span>
                            <span className="project-line-leader">Team leader: <b>{project.team_leader || 'N/A'}</b></span>
                          </div>
                          <div className="project-line-center">
                            <span className="project-line-active">
                              <span className="dot dot-green"></span>
                              {project.active_users ?? 0} <span className="project-line-label"></span>
                            </span>
                            <span className="project-line-inactive">
                              <span className="dot dot-red"></span>
                              {project.inactive_users ?? 0} <span className="project-line-label"></span>
                            </span>
                          </div>
                          <div className="project-line-status">
                            Status: <b>{project.status || 'N/A'}</b>
                          </div>
                          <button className="project-line-view-btn" title="View Project" onClick={() => handleViewProject(project)}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </nav>
                      ))}
                  </div>
                ) : (
                  <div className="dashboard-projects-grid">
                    {[...projects]
                      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      .slice(0, showAllProjectsExpanded ? projects.length : 3)
                      .map((project) => (
                        <div key={project.project_id} className="dashboard-project-card project-card-item status-border-ongoing clickable-project-card">
                          <div className="project-card-header">
                            <h3>{project.project_name}</h3>
                          </div>
                          <p className="project-card-detail"><Shield size={14} className="mr-1" /> Team Leader: {project.team_leader || 'N/A'}</p>
                          <p className="project-card-detail"><Users size={14} className="mr-1" /> Total Members: {project.total_members || 'N/A'}</p>
                          <p className="project-card-detail"><CalendarPlus size={14} className="mr-1" /> Created At: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                          <p className="project-card-detail"><CalendarCheck size={14} className="mr-1" /> Expected End Date: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                          <p className="project-card-detail">
                            <CreditCard size={14} style={{marginRight: '0.3rem', color: '#6366f1', verticalAlign: 'middle'}} />
                            Total Expense: <span style={{fontWeight:600, color:'#6366f1', marginLeft:'0.3rem'}}>
                              ₹{project.total_expense ? project.total_expense.toLocaleString() : '0'}
                            </span>
                            <span style={{color:'#a5b4fc', margin:'0 0.2rem'}}/>
                          </p>
                          <div className="project-card-progress">
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{width: `${project.progress || 0}%`, backgroundColor: project.status === 'Ongoing' ? '#6366f1' : '#22c55e'}}></div>
                            </div>
                            <span className="progress-text">{project.progress || 0}%</span>
                          </div>
                          <div className="project-card-footer">
                            <span className={`status-badge status-${project.status?.toLowerCase()}`}>{project.status}</span>
                          </div>
                          <button className="project-line-view-btn" title="View Project" onClick={() => handleViewProject(project)}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {projects.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button
                      className="view-more-btn"
                      style={{
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0.5rem 1.2rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        boxShadow: '0 2px 8px rgba(30,41,59,0.04)'
                      }}
                      onClick={() => setShowAllProjectsExpanded(expanded => !expanded)}
                    >
                      {showAllProjectsExpanded ? 'View Less' : 'View More'}
                    </button>
                  </div>
                )}
              </>
            ) : projectView === 'list' ? (
              <div className="dashboard-projects-list">
                {[...projects]
                  .filter(p => selectedProjectIds.includes(String(p.project_id)))
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map((project) => (
                    <nav key={project.project_id} className="dashboard-project-line-nav">
                      <div className="project-line-left">
                        <span className="project-line-title">{project.project_name}</span>
                        <span className="project-line-leader">Team leader: <b>{project.team_leader || 'N/A'}</b></span>
                      </div>
                      <div className="project-line-center">
                        <span className="project-line-active">
                          <span className="dot dot-green"></span>
                          {project.active_users ?? 0} <span className="project-line-label"></span>
                        </span>
                        <span className="project-line-inactive">
                          <span className="dot dot-red"></span>
                          {project.inactive_users ?? 0} <span className="project-line-label"></span>
                        </span>
                      </div>
                      <div className="project-line-status">
                        Status: <b>{project.status || 'N/A'}</b>
                      </div>
                      <button className="project-line-view-btn" title="View Project" onClick={() => handleViewProject(project)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </nav>
                  ))}
              </div>
            ) : (
              <div className="dashboard-projects-grid">
                {[...projects]
                  .filter(p => selectedProjectIds.includes(String(p.project_id)))
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map((project) => (
                    <div key={project.project_id} className="dashboard-project-card project-card-item status-border-ongoing clickable-project-card">
                      <div className="project-card-header">
                        <h3>{project.project_name}</h3>
                      </div>
                      <p className="project-card-detail"><Shield size={14} className="mr-1" /> Team Leader: {project.team_leader || 'N/A'}</p>
                      <p className="project-card-detail"><Users size={14} className="mr-1" /> Total Members: {project.total_members || 'N/A'}</p>
                      <p className="project-card-detail"><CalendarPlus size={14} className="mr-1" /> Created At: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                      <p className="project-card-detail"><CalendarCheck size={14} className="mr-1" /> Expected End Date: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                      <p className="project-card-detail">
                        <CreditCard size={14} style={{marginRight: '0.3rem', color: '#6366f1', verticalAlign: 'middle'}} />
                        Total Expense: <span style={{fontWeight:600, color:'#6366f1', marginLeft:'0.3rem'}}>
                          ₹{project.total_expense ? project.total_expense.toLocaleString() : '0'}
                        </span>
                        <span style={{color:'#a5b4fc', margin:'0 0.2rem'}}/>
                      </p>
                      <div className="project-card-progress">
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{width: `${project.progress || 0}%`, backgroundColor: project.status === 'Ongoing' ? '#6366f1' : '#22c55e'}}></div>
                        </div>
                        <span className="progress-text">{project.progress || 0}%</span>
                      </div>
                      <div className="project-card-footer">
                        <span className={`status-badge status-${project.status?.toLowerCase()}`}>{project.status}</span>
                      </div>
                      <button className="project-line-view-btn" title="View Project" onClick={() => handleViewProject(project)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
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

        {/* Add this after your existing analytics section */}
        <FinancialCharts analytics={analytics} />
      </div>

    </div>
  );
}
