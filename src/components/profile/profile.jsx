// profile.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Edit, Briefcase, Camera, XCircle, User, Award } from 'lucide-react';
import styles from './Profile.module.css';

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
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading profile information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <XCircle size={60} className={styles.errorIcon} />
                <h2 className={styles.errorText}>Failed to Load Profile</h2>
                <p className={styles.errorSubtext}>{error}</p>
                <p className={styles.errorSubtext}>Please refresh the page or try again later.</p>
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className={styles.profileContainer}>
            <main className={styles.mainContent}>
                <header className={styles.pageHeader}>
                    <h1>User Profile</h1>
                    <p>Manage your personal and work information.</p>
                </header>

                <section className={styles.summaryCard}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            <img
                                src={profileImage || '/default-profile.png'}
                                alt="Profile"
                                className={styles.avatar}
                            />
                            <label htmlFor="profile-image-input" className={styles.cameraOverlay}>
                                <Camera size={24} />
                                <input
                                    id="profile-image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <div className={styles.userDetails}>
                            <h2 className={styles.userName}>
                                {`${userData.u_fname}${userData.u_mname ? ` ${userData.u_mname} ` : ' '}${userData.u_lname}`}
                            </h2>
                            <p className={styles.userId}>ID: {userData.user_id}</p>
                            <p className={styles.userRole}>
                                <Award size={16} /> {userRole || 'Not assigned'}
                            </p>
                        </div>
                    </div>
                </section>

                <div className={styles.sectionsGrid}>
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Contact Information</h3>
                        <div className={styles.infoItem}>
                            <Mail size={20} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <label className={styles.infoLabel}>Email Address</label>
                                {editingField === 'email' ? (
                                    <input
                                        type="email"
                                        className={styles.editInput}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email"
                                    />
                                ) : (
                                    <span className={styles.infoDisplay}>{email || 'Not provided'}</span>
                                )}
                            </div>
                            <button
                                className={styles.editButton}
                                onClick={() => handleEditClick('email')}
                            >
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className={styles.infoItem}>
                            <Phone size={20} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <label className={styles.infoLabel}>Phone Number</label>
                                {editingField === 'phone' ? (
                                    <input
                                        type="tel"
                                        className={styles.editInput}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <span className={styles.infoDisplay}>{userData.u_mob || 'Not provided'}</span>
                                )}
                            </div>
                            <button className={styles.editButton} onClick={() => handleEditClick('phone')}>
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className={styles.infoItem}>
                            <MapPin size={20} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <label className={styles.infoLabel}>Location</label>
                                {editingField === 'location' ? (
                                    <input
                                        type="text"
                                        className={styles.editInput}
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter location"
                                    />
                                ) : (
                                    <span className={styles.infoDisplay}>{userData.u_street_addr || 'Not provided'}</span>
                                )}
                            </div>
                            <button className={styles.editButton} onClick={() => handleEditClick('location')}>
                                <Edit size={16} />
                            </button>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Work Information</h3>
                        <div className={styles.infoItem}>
                            <Briefcase size={20} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <label className={styles.infoLabel}>Current Role</label>
                                <span className={styles.infoDisplay}>{userRole || 'Not assigned'}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <Calendar size={20} className={styles.infoIcon} />
                            <div className={styles.infoContent}>
                                <label className={styles.infoLabel}>Joined Date</label>
                                <span className={styles.infoDisplay}>
                                    {userData.u_created_at
                                        ? new Date(userData.u_created_at).toLocaleDateString()
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {(isEditing || isImageChanged) && (
                    <div className={styles.actionBar}>
                        <button
                            className={styles.cancelButton}
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfileScreen;