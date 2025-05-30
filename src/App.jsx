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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWeb />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance/my" element={<div>My Attendance Page</div>} />
          <Route path="/attendance/user" element={<div>User Attendance Page</div>} />
          <Route path="/leaves/add" element={<div>Add Leave Page</div>} />
          <Route path="/leaves/my" element={<div>My Leaves Page</div>} />
          <Route path="/leaves/all" element={<div>All Leaves Page</div>} />
          <Route path="/leaves/manage" element={<div>Manage Leaves Page</div>} />
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
        </Route>
      </Routes>
    </BrowserRouter>

    // <UserAnalytics/>
  );
}

export default App;
