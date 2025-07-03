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
  Briefcase,
  Clock,
  CheckCircle,
  Shield,
  CalendarPlus,
  CalendarCheck,
  CreditCard,
  Edit,
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
import { format } from "date-fns";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default styles
const API_URL = "https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php";
const ATTENDANCE_API_URL = "https://demo-expense.geomaticxevs.in/ET-api/fetchAttendance.php";

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

function processAttendanceApiResponse(apiData) {
  const holidayDates = initialHolidays.map((holiday) => holiday.date);
  return (apiData || [])
    .map((item) => {
      if (holidayDates.includes(item.date)) {
        return { date: item.date, status: "Holiday", reason: "Holiday" };
      }
      if (item.isSunday) {
        return { date: item.date, status: "Sunday", reason: "Sunday" };
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
          status: "Not Punched Out",
          reason: "Did not Punched out",
        };
      }
      return { date: item.date, status: "Present", reason: "" };
    })
    .filter((item) => item.status !== "Sunday");
}

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
        {/* <h3 className="attendance-card-title">PunchIn Details</h3> */}
        <div className="attendance-row">
          <span className="attendance-label">PunchIn Time:</span>
          <span className="attendance-value">
            {new Date(attendance?.login_timestamp || "").toLocaleTimeString()}
          </span>
        </div>
        <div className="attendance-row">
          <span className="attendance-label">PunchIn Location:</span>
          <span className="attendance-value">
            {formatLocation(attendance?.login_lat_long)}
          </span>
        </div>
      </div>

      {attendance?.is_logged_out && (
        <div className="attendance-card">
          {/* <h3 className="attendance-card-title">PunchOut Details</h3> */}
          <div className="attendance-row">
            <span className="attendance-label">PunchOut Time:</span>
            <span className="attendance-value">
              {new Date(
                attendance?.logout_timestamp || ""
              ).toLocaleTimeString()}
            </span>
          </div>
          <div className="attendance-row">
            <span className="attendance-label">PunchOut Location:</span>
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
  const [currentMonth, setCurrentMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projectView, setProjectView] = useState('list');
  const [selectedProjectId, setSelectedProjectId] = useState("");

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

  const fetchMonthlyAttendance = useCallback(async (monthDate) => {
    const userId = localStorage.getItem("userid");
    if (!userId) return;
    const month = format(monthDate, "yyyy-MM");
    try {
      const response = await fetch(
        `https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php?user_id=${userId}&month=${month}`
      );
      const result = await response.json();
      // Use the same logic as myattendance.jsx
      const processed = processAttendanceApiResponse(result.data || []);
      setAttendanceDetails(processed);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
      setAttendanceDetails([]);
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
    // Check token expiry in localStorage before any API call
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.clear();
      window.location.href = '/';
      return;
    }
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      // Not logged in → redirect to login
      window.location.href = "/";
      return;
    }

    // Proceed with data load
    if (!initialLoadDone.current) {
      loadDashboardData();
      initialLoadDone.current = true;
    }
  }, [loadDashboardData]);

  useEffect(() => {
    // On initial load, fetch for current month
    if (currentMonth) {
      fetchMonthlyAttendance(currentMonth);
    } else {
      fetchMonthlyAttendance(new Date());
    }
  }, [currentMonth, fetchMonthlyAttendance]);

  useEffect(() => {
    const userId = localStorage.getItem("userid");
    if (!userId) return;
    const month = format(calendarMonth, "yyyy-MM");
    fetch(
      `https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php?user_id=${userId}&month=${month}`
    )
      .then((res) => res.json())
      .then((result) => {
        // Use the same logic as myattendance.jsx
        const processed = processAttendanceApiResponse(result.data || []);
        setAttendanceDetails(processed);
      })
      .catch(() => setAttendanceDetails([]));
  }, [calendarMonth]);

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

  // Fetch attendance for the current month by default
  useEffect(() => {
    const fetchAttendance = async () => {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("authToken");
      if (!userId || !token) return;
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      // Format as 'yyyy-MM-dd HH:mm:ss'
      const startDateStr = format(startDate, "yyyy-MM-dd 00:00:00");
      const endDateStr = format(endDate, "yyyy-MM-dd 23:59:59");
      console.log(startDate, endDate);
      try {
        const response = await fetch(ATTENDANCE_API_URL, {
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
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.attendance)) {
          setAttendanceDetails(data.attendance);
        } else {
          setAttendanceDetails([]);
        }
      } catch (err) {
        setAttendanceDetails([]);
      }
    };
    fetchAttendance();
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
          <p className="login-status-text">PunchIn to register your attendance</p>
          <button
            className={`login-button ${isLoggingIn ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Punching In..." : "PunchIn"}
          </button>
        </>
      );
    }

    if (todayAttendance.attendance?.is_logged_out) {
      return (
        <>
          <p className="login-status-text">Today's attendance completed (Punched Out)</p>
          <AttendanceDetails attendance={todayAttendance.attendance} />
        </>
      );
    }

    return (
      <>
        <p className="login-status-text">Currently Punched In</p>
        <AttendanceDetails attendance={todayAttendance.attendance} />
        <button
          className={`logout-button ${isLoggingOut ? "loading" : ""}`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Punching Out..." : "PunchOut"}
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
      {/* <div className="welcome-banner">
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
      </div */}
        <div className="dashboard-header"> 
          <div className="dashboard-header-left">
            
            <Calendar 
              className="calendar-header"
              value={calendarMonth}
              onActiveStartDateChange={({ activeStartDate }) => setCalendarMonth(activeStartDate)}
              tileClassName={({ date, view }) => {
                if (view !== 'month') return null;
                const dateStr = format(date, "yyyy-MM-dd");
                const attendance = attendanceDetails.find(a => a.login_timestamp && a.login_timestamp.startsWith(dateStr));
                if (!attendance) return null;
                if (attendance.is_logged_out === 1) return "tile-present";
                if (attendance.is_logged_out === 0) return "tile-not-logged-out";
                return "tile-absent";
              }}
            />
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
            <div className="dashboard-projects-title-row" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.5rem'}}>
              <h2 className="dashboard-projects-title"><u>My Projects:- </u></h2>
              <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                {/* Total projects and status counts */}
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span style={{fontWeight:600}}>Total projects: {projects.length}</span>
                  {/* Ongoing count */}
                  <span style={{background:'#e0e7ff',color:'#6366f1',borderRadius:'12px',padding:'2px 10px',fontSize:'0.95em',fontWeight:500}}>
                    Ongoing: {projects.filter(p => (p.status||'').toLowerCase() === 'ongoing').length}
                  </span>
                  {/* Completed count */}
                  <span style={{background:'#dcfce7',color:'#22c55e',borderRadius:'12px',padding:'2px 10px',fontSize:'0.95em',fontWeight:500}}>
                    Completed: {projects.filter(p => (p.status||'').toLowerCase() === 'completed').length}
                  </span>
                </div>
                {/* Project select dropdown */}
                <select
                  className="dashboard-projects-dropdown"
                  value={selectedProjectId || ''}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid #cbd5e1',fontSize:'1em'}}
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                  ))}
                </select>
                {/* Grid/List view toggle icons */}
                <div className="dashboard-projects-view-toggle">
                  <button
                    className={`view-toggle-btn${projectView === 'list' ? ' active' : ''}`}
                    title="List View"
                    onClick={() => setProjectView('list')}
                    style={{background:'none',border:'none',cursor:'pointer',padding:'0 6px'}}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={projectView === 'list' ? '#6366f1' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3" y2="6"/><line x1="3" y1="12" x2="3" y2="12"/><line x1="3" y1="18" x2="3" y2="18"/></svg>
                  </button>
                  <button
                    className={`view-toggle-btn${projectView === 'grid' ? ' active' : ''}`}
                    title="Grid View"
                    onClick={() => setProjectView('grid')}
                    style={{background:'none',border:'none',cursor:'pointer',padding:'0 6px'}}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={projectView === 'grid' ? '#6366f1' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </button>
                </div>
              </div>
            </div>
            {projectsLoading ? (
              <div className="dashboard-projects-loader">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="dashboard-projects-empty">No projects assigned.</div>
            ) : (selectedProjectId ? (
              // Only show the selected project
              projectView === 'list' ? (
                <div className="dashboard-projects-list">
                  {projects.filter(p => p.project_id === selectedProjectId).map((project) => (
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
                      <button className="project-line-view-btn" title="View Project">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </nav>
                  ))}
                </div>
              ) : (
                <div className="dashboard-projects-grid">
                  {projects.filter(p => p.project_id === selectedProjectId).map((project) => (
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
                        Total Expense: <span style={{fontWeight:600, color:'#6366f1', marginLeft:'0.3rem'}}>₹{project.total_expense || 'N/A'}</span>
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
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Show all or first 6 projects as before
              <>
                {projectView === 'list' ? (
                  <div className="dashboard-projects-list">
                    {(showAllProjects
                      ? [...projects].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      : [...projects]
                          .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                          .slice(0, 6)
                    ).map((project) => (
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
                        <button className="project-line-view-btn" title="View Project">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </nav>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-projects-grid">
                    {(showAllProjects
                      ? [...projects].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      : [...projects]
                          .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                          .slice(0, 6)
                    ).map((project) => (
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
                          Total Expense: <span style={{fontWeight:600, color:'#6366f1', marginLeft:'0.3rem'}}>₹{project.total_expense || 'N/A'}</span>
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
                      </div>
                    ))}
                  </div>
                )}
                {projects.length > 6 && (
                  <div className="dashboard-projects-toggle-btn-container">
                    <button
                      className="dashboard-projects-toggle-btn"
                      onClick={() => setShowAllProjects((prev) => !prev)}
                    >
                      {showAllProjects ? "Hide" : "View more"}
                    </button>
                  </div>
                )}
              </>
            ))}
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

        {/* {userData && userData.not_logged_out_count > 0 && (
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

        <div className="login-section">{renderLoginSection()}</div> */}

        {/* <div className="location-section">
          <div className="section-header">
            <MapPin size={20} />
            <h2 className="section-title">Your Location</h2>
          </div>
          <div className="location-details">
            <p>{locationText}</p>
          </div>
        </div> */}


        

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
