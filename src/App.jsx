import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginWeb from './components/loginpage/loginpage';
import Layout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/dashboard';

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
          <Route path="/expenses/add" element={<div>Add Expense Page</div>} />
          <Route path="/expenses/my" element={<div>My Expenses Page</div>} />
          <Route path="/expenses/all" element={<div>All Expenses Page</div>} />
          <Route path="/expenses/manage" element={<div>Manage Expenses Page</div>} />
          <Route path="/project/manage" element={<div>Manage Project Page</div>} />
          <Route path="/requisition/add" element={<div>Add Requisition Page</div>} />
          <Route path="/requisition/my" element={<div>My Requisitions Page</div>} />
          <Route path="/requisition/all" element={<div>All Requisitions Page</div>} />
          <Route path="/requisition/manage" element={<div>Manage Requisitions Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>






  );
}

export default App;
