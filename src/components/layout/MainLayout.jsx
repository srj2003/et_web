import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import "./MainLayout.css";

const MainLayout = () => {
  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
      <div className="sidebar-overlay" onClick={closeSidebar}></div>
    </div>
  );
};

export default MainLayout;
