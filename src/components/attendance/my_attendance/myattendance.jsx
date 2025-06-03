import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CircularProgress } from '@mui/material';
import './myattendance.css';

const MyAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAttendanceData();
    }
  }, [startDate, endDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userid');
      const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/attendance_in_range.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAttendanceData(data.attendance);
      } else {
        setError(data.message || 'Failed to fetch attendance data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'my-attendance-status-present';
      case 'absent':
        return 'my-attendance-status-absent';
      case 'late':
        return 'my-attendance-status-late';
      case 'holiday':
        return 'my-attendance-status-holiday';
      default:
        return '';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="my-attendance-container">
        <div className="my-attendance-header">
          <h1 className="my-attendance-title">My Attendance</h1>
        </div>

        <div className="my-attendance-filters">
          <div className="my-attendance-date-picker">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              maxDate={endDate || new Date()}
            />
          </div>
          <div className="my-attendance-date-picker">
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate}
              maxDate={new Date()}
            />
          </div>
        </div>

        {loading ? (
          <div className="my-attendance-loading">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="my-attendance-error">{error}</div>
        ) : attendanceData.length === 0 ? (
          <div className="my-attendance-no-data">No attendance records found</div>
        ) : (
          <div className="my-attendance-table-container">
            <table className="my-attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record) => (
                  <tr key={record.date}>
                    <td>{format(new Date(record.date), 'dd MMM yyyy')}</td>
                    <td>
                      <span className={`my-attendance-status ${getStatusClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.check_in || '-'}</td>
                    <td>{record.check_out || '-'}</td>
                    <td>{record.working_hours || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
};

export default MyAttendance;