import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import LoginWeb from "./components/loginpage/loginpage";
import Dashboard from "./components/dashboard/dashboard";
import AddRequisition from "./components/requisitionpage/addrequisition";
import RequisitionsWeb from "./components/requisitionpage/requested_requisition";
import AllRequisitions from "./components/requisitionpage/allrequisition";
import MyRequisitions from "./components/requisitionpage/myrequisition";
// reuse the same styles

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWeb />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/requisition/add" element={<AddRequisition />} />
        <Route path="/requisition/manage" element={<RequisitionsWeb />} />
        <Route path="/requisition/all" element={<AllRequisitions />} />
        <Route path="/requisition/my" element={<MyRequisitions />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
