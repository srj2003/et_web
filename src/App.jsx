import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginWeb from "./components/loginpage/loginpage";
import Layout from "./components/layout/MainLayout";
import Dashboard from "./components/dashboard/dashboard";
import AddExpense from "./components/expenses/add_expense/add_expense";
import MyExpense from "./components/expenses/my_expense/my_expense";
import AllExpenses from "./components/expenses/all_expenses/all_expenses";
import RequestedExpenses from "./components/expenses/requested_expenses/requested_expenses";
import RequisitionFormWeb from "./components/requisitionpage/addrequisition";
import AllRequisitions from "./components/requisitionpage/allrequisition";
import MyRequisitions from "./components/requisitionpage/myrequisition";
import RequisitionsWeb from "./components/requisitionpage/requested_requisition";
import Users from "./components/users/users";
import UserAnalytics from "./components/analytics/user_analytics/user_analytics"
import AdminAnalytics from "./components/analytics/admin_analytics/admin_analytics";
import ManageProjectExpenses from "./components/project/manage_project_expenses";
import AddLeaves from "./components/leavespage/addleaves/addleaves";
import ExpenseReport from "./components/accounts/expense_report/expense_report";
import UserAttendance from "./components/attendance/user_attendance/userattendance";
import AllLeaves from "./components/leavespage/allleaves/allleaves";
import ManageLeaves from "./components/leavespage/requestedleaves/requestedleaves";
import MyLeaves from "./components/leavespage/myleaves/myleaves";
import RequisitionReport from "./components/accounts/requisition_report/requisition_report";
import ProfileScreen from "./components/profile/profile";
import MyAttendance from './components/attendance/my_attendance/myattendance';
import Help from "./components/help/help";
import HolidayList from "./components/holiday/holiday";
import { ThemeProvider, createTheme } from '@mui/material/styles';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWeb />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance/myattendance" element={<MyAttendance/>} />
          <Route path="/attendance/userattendance" element={<UserAttendance />} />
          <Route path="/leaves/add" element={<AddLeaves />} />
          <Route path="/leaves/my" element={<MyLeaves />} />
          <Route path="/leaves/all" element={<AllLeaves />} />
          <Route path="/leaves/manage" element={<ManageLeaves />} />
          <Route path="/expenses/addexpense" element={<AddExpense />} />
          <Route path="/expenses/myexpense" element={<MyExpense />} />
          <Route path="/expenses/allexpenses" element={<AllExpenses />} />
          <Route path="/expenses/requestedexpenses" element={<RequestedExpenses />} />
          <Route path="/requisition/add" element={<RequisitionFormWeb />} />
          <Route path="/requisition/my" element={<MyRequisitions />} />
          <Route path="/requisition/all" element={<AllRequisitions />} />
          <Route path="/requisition/manage" element={<RequisitionsWeb />} />
          <Route path="/users" element={<Users />} />
          <Route path="/analytics/useranalytics" element={<UserAnalytics />} />
          <Route path="/analytics/adminanalytics" element={<AdminAnalytics />} />
          <Route path="/accounts/expensereport" element={<ExpenseReport />} />
          <Route path="/accounts/requisitionreport" element={<RequisitionReport />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/help" element={<Help />} />
          <Route
            path="/project/manage"
            element={<ManageProjectExpenses />}
          />
          <Route path="/holiday" element={<HolidayList />} />
        </Route>

      </Routes>
    </BrowserRouter>

    // <UserAnalytics/>
  );
}

export default App;