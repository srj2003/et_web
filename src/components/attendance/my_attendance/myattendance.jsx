import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./myattendance.css";
import { TextField, Button, CircularProgress, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import attendanceNote from "../../../assets/Attendance_note.jpeg"
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const API_URL = "https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php";
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

export default function MyAttendance() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [approvedLeaveDates, setApprovedLeaveDates] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      window.location.href = "/";
      return;
    }

    const fetchUserId = async () => {
      try {
        const storedUserId = localStorage.getItem("userid");
        if (storedUserId) {
          setUserId(parseInt(storedUserId, 10));
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        alert("Failed to load user information");
      }
    };

    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/my-leaves.php", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          // Collect all dates for approved leaves
          const approvedDates = [];
          data.data.forEach(leave => {
            if (leave.leave_track_status === 1) {
              // Range from leave_from_date to leave_to_date
              let current = new Date(leave.leave_from_date);
              const end = new Date(leave.leave_to_date);
              while (current <= end) {
                approvedDates.push(current.toISOString().slice(0, 10));
                current.setDate(current.getDate() + 1);
              }
            }
          });
          setApprovedLeaveDates(approvedDates);
        }
      } catch (error) {
        console.error("Error fetching approved leaves:", error);
      }
    };

    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("https://demo-expense.geomaticxevs.in/ET-api/my-leaves.php", {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setLeaves(data.data);
        }
      } catch (err) { /* ignore */ }
    };

    fetchUserId();
    fetchApprovedLeaves();
    fetchLeaves();
  }, []);

  const onRefresh = () => {
    setStartDate(null);
    setEndDate(null);
    setAttendanceDetails([]);
    setFilterStatus(null);
    setDataLoaded(false);
  };

  const handleDateSelect = (date, type) => {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");

    if (type === "START_DATE") {
      setStartDate(formattedDate);
      setEndDate(null);
    } else {
      if (startDate && new Date(formattedDate) >= new Date(startDate)) {
        setEndDate(formattedDate);
      } else {
        alert("End date must be after start date");
      }
    }
  };

  // Modify fetchAttendanceData function
  const fetchAttendanceData = async () => {
    if (!userId) {
      alert("Error: User ID not available");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please select a start and end date");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication failed. Please login again.");
      window.location.href = "/";
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.success) {
        const processedData = processApiResponse(data.attendance, data.holidays);
        setAttendanceDetails(processedData);
        setDataLoaded(true);
      } else {
        alert(data?.message || "Failed to fetch attendance data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.message.includes('401')) {
        alert("Session expired. Please login again.");
        window.location.href = '/';
      } else {
        alert("Failed to connect to server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const processApiResponse = (apiData, holidays) => {
    const holidayDates = initialHolidays.map((holiday) => holiday.date);

    return apiData
      .map((item) => {
        if (holidayDates.includes(item.date)) {
          return { date: item.date, status: "Holiday", reason: "Holiday" };
        }

        const dateObj = new Date(item.date);
        const isSunday = dateObj.getDay() === 0;

        if (isSunday) {
          if (!item.hasLogin) {
            // No login on Sunday, leave blank (no status)
            return null;
          } else if (!item.is_logged_out) {
            return { date: item.date, status: "Present", reason: "" };
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
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
  };

  const calculateTotalCounts = () => {
    
    const counts = {
      presentCount: 0,
      actualPresentCount: 0,
      absentCount: 0,
      actualAbsentCount: 0,
      notLoggedOutCount: 0,
      holidayCount: 0,
    };

    attendanceDetails.forEach((attendance) => {
      if (attendance.status === "Present") {
        counts.presentCount++;
        counts.actualPresentCount++;
      } else if (attendance.status === "Absent") {
        counts.absentCount++;
        counts.actualAbsentCount++;
      } else if (attendance.status === "Not Logged Out") {
        counts.notLoggedOutCount++;
      } else if (attendance.status === "Holiday") {
        counts.holidayCount++;
      }
    });

    const notLoggedOutAdjustment = Math.floor(counts.notLoggedOutCount / 3);

    counts.presentCount = Math.floor(
      counts.presentCount + (counts.notLoggedOutCount - notLoggedOutAdjustment)
    );
    counts.absentCount = Math.floor(counts.absentCount + notLoggedOutAdjustment);

    return counts;
  };

  const CountBox = ({ value, label, color }) => (
    <div className="count-box" style={{ backgroundColor: color }}>
      <span className="count-value">{value}</span>
      <span className="count-label">{label}</span>
    </div>
  );

  // Helper: find leave for a date
  const findApprovedLeaveForDate = (dateStr) => {
    return leaves.find(leave => {
      if (leave.leave_track_status !== 1) return false;
      const from = new Date(leave.leave_from_date);
      const to = new Date(leave.leave_to_date);
      const d = new Date(dateStr);
      return d >= from && d <= to;
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="main-container">
        <div className="scroll-container">
          <div className="form-container">
            <div className="title-container">
              <h2 className="myattendance-title">Attendance Tracker <button
                  className="help-button"
                  onClick={() => window.open(attendanceNote, '_blank')}
                >
                  Help Note*
              </button></h2>
              
              <IconButton onClick={onRefresh} color="primary" aria-label="refresh" >
                <RefreshIcon />
              </IconButton>
            </div>
            <div className="date-range-container">
              <div className="date-pickers">
                <div className="date-picker-wrapper">
                  <DatePicker sx={{ fontSize: '22px' }}
                    label="Start Date"
                    value={startDate ? new Date(startDate) : null}
                    onChange={(date) => handleDateSelect(date, "START_DATE")}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    views={['year', 'month', 'day']}
                    openTo="month"
                    inputFormat="dd/MM/yyyy"
                    mask="__/__/____"
                    disableFuture
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: false,
                        helperText: '',
                      },
                    }}
                  />
                </div>
                <span className="date-picker-separator">to</span>
                <div className="date-picker-wrapper">
                  <DatePicker sx={{ fontSize: '24px' }}
                    label="End Date"
                    value={endDate ? new Date(endDate) : null}
                    onChange={(date) => handleDateSelect(date, "END_DATE")}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    views={['year', 'month', 'day']}
                    openTo="month"
                    inputFormat="dd/MM/yyyy"
                    mask="__/__/____"
                    disableFuture
                    minDate={startDate ? new Date(startDate) : null}
                    disabled={!startDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: false,
                        helperText: '',
                      },
                    }}
                  />
                </div>
              </div>
              <div className="date-range-view">
                {(startDate || endDate) && (
                <div className="date-range-display">
                  Selected Range: 
                  <span>{startDate && format(new Date(startDate), "MMM dd, yyyy")}</span>
                  {endDate && <span> to {format(new Date(endDate), "MMM dd, yyyy")}</span>}
                </div>
              )}
              
              <Button
                variant="contained"
                color="primary"
                onClick={fetchAttendanceData}
                disabled={!startDate || !endDate}
                className="submit-button"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? "Loading..." : "View Attendance"}
              </Button>
              </div>
            </div>

            {dataLoaded && (
              <div className="filter-section">
                <div className="filter-header">
                  <FilterAltIcon style={{ fontSize: '24px', marginRight: '10px' }} color="primary" />
                  <span>Filter Attendance</span>
                </div>
                <div className="filter-buttons">
                  <Button
                    variant={filterStatus === "Present" ? "contained" : "outlined"}
                    color="success"
                    onClick={() => handleFilterStatus("Present")}
                    className="filter-button" id = "present"
                  >
                    Present
                  </Button>
                  <Button
                    variant={filterStatus === "Absent" ? "contained" : "outlined"}
                    color="error"
                    onClick={() => handleFilterStatus("Absent")}
                    className="filter-button" id = "absent"
                  >
                    Absent
                  </Button>
                  <Button
                    variant={filterStatus === "Not Logged Out" ? "contained" : "outlined"}
                    color="warning"
                    onClick={() => handleFilterStatus("Not Logged Out")}
                    className="filter-button" id = "not-logged-out"
                  >
                    Not Logged Out
                  </Button>
                  <Button
                    variant={filterStatus === "Approved Leave" ? "contained" : "outlined"}
                    style={{ backgroundColor: filterStatus === "Approved Leave" ? '#2563eb' : '', color: filterStatus === "Approved Leave" ? '#fff' : '#2563eb', borderColor: '#2563eb', borderWidth: 2, marginLeft: 0, marginRight: 0 }}
                    onClick={() => handleFilterStatus("Approved Leave")}
                    className="filter-button" id = "approved-leave"
                  >
                    Approved Leave
                  </Button>
                  <Button
                    variant={filterStatus === null ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => handleFilterStatus(null)}
                    className="filter-button" id = "show-all"
                  >
                    Show All
                  </Button>
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-container">
                <CircularProgress />
              </div>
            )}

            {attendanceDetails.length > 0 && (
              <div className="calendar-view">
                <div className="left-section">
                    <Calendar
                      value={undefined}
                      tileClassName={({ date, view }) => {
                        if (view !== 'month') return null;
                        const dateStr = format(date, "yyyy-MM-dd");
                        const leave = findApprovedLeaveForDate(dateStr);
                        if (filterStatus === "Approved Leave") {
                          return approvedLeaveDates.includes(dateStr) ? "tile-approved-leave" : "tile-hidden";
                        }
                        if (approvedLeaveDates.includes(dateStr)) return "tile-approved-leave";
                        const attendance = attendanceDetails.find(
                          (a) => a.date === dateStr
                        );
                        if (!attendance) return null;
                        if (filterStatus && attendance.status !== filterStatus) {
                          return 'tile-hidden';
                        }
                        if (attendance.status === "Present") return "tile-present";
                        if (attendance.status === "Absent") return "tile-absent";
                        if (attendance.status === "Not Logged Out") return "tile-not-logged-out";
                        if (attendance.status === "Holiday") return "tile-holiday";
                        if (attendance.status === "Sunday") return "tile-sunday";
                        return null;
                      }}
                      onClickDay={(date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const leave = findApprovedLeaveForDate(dateStr);
                        if (leave) {
                          setSelectedLeave(leave);
                          setLeaveModalOpen(true);
                        }
                      }}
                      onActiveStartDateChange={({ activeStartDate }) => {
                        setCurrentMonth(activeStartDate);
                      }}
                    />
                  </div>
         
                <div className="middle-section">
                  <div className="count-container">
                    <div className="count-inner-container">
                      {filterStatus === "Present" ? (
                        <CountBox value={calculateTotalCounts().presentCount} label="Present" color="#3fd1a0" />
                      ) : filterStatus === "Absent" ? (
                        <CountBox value={calculateTotalCounts().absentCount} label="Absent" color="#f05b5b" />
                      ) : filterStatus === "Not Logged Out" ? (
                        <CountBox value={calculateTotalCounts().notLoggedOutCount} label="Not Logged Out" color="#fab541" />
                      ) : (
                        <>
                          <CountBox value={calculateTotalCounts().presentCount} label="Present" color="#3fd1a0" />
                          <CountBox value={calculateTotalCounts().absentCount} label="Absent" color="#f05b5b" />
                          <CountBox value={calculateTotalCounts().holidayCount} label="Holiday" color="#6b7280" />
                          <CountBox value={calculateTotalCounts().notLoggedOutCount} label="Not Logged Out" color="#fab541" />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="right-section">
                  <div className="detailed-note-container">
                    <h3 className="detailed-note-title">Attendance Calculation Details:</h3>
                    <div className="calculation-container">
                      <h4 className="initial-values">Initial Count:</h4>
                      <p className="value-text">
                        • Present: <span className="number-highlight">{calculateTotalCounts().actualPresentCount}</span> days
                      </p>
                      <p className="value-text">
                        • Absent: <span className="number-highlight">{calculateTotalCounts().actualAbsentCount}</span> days
                      </p>
                      <p className="value-text">
                        • Not Logged Out: <span className="number-highlight">{calculateTotalCounts().notLoggedOutCount}</span> days
                      </p>

                      <h4 className="final-calculation">Final Calculation:</h4>
                      <p className="value-text">
                        • Total Present Days:{" "}
                        <span className="number-highlight">
                          {calculateTotalCounts().actualPresentCount +
                            (calculateTotalCounts().notLoggedOutCount -
                              Math.floor(calculateTotalCounts().notLoggedOutCount / 3))}
                        </span>{" "}
                        days
                      </p>
                      <p className="value-text">
                        • Total Absent Days:{" "}
                        <span className="number-highlight">
                          {calculateTotalCounts().actualAbsentCount +
                            Math.floor(calculateTotalCounts().notLoggedOutCount / 3)}
                        </span>{" "}
                        days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="note-container">
              <h3 className="note-title">Important Note:</h3>
              <div className="note-content">
                <p className="note-text">
                  If there are 3 "Not Logged Out" days, it will be counted as:
                </p>
                <ul className="note-list">
                  <li style={{ fontSize: '20px', marginLeft: '10px' }}>2 days Present</li>
                  <li style={{ fontSize: '20px', marginLeft: '10px' }}>1 day Absent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Details Modal */}
      <Dialog open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)}>
        <DialogTitle>Approved Leave Details</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <div>
              <div><b>Title:</b> {selectedLeave.leave_title}</div>
              <div><b>Type:</b> {selectedLeave.leave_ground_text}</div>
              <div><b>Status:</b> {selectedLeave.leave_track_status_text}</div>
              <div><b>From:</b> {selectedLeave.leave_from_date}</div>
              <div><b>To:</b> {selectedLeave.leave_to_date}</div>
              <div><b>Comment:</b> {selectedLeave.leave_comment}</div>
              {selectedLeave.documents && selectedLeave.documents.length > 0 && (
                <div><b>Documents:</b>
                  <ul>
                    {selectedLeave.documents.map((doc, idx) => (
                      <li key={idx}><a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}