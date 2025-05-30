import React, { useState, useCallback, useEffect } from 'react';
import { Users, UserCheck, UserX, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { TextField, Button } from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { VictoryChart, VictoryLine, VictoryBar, VictoryAxis, VictoryTheme, VictoryVoronoiContainer, VictoryTooltip, VictoryPie } from 'victory';
import { Link } from 'react-router-dom';
import './admin_analytics.css';

const AdminAnalytics = () => {
    const [showAllActive, setShowAllActive] = useState(false);
    const [showAllInactive, setShowAllInactive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userRange, setUserRange] = useState("today");
    const [expenseRange, setExpenseRange] = useState("today");
    const [userDateRange, setUserDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(),
    });
    const [expenseDateRange, setExpenseDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(),
    });
    const [showUserStartPicker, setShowUserStartPicker] = useState(false);
    const [showUserEndPicker, setShowUserEndPicker] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [showExpenseDetails, setShowExpenseDetails] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [userData, setUserData] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
    });
    const [expenseData, setExpenseData] = useState({
        monthlyExpenses: { labels: [], data: [] },
        expenseCategories: { labels: [], data: [] },
        totalExpenses: 0,
    });

    const fetchAnalyticsData = useCallback(async (dataType, dateRange) => {
        try {
            const response = await fetch(
                `https://demo-expense.geomaticxevs.in/ET-api/admin_analytics.php?dataType=${dataType}&range=${dateRange}`
            );
            const data = await response.json();
            if (dataType === "users") {
                setUserData(data);
            } else {
                setExpenseData(data);
            }
        } catch (error) {
            console.error(`Error fetching ${dataType} data:`, error);
            toast.error(`Failed to fetch ${dataType} data`);
        }
    }, []);

    useEffect(() => {
        const fetchData = () => {
            if (customDateRange.startDate && customDateRange.endDate) {
                const startDate = format(customDateRange.startDate, "yyyy-MM-dd");
                const endDate = format(customDateRange.endDate, "yyyy-MM-dd");
                fetchAnalyticsData("users", `custom&start=${startDate}&end=${endDate}`);
                fetchAnalyticsData("expenses", `custom&start=${startDate}&end=${endDate}`);
            } else {
                fetchAnalyticsData("users", userRange);
                fetchAnalyticsData("expenses", expenseRange);
            }
        };

        fetchData();
    }, [userRange, expenseRange, customDateRange, fetchAnalyticsData]);

    const handleRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);

            if (customDateRange.startDate && customDateRange.endDate) {
                const startDate = format(customDateRange.startDate, "yyyy-MM-dd");
                const endDate = format(customDateRange.endDate, "yyyy-MM-dd");
                await Promise.all([
                    fetchAnalyticsData("users", `custom&start=${startDate}&end=${endDate}`),
                    fetchAnalyticsData("expenses", `custom&start=${startDate}&end=${endDate}`),
                ]);
            } else {
                await Promise.all([
                    fetchAnalyticsData("users", userRange),
                    fetchAnalyticsData("expenses", expenseRange),
                ]);
            }
            toast.success('Data refreshed successfully');
        } catch (error) {
            console.error("Error refreshing data:", error);
            toast.error('Failed to refresh data');
        } finally {
            setIsRefreshing(false);
        }
    }, [userRange, expenseRange, customDateRange, fetchAnalyticsData]);

    const pieChartData = [
        {
            x: "Active Users",
            y: userData.activeUsers,
            fill: "#7c3aed",
        },
        {
            x: "Inactive Users",
            y: userData.inactiveUsers,
            fill: "#c4b5fd",
        },
    ];

    const handleUserRangeChange = (range) => {
        setUserRange(range);
        setCustomDateRange({ startDate: null, endDate: null });
    };

    const handleExpenseRangeChange = (range) => {
        setExpenseRange(range);
        setCustomDateRange({ startDate: null, endDate: null });
    };

    const handleDateSelect = useCallback((dates) => {
        const [start, end] = dates;
        if (start && end) {
            setCustomDateRange({
                startDate: start,
                endDate: end,
            });
            setCalendarVisible(false);
        }
    }, []);

    const handleUserDownload = () => {
        toast.info('Downloading user analytics...');
    };

    const handleUserViewDetails = () => {
        window.location.href = '/userattendance';
    };

    const handleExpenseDownload = () => {
        toast.info('Downloading expense analytics...');
    };

    const handleExpenseViewDetails = () => {
        let dateRangeToPass;

        if (customDateRange.startDate && customDateRange.endDate) {
            dateRangeToPass = {
                type: "custom",
                startDate: customDateRange.startDate.toISOString(),
                endDate: customDateRange.endDate.toISOString(),
            };
        } else {
            dateRangeToPass = {
                type: expenseRange,
                startDate: null,
                endDate: null,
            };
        }

        window.location.href = `/allexpense?dateRange=${JSON.stringify(dateRangeToPass)}`;
    };

    return (
        <div className="admin-analytics-container">
            <div className="header">
                <h1>Admin Analytics</h1>
                <div className="header-buttons">
                    <Button
                        variant="outlined"
                        color="primary"
                        component={Link}
                        to="/analytics/useranalytics"
                        className="user-button"
                    >
                        Go to User Analytics
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleRefresh}
                        startIcon={<RefreshCw size={20} />}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="date-filter">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={customDateRange.startDate}
                        onChange={handleDateSelect}
                        renderInput={(params) => <TextField {...params} />}
                    />
                    <DatePicker
                        label="End Date"
                        value={customDateRange.endDate}
                        onChange={handleDateSelect}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
            </div>

            <div className="analytics-content">
                <div className="analytics-section">
                    <h2 className="section-title">User Analytics</h2>

                    <div className="range-selector">
                        {["today", "week", "month", "year"].map((range) => (
                            <button
                                key={range}
                                className={`range-button ${userRange === range ? 'active' : ''}`}
                                onClick={() => handleUserRangeChange(range)}
                            >
                                {range === "today" ? "Today" :
                                    range === "week" ? "Last Week" :
                                        range === "month" ? "Last Month" : "Last Year"}
                            </button>
                        ))}
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">User Activity</h3>
                        <div className="pie-chart-container">
                            <VictoryPie
                                data={pieChartData}
                                colorScale={["#7c3aed", "#c4b5fd"]}
                                innerRadius={70}
                                labelRadius={({ innerRadius }) => (innerRadius + 40)}
                                style={{ labels: { fill: "white", fontSize: 14, fontWeight: "bold" } }}
                            />
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: "#7c3aed" }}></span>
                                <span className="legend-text">Active Users ({userData.activeUsers})</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: "#c4b5fd" }}></span>
                                <span className="legend-text">Inactive Users ({userData.inactiveUsers})</span>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="action-button download" onClick={handleUserDownload}>
                            Download
                        </button>
                        <button className="action-button view" onClick={handleUserViewDetails}>
                            View Details
                        </button>
                    </div>
                </div>

                <div className="analytics-section">
                    <h2 className="section-title">Expense Analytics</h2>

                    <div className="range-selector">
                        {["today", "week", "month", "year"].map((range) => (
                            <button
                                key={range}
                                className={`range-button ${expenseRange === range ? 'active' : ''}`}
                                onClick={() => handleExpenseRangeChange(range)}
                            >
                                {range === "today" ? "Today" :
                                    range === "week" ? "Last Week" :
                                        range === "month" ? "Last Month" : "Last Year"}
                            </button>
                        ))}
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">Company Expenses</h3>
                        <div className="line-chart-container">
                            <VictoryChart
                                theme={VictoryTheme.material}
                                height={350}
                                padding={{ top: 50, bottom: 50, left: 60, right: 80 }}
                            >
                                <VictoryAxis
                                    tickFormat={(t) => t}
                                    style={{
                                        tickLabels: { fontSize: 10, padding: 5 },
                                        grid: { stroke: "#e2e8f0" },
                                    }}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    tickFormat={(t) => `₹${t / 1000}k`}
                                    style={{
                                        tickLabels: { fontSize: 10, padding: 5 },
                                        grid: { stroke: "#e2e8f0" },
                                    }}
                                />
                                <VictoryLine
                                    data={expenseData.monthlyExpenses.data.map((y, index) => ({
                                        x: expenseData.monthlyExpenses.labels[index],
                                        y,
                                    }))}
                                    style={{
                                        data: {
                                            stroke: "#7c3aed",
                                            strokeWidth: 3,
                                        },
                                    }}
                                />
                            </VictoryChart>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">Expense Categories</h3>
                        <div className="bar-chart-container">
                            <VictoryChart
                                theme={VictoryTheme.material}
                                domainPadding={20}
                                height={350}
                                padding={{ top: 50, bottom: 50, left: 60, right: 80 }}
                            >
                                <VictoryAxis
                                    tickFormat={(t) => t}
                                    style={{
                                        tickLabels: {
                                            fontSize: 10,
                                            angle: -45,
                                            textAnchor: "end",
                                            padding: 5,
                                        },
                                        grid: { stroke: "transparent" },
                                    }}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    tickFormat={(t) => `₹${(t / 1000).toFixed(1)}k`}
                                    style={{
                                        tickLabels: { fontSize: 10, padding: 5 },
                                        grid: { stroke: "#e2e8f0" },
                                    }}
                                />
                                <VictoryBar
                                    data={expenseData.expenseCategories.data.map((y, index) => ({
                                        x: expenseData.expenseCategories.labels[index],
                                        y,
                                    }))}
                                    style={{
                                        data: {
                                            fill: "#7c3aed",
                                            width: 20,
                                        },
                                    }}
                                />
                            </VictoryChart>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="action-button download" onClick={handleExpenseDownload}>
                            Download
                        </button>
                        <button className="action-button view" onClick={handleExpenseViewDetails}>
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;