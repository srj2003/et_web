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

// Color palette for the light theme
const colors = {
    primary: '#4361ee',
    secondary: '#3a0ca3',
    accent: '#f72585',
    success: '#4cc9f0',
    warning: '#f8961e',
    error: '#ef233c',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#212529',
    muted: '#6c757d'
};

const fetchAttendanceData = async (userId, startDate, endDate) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/fetch_analytics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
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
    <div className="analytics-stat-card" style={{ 
        backgroundColor: color || colors.card,
        borderLeft: `6px solid ${colors.primary}`
    }}>
        <div className="analytics-stat-card-header">
            <div className="stat-icon" style={{ color: colors.primary }}>
                {icon}
            </div>
            {/* {subValue && (
                <div className="trend-container" style={{ 
                    backgroundColor: subValue.startsWith('+') ? 'rgba(76, 201, 240, 0.1)' : 'rgba(239, 35, 60, 0.1)',
                    color: subValue.startsWith('+') ? colors.success : colors.error
                }}>
                    <TrendingUpIcon fontSize="small" />
                    <span className="trend-text">{subValue}</span>
                </div>
            )} */}
            <h3 className="stat-card-title" style={{ color: colors.muted }}>{title}</h3>
        </div>    
        <div>    
            <p className="stat-card-value" style={{ color: colors.text }}>{value}</p>
        </div>
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
                <div className="loading-spinner" style={{ borderColor: `${colors.primary} transparent transparent transparent` }} />
            </div>
        );
    }

    if (analyticsError) {
        return (
            <div className="work-hours-grid">
                <div className="error-message" style={{ backgroundColor: 'rgba(239, 35, 60, 0.1)', color: colors.error }}>
                    {analyticsError}
                </div>
            </div>
        );
    }

    if (!hasData && !isLoading) {
        return (
            <div className="work-hours-grid">
                <div className="no-data-card" style={{ backgroundColor: colors.card }}>
                    <ClockIcon style={{ fontSize: 32, color: colors.muted }} />
                    <p className="no-data-text" style={{ color: colors.muted }}>No work hours data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="work-hours-grid">
            <div className="work-hour-card" style={{ backgroundColor: colors.card }}>
                {/* <div className="icon-container">
                    <ClockIcon style={{ fontSize: 32, color: colors.primary }} />
                </div> */}
                <h3 className="card-label" style={{ color: colors.muted }}>Total Hours</h3>
                <p className="card-value" style={{ color: colors.text }}>
                    {workHours !== null ? workHours.toFixed(1) : '--'}
                </p>
                <p className="card-unit" style={{ color: colors.muted }}>hours</p>
            </div>

            <div className="work-hour-card" style={{ backgroundColor: colors.card }}>
                {/* <div className="icon-container">
                    <TimerIcon style={{ fontSize: 32, color: colors.primary }} />
                </div> */}
                <h3 className="card-label" style={{ color: colors.muted }}>Daily Average</h3>
                <p className="card-value" style={{ color: colors.text }}>
                    {averageWorkHours !== null ? averageWorkHours.toFixed(1) : '--'}
                </p>
                <p className="card-unit" style={{ color: colors.muted }}>hours/day</p>
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
    const [roleId, setRoleId] = useState(null);
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
                const storedRoleId = localStorage.getItem('roleId');
                if (storedUserId) {
                    setUserId(parseInt(storedUserId, 10));
                }
                if (storedRoleId) {
                    setRoleId(parseInt(storedRoleId, 10));
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
        return <div className="loading-spinner" style={{ borderColor: `${colors.primary} transparent transparent transparent` }} />;
    }

    return (
        <div className="analytics-container" style={{ backgroundColor: colors.background }}>
            <div className="header-container" style={{ 
                backgroundColor: colors.card,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}>
                <h1 className="title" style={{ 
                    color: colors.text,
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                }}>
                    Analytics Overview
                </h1>
                <div className="header-buttons">
                    {[1, 2, 3, 4, 8].includes(roleId) && (
                        <Button
                            variant="outlined"
                            style={{ 
                                borderColor: colors.primary,
                                color: colors.primary,
                                borderRadius: '12px',
                                fontWeight: 600
                            }}
                            component={Link}
                            to="/analytics/adminanalytics"
                            className="admin-button"
                        >
                            Go to Admin Analytics
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        style={{ 
                            borderColor: colors.muted,
                            color: colors.muted,
                            borderRadius: '12px',
                            fontWeight: 600
                        }}
                        onClick={resetSelections}
                        className="reset-button"
                        startIcon={<ArrowBackIcon />}
                    >
                        Reset
                    </Button>
                </div>
            </div>

            <div className="filter-container" style={{ 
                backgroundColor: colors.card,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}>
                <FormControl fullWidth className='range-selection'>
                    <InputLabel style={{ color: colors.muted}}>Select Period</InputLabel>
                    <Select
                            className="selection-dropdown"
                            value={selectedPeriod}
                            onChange={(e) => {
                                setSelectedPeriod(e.target.value);
                                loadData(e.target.value);
                            }}
                            label="Select Period"
                            style={{ color: colors.text }}
                            MenuProps={{
                                PaperProps: {
                                style: {
                                    borderRadius: 12,
                                    backgroundColor: '#1e1b2e',
                                    color: '#fff',
                                },
                                },
                            }}
                            >
                            <MenuItem value="Last Week">🗓️ Last Week</MenuItem>
                            <MenuItem value="Last Month">📆 Last Month</MenuItem>
                            <MenuItem value="Last Year">📅 Last Year</MenuItem>
                            <MenuItem value="Custom">✨ Custom Range</MenuItem>
                            </Select>

                </FormControl>
                <div className='date-picker-container'>
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
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    style={{ color: colors.text }}
                                />
                            )}
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
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    style={{ color: colors.text }}
                                />
                            )}
                        />
                    </LocalizationProvider>
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ 
                    backgroundColor: 'rgba(239, 35, 60, 0.1)',
                    color: colors.error
                }}>
                    {error}
                </div>
            )}
            <div className="analytics-main-row">
                {/* Left: Stat Cards 2x2 grid */}
                <div className="analytics-stat-cards-col">
                    <div className="analytics-stat-cards-grid">
                        <StatCard
                            icon={<CalendarIcon style={{ fontSize: 34 }} />}
                            title="Total Working Days"
                            value={stats.totalDays}
                            subValue={stats.trend}
                        />
                        <StatCard
                            icon={<UserCheckIcon style={{ fontSize: 24 }} />}
                            title="Present Days"
                            value={stats.presentDays}
                            subValue={null}
                        />
                        <StatCard
                            icon={<UserXIcon style={{ fontSize: 24 }} />}
                            title="Absent Days"
                            value={stats.absentDays}
                            subValue={null}
                        />
                        <StatCard
                            icon={<ClockIcon style={{ fontSize: 24 }} />}
                            title="Attendance Rate"
                            value={stats.attendanceRate}
                            subValue={null}
                        />
                    </div>
                </div>
                {/* Right: Time Analysis and Work Hours in the same container */}
                <div className="analytics-timework-col">
                    <div className="analytics-timework-combined-section">
                        <div className="analytics-timework-titles-row">
                            <h2 className="section-title" style={{ color: colors.text }}>Time Analysis</h2>
                            <h2 className="section-title" style={{ color: colors.text }}>Work Hours</h2>
                        </div>
                        <div className="analytics-timework-content-row">
                            <div className="time-stats">
                                <div className="analytics-time-card" style={{ backgroundColor: colors.card }}>
                                    <h3 className="time-label" style={{ color: colors.muted }}>Average Check-in</h3>
                                    <p className="time-value" style={{ color: colors.text }}>{stats.averageCheckIn}</p>
                                </div>
                                <div className="analytics-time-card" style={{ backgroundColor: colors.card }}>
                                    <h3 className="time-label" style={{ color: colors.muted }}>Average Check-out</h3>
                                    <p className="time-value" style={{ color: colors.text }}>{stats.averageCheckOut}</p>
                                </div>
                            </div>
                            <div >
                                <Analytics
                                    selectedPeriod={selectedPeriod}
                                    userId={userId}
                                    startDate={startDate}
                                    endDate={endDate}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsScreen;