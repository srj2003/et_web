// profile.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Edit, Briefcase, Camera, XCircle, User, Award } from 'lucide-react';
import './profile.css';

const ProfileScreen = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [isImageChanged, setIsImageChanged] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');

    // Track which field is being edited
    const [editingField, setEditingField] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = localStorage.getItem('userid');
                if (!userId) {
                    setError('No user ID found');
                    return;
                }

                const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/dashboard.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });

                const result = await response.json();

                if (result.status === 'success') {
                    setUserData(result.data);
                    setEmail(result.data.u_email || '');
                    setPhone(result.data.u_mob || '');
                    setLocation(result.data.u_street_addr || '');
                    setProfileImage(result.data.u_pro_img || null);
                    fetchUserRole(userId);
                } else {
                    setError(result.message || 'Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to fetch user data');
            } finally {
                setLoading(false);
            }
        };

        const fetchUserRole = async (userId) => {
            try {
                const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: parseInt(userId, 10) }),
                });

                const result = await response.json();
                if (result.role_name) {
                    setUserRole(result.role_name);
                } else {
                    setUserRole('Not assigned');
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
                setUserRole('Failed to fetch role');
            }
        };

        fetchUserData();
    }, []);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
                setIsImageChanged(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = (field) => {
        setEditingField(field);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setIsEditing(false);
        // Revert changes if cancelled
        setEmail(userData?.u_email || '');
        setPhone(userData?.u_mob || '');
        setLocation(userData?.u_street_addr || '');
        setProfileImage(userData?.u_pro_img || null);
        setIsImageChanged(false);
    };

    const handleSave = async () => {
        try {
            const userId = localStorage.getItem('userid');
            if (!userId) {
                throw new Error('User ID not found');
            }

            const updateData = {
                userId: userId,
            };

            // Only add changed fields
            if (email !== userData?.u_email && email !== '') { // Only send if changed and not empty
                updateData.u_email = email;
            }
            if (phone !== userData?.u_mob && phone !== '') {
                updateData.u_mob = phone;
            }
            if (location !== userData?.u_street_addr && location !== '') {
                updateData.u_street_addr = location;
            }

            if (isImageChanged && profileImage) {
                updateData.u_pro_img = profileImage;
            }

            // If no data changed and no image changed, no need to call API
            if (Object.keys(updateData).length === 1 && !isImageChanged) { // Only userId is present
                setIsEditing(false);
                setEditingField(null);
                alert('No changes to save.');
                return;
            }


            const response = await fetch(
                'https://demo-expense.geomaticxevs.in/ET-api/profile_user_info_changer.php',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                }
            );

            const result = await response.json();

            if (result.success) {
                setIsEditing(false);
                setIsImageChanged(false);
                setEditingField(null);

                setUserData((prev) => ({
                    ...prev,
                    u_email: email,
                    u_mob: phone,
                    u_street_addr: location,
                    u_pro_img: isImageChanged ? profileImage : prev?.u_pro_img,
                }));

                alert('Profile updated successfully');
            } else {
                throw new Error(result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            alert(error instanceof Error ? error.message : 'Failed to save changes');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <XCircle size={60} className="error-icon" />
                <h2 className="error-text">Failed to Load Profile</h2>
                <p className="error-subtext">{error}</p>
                <p className="error-subtext">Please refresh the page or try again later.</p>
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="dashboard-layout">
            <main className="profile-main-content">
                <header className="profile-page-header">
                    <h1>User Profile</h1>
                    <p>Manage your personal and work information.</p>
                </header>

                <section className="profile-summary-card">
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            <img
                                src={profileImage || '/default-profile.png'}
                                alt="Profile"
                                className="avatar"
                            />
                            <label htmlFor="profile-image-input" className="camera-overlay">
                                <Camera size={240} />
                                <input
                                    id="profile-image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <div className="user-details">
                            <h2 className="user-name">
                                {`${userData.u_fname}${userData.u_mname ? ` ${userData.u_mname} ` : ' '
                                    }${userData.u_lname}`}
                            </h2>
                            <p className="user-id">ID: {userData.user_id}</p>
                            <p className="user-role"><Award size={16} /> {userRole || 'Not assigned'}</p>
                        </div>
                    </div>
                </section>

                <div className="profile-sections-grid">
                    <section className="profile-section">
                        <h3 className="section-title">Contact Information</h3>
                        <div className="info-item">
                            <Mail size={20} className="info-icon" />
                            <div className="info-content">
                                <label className="info-label">Email Address</label>
                                {editingField === 'email' ? (
                                    <input
                                        type="email"
                                        className="edit-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email"
                                    />
                                ) : (
                                    <span className="info-display">{email || 'Not provided'}</span>
                                )}
                            </div>
                            <button className="edit-action-button" onClick={() => handleEditClick('email')}>
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className="info-item">
                            <Phone size={20} className="info-icon" />
                            <div className="info-content">
                                <label className="info-label">Phone Number</label>
                                {editingField === 'phone' ? (
                                    <input
                                        type="tel"
                                        className="edit-input"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <span className="info-display">{userData.u_mob || 'Not provided'}</span>
                                )}
                            </div>
                            <button className="edit-action-button" onClick={() => handleEditClick('phone')}>
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className="info-item">
                            <MapPin size={20} className="info-icon" />
                            <div className="info-content">
                                <label className="info-label">Location</label>
                                {editingField === 'location' ? (
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter location"
                                    />
                                ) : (
                                    <span className="info-display">{userData.u_street_addr || 'Not provided'}</span>
                                )}
                            </div>
                            <button className="edit-action-button" onClick={() => handleEditClick('location')}>
                                <Edit size={16} />
                            </button>
                        </div>
                    </section>

                    <section className="profile-section">
                        <h3 className="section-title">Work Information</h3>
                        <div className="info-item static-info">
                            <Briefcase size={20} className="info-icon" />
                            <div className="info-content">
                                <label className="info-label">Current Role</label>
                                <span className="info-display">{userRole || 'Not assigned'}</span>
                            </div>
                        </div>
                        <div className="info-item static-info">
                            <Calendar size={20} className="info-icon" />
                            <div className="info-content">
                                <label className="info-label">Joined Date</label>
                                <span className="info-display">
                                    {userData.u_created_at
                                        ? new Date(userData.u_created_at).toLocaleDateString()
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {(isEditing || isImageChanged) && (
                    <div className="profile-actions-sticky">
                        <button className="cancel-button" onClick={handleCancelEdit}>
                            Cancel
                        </button>
                        <button className="save-button" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfileScreen;