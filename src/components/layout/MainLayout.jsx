import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;