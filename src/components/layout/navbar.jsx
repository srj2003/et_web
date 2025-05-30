import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
    const [profileImage, setProfileImage] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        // Get profile image from localStorage
        const storedImage = localStorage.getItem('profileImage');
        if (storedImage) {
            setProfileImage(storedImage);
        }
    }, []);

    const notifications = [
        {
            id: 1,
            message: 'New expense request from John Doe',
            time: '5 minutes ago'
        },
        {
            id: 2,
            message: 'Your expense has been approved',
            time: '1 hour ago'
        }
    ];

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link to="/dashboard" className="navbar-item">Dashboard</Link>
                <Link to="/users" className="navbar-item">Users</Link>
                <Link to="/reports" className="navbar-item">Analytics</Link>
                <Link to="/team" className="navbar-item">Holidays</Link>
            </div>

            <div className="navbar-right">
                <div className="notification-container">
                    <button
                        className="notification-button"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        {notifications.length > 0 && (
                            <span className="notification-badge">{notifications.length}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            {notifications.map(notification => (
                                <div key={notification.id} className="notification-item">
                                    <div className="notification-content">
                                        {notification.message}
                                    </div>
                                    <div className="notification-time">
                                        {notification.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="profile-container">
                    <button
                        className="profile-button"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    >
                        <img
                            src={profileImage || '/default-avatar.png'}
                            alt="Profile"
                            className="profile-image"
                        />
                    </button>

                    {showProfileDropdown && (
                        <div className="profile-dropdown">
                            <Link to="/settings" className="profile-dropdown-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                Settings
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
