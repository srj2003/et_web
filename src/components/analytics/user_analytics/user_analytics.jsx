import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Search as SearchIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Upload as UploadIcon,
    Check as CheckIcon,
    CalendarToday as CalendarIcon,
    AccessTime as ClockIcon,
    Timer as TimerIcon,
    Person as UserCheckIcon,
    PersonOff as UserXIcon,
    TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { TextField, Button, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './user_analytics.css';

const fetchAttendanceData = async (userId, startDate, endDate) => {
    try {
        const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/fetch_analytics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                startDate,
                endDate
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data?.status !== "success") {
            throw new Error(data.message || 'Invalid API response: status not "success"');
        }

        return {
            status: data.status,
            data: {
                hours: {
                    total: data.totalHoursWorked,
                    daily_average: data.dailyAvgWorkHours
                },
                attendance: {
                    present: data.attendedDays,
                    absent: data.absentDays,
                    rate: data.attendanceRate,
                    trend: "+0%"
                },
                timings: {
                    average_checkin: data.avgCheckInTime,
                    average_checkout: data.avgCheckOutTime
                }
            },
            debug_info: data.debug_info
        };
    } catch (error) {
        console.error('Error fetching attendance data:', {
            error,
            userId,
            dateRange: { startDate, endDate }
        });
        throw error;
    }
};

const StatCard = ({ icon, title, value, subValue, color }) => (
    <div className="stat-card" style={{ backgroundColor: color }}>
        <div className="stat-card-header">
            {icon}
            {subValue && (
                <div className="trend-container">
                    <TrendingUpIcon fontSize="small" sx={{ color: '#059669' }} />
                    <span className="trend-text">{subValue}</span>
                </div>
            )}
        </div>
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
    </div>
);

const Analytics = ({ selectedPeriod, userId, startDate, endDate }) => {
    const [workHours, setWorkHours] = useState(null);
    const [averageWorkHours, setAverageWorkHours] = useState(null);
    const [analyticsError, setAnalyticsError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const loadAnalyticsData = async () => {
            if (!userId) return;

            setIsLoading(true);
            setAnalyticsError(null);
            setWorkHours(null);
            setAverageWorkHours(null);
            setHasData(false);

            try {
                let start = startDate || new Date();
                let end = endDate || new Date();

                if (!startDate || !endDate) {
                    const today = new Date();
                    start = new Date();
                    end = new Date(today);

                    switch (selectedPeriod) {
                        case 'Last Week':
                            end = new Date(today);
                            start = new Date(today);
                            start.setDate(end.getDate() - 6);
                            break;
                        case 'Last Month':
                            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                            end = new Date(today.getFullYear(), today.getMonth(), 0);
                            break;
                        case 'Last Year':
                            start = new Date(today.getFullYear() - 1, 0, 1);
                            end = new Date(today.getFullYear() - 1, 11, 31);
                            break;
                    }
                }

                const data = await fetchAttendanceData(
                    userId,
                    format(start, 'yyyy-MM-dd'),
                    format(end, 'yyyy-MM-dd')
                );

                const hasValidHours = data.data?.hours &&
                    (data.data.hours.total !== null &&
                        data.data.hours.total !== undefined &&
                        data.data.hours.daily_average !== null &&
                        data.data.hours.daily_average !== undefined);

                if (!hasValidHours) {
                    throw new Error('No work hours data available for selected period');
                }

                if (selectedPeriod === 'Last Week') {
                    data.data.attendance.present = 6;
                    data.data.attendance.absent = 1;
                }

                setWorkHours(data.data.hours.total);
                setAverageWorkHours(data.data.hours.daily_average);
                setHasData(true);
            } catch (error) {
                console.error('Error loading analytics data:', error);
                setAnalyticsError('No work hours data available');
                setHasData(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalyticsData();
    }, [selectedPeriod, userId, startDate, endDate]);

    if (isLoading) {
        return (
            <div className="work-hours-grid">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (analyticsError) {
        return (
            <div className="work-hours-grid">
                <div className="error-message">{analyticsError}</div>
            </div>
        );
    }

    if (!hasData && !isLoading) {
        return (
            <div className="work-hours-grid">
                <div className="no-data-card">
                    <ClockIcon size={32} color="#64748b" />
                    <p className="no-data-text">No work hours data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="work-hours-grid">
            <div className="work-hours-card">
                <div className="icon-container">
                    <ClockIcon size={32} color="#0891b2" />
                </div>
                <h3 className="card-label">Total Hours</h3>
                <p className="card-value">
                    {workHours !== null ? workHours.toFixed(1) : '--'}
                </p>
                <p className="card-unit">hours</p>
            </div>

            <div className="work-hours-card">
                <div className="icon-container">
                    <TimerIcon size={32} color="#059669" />
                </div>
                <h3 className="card-label">Daily Average</h3>
                <p className="card-value">
                    {averageWorkHours !== null ? averageWorkHours.toFixed(1) : '--'}
                </p>
                <p className="card-unit">hours/day</p>
            </div>
        </div>
    );
};

const AnalyticsScreen = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        averageCheckIn: '--:--',
        averageCheckOut: '--:--',
        attendanceRate: '0%',
        trend: '+0%',
    });
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUserId = localStorage.getItem('userid');
                if (storedUserId) {
                    setUserId(parseInt(storedUserId, 10));
                }
            } catch (error) {
                console.error('Error fetching user ID:', error);
                toast.error('Failed to load user information');
            } finally {
                setIsLoadingUser(false);
            }
        };

        fetchUserId();
    }, []);

    const loadData = useCallback(async (period, customStart, customEnd) => {
        if (!userId || (!period && (!customStart || !customEnd))) return;

        setLoading(true);
        setError(null);

        let startDate = customStart || new Date();
        let endDate = customEnd || new Date();

        try {
            if (period === 'Custom' && customStart && customEnd) {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                endDate.setHours(23, 59, 59, 999);
            } else {
                switch (period) {
                    case 'Last Week':
                        startDate.setDate(new Date().getDate() - 7);
                        break;
                    case 'Last Month':
                        startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
                        endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
                        break;
                    case 'Last Year':
                        startDate = new Date(new Date().getFullYear() - 1, 0, 1);
                        endDate = new Date(new Date().getFullYear() - 1, 11, 31);
                        break;
                    default:
                        return;
                }
            }

            const data = await fetchAttendanceData(
                userId,
                format(startDate, 'yyyy-MM-dd'),
                format(endDate, 'yyyy-MM-dd')
            );

            if (!data.data) {
                throw new Error('Invalid data structure in API response');
            }

            setStats({
                totalDays: data.data.attendance.present + data.data.attendance.absent,
                presentDays: data.data.attendance.present,
                absentDays: data.data.attendance.absent,
                averageCheckIn: data.data.timings.average_checkin || '--:--',
                averageCheckOut: data.data.timings.average_checkout || '--:--',
                attendanceRate: `${data.data.attendance.rate}%`,
                trend: data.data.attendance.trend || '+0%',
            });

            setStartDate(startDate);
            setEndDate(endDate);
        } catch (err) {
            console.error('Load data error:', err);
            setError('Failed to load attendance data');
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            loadData(selectedPeriod);
        }
    }, [selectedPeriod, userId, loadData]);

    const handleDateSelect = useCallback((dates) => {
        const [start, end] = dates;
        if (start && end) {
            setStartDate(start);
            setEndDate(end);
            setCalendarVisible(false);
            loadData('Custom', start, end);
        }
    }, [loadData]);

    const resetSelections = () => {
        setSelectedPeriod('Last Week');
        setStartDate(null);
        setEndDate(null);
        setStats({
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            averageCheckIn: '--:--',
            averageCheckOut: '--:--',
            attendanceRate: '0%',
            trend: '+0%',
        });
        setError(null);
        loadData('Last Week');
    };

    if (isLoadingUser) {
        return <div className="loading-spinner" />;
    }

    return (
        <div className="analytics-container">
            <div className="header-container">
                <h1 className="title">Analytics Overview</h1>
                <div className="header-buttons">
                    <Button
                        variant="outlined"
                        color="primary"
                        component={Link}
                        to="/analytics/adminanalytics"
                        className="admin-button"
                    >
                        Go to Admin Analytics
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={resetSelections}
                        className="reset-button"
                        startIcon={<ArrowBackIcon />}
                    >
                        Reset
                    </Button>
                </div>
            </div>

            <div className="filter-container">
                <FormControl fullWidth>
                    <InputLabel>Select Period</InputLabel>
                    <Select
                        value={selectedPeriod}
                        onChange={(e) => {
                            setSelectedPeriod(e.target.value);
                            loadData(e.target.value);
                        }}
                        label="Select Period"
                    >
                        <MenuItem value="Last Week">Last Week</MenuItem>
                        <MenuItem value="Last Month">Last Month</MenuItem>
                        <MenuItem value="Last Year">Last Year</MenuItem>
                        <MenuItem value="Custom">Custom Range</MenuItem>
                    </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => {
                            setStartDate(newValue);
                            if (endDate) {
                                handleDateSelect([newValue, endDate]);
                            }
                        }}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => {
                            setEndDate(newValue);
                            if (startDate) {
                                handleDateSelect([startDate, newValue]);
                            }
                        }}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                </LocalizationProvider>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="stats-grid">
                <StatCard
                    icon={<CalendarIcon sx={{ fontSize: 34, color: '#0891b2' }} />}
                    title="Total Working Days"
                    value={stats.totalDays}
                    subValue={stats.trend}
                    color="#f0f9ff"
                />
                <StatCard
                    icon={<UserCheckIcon sx={{ fontSize: 24, color: '#059669' }} />}
                    title="Present Days"
                    value={stats.presentDays}
                    subValue={null}
                    color="#f0fdf4"
                />
                <StatCard
                    icon={<UserXIcon sx={{ fontSize: 24, color: '#dc2626' }} />}
                    title="Absent Days"
                    value={stats.absentDays}
                    subValue={null}
                    color="#fef2f2"
                />
                <StatCard
                    icon={<ClockIcon sx={{ fontSize: 24, color: '#0891b2' }} />}
                    title="Attendance Rate"
                    value={stats.attendanceRate}
                    subValue={null}
                    color="#f0f9ff"
                />
            </div>

            <h2 className="section-title">Time Analysis</h2>
            <div className="time-stats">
                <div className="time-card">
                    <h3 className="time-label">Average Check-in</h3>
                    <p className="time-value">{stats.averageCheckIn}</p>
                </div>
                <div className="time-card">
                    <h3 className="time-label">Average Check-out</h3>
                    <p className="time-value">{stats.averageCheckOut}</p>
                </div>
            </div>

            <h2 className="section-title">Work Hours</h2>
            <Analytics
                selectedPeriod={selectedPeriod}
                userId={userId}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
    );
};

export default AnalyticsScreen;