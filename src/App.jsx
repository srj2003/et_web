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
import UserAttendance from "./components/attendance/userattendance";
import AllLeaves from "./components/leavespage/allleaves/allleaves";
import ManageLeaves from "./components/leavespage/requestedleaves/requestedleaves";
import MyLeaves from "./components/leavespage/myleaves/myleaves";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWeb />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance/my" element={<div>My Attendance Page</div>} />
          <Route path="/attendance/user_attendance" element={<UserAttendance/>} />
          <Route path="/leaves/add" element={<AddLeaves />} />
          <Route path="/leaves/my" element={<MyLeaves/>} />
          <Route path="/leaves/all" element={<AllLeaves/>} />
          <Route path="/leaves/manage" element={<ManageLeaves/>} />
          <Route path="/expenses/addexpense" element={<AddExpense />} />
          <Route path="/expenses/myexpense" element={<MyExpense />} />
          <Route path="/expenses/allexpenses" element={<AllExpenses />} />
          <Route path="/expenses/requestedexpenses" element={<RequestedExpenses />} />
          <Route path="/requisition/add" element={<RequisitionFormWeb />} />
          <Route path="/requisition/my" element={<MyRequisitions />} />
          <Route path="/requisition/all" element={<AllRequisitions />} />
          <Route path="/requisition/manage" element={<RequisitionsWeb />} />
          <Route path="/users" element={<Users />} />
          <Route path="/analytics/useranalytics" element={<UserAnalytics/>} />
          <Route path="/analytics/adminanalytics" element={<AdminAnalytics/>} />
           <Route path="/accounts/expensereport" element={<ExpenseReport />} />
          <Route
            path="/project/manage"
            element={<ManageProjectExpenses/>}
          />
        </Route>
        
      </Routes>
    </BrowserRouter>

    // <UserAnalytics/>
  );
}

export default App;