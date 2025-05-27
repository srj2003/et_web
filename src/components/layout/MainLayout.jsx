import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

const Layout = () => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        overflow: 'auto',
        height: '100vh',
        position: 'relative',
        // marginLeft: '320px' // Match sidebar width
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;