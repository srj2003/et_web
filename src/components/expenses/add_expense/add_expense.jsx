import React, { useState, useEffect } from 'react';
import './add_expense.css';
import { Calendar, Upload, X, Search, Plus, Trash2, Edit2 } from 'lucide-react';

const ExpenseFormWeb = () => {
    const [userData, setUserData] = useState({
        userId: '',
        role: '',
        firstName: '',
        middleName: '',
        lastName: '',
    });
    const [expenseTitle, setExpenseTitle] = useState('');
    const [currentExpense, setCurrentExpense] = useState({
        id: Math.random().toString(36).substring(7),
        title: '',
        type: null,
        description: '',
        amount: 0,
        remarks: '',
        billDate: '',
    });
    const [expenses, setExpenses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [submittedToCategory, setSubmittedToCategory] = useState('');
    const [submittedToName, setSubmittedToName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [headItems, setHeadItems] = useState([]);
    const [expenseHeadValue, setExpenseHeadValue] = useState(null);
    const [showExpenseHeadModal, setShowExpenseHeadModal] = useState(false);
    const [expenseTypeItems, setExpenseTypeItems] = useState([]);
    const [expenseType, setExpenseType] = useState(null);
    const [showExpenseTypeModal, setShowExpenseTypeModal] = useState(false);
    const [showBillDatePicker, setShowBillDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentDate] = useState(new Date().toLocaleString());
    const [currentLocation, setCurrentLocation] = useState({
        latitude: '0',
        longitude: '0',
    });

    useEffect(() => {
        const loadUserData = async () => {
            setIsLoadingUser(true);
            try {
                const userId = localStorage.getItem('userid');
                if (!userId) {
                    throw new Error('User ID not found');
                }

                const roleResponse = await fetch(
                    'https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ user_id: userId }),
                    }
                );

                const roleData = await roleResponse.json();
                if (!roleData.role_name) {
                    throw new Error('Role not found');
                }

                const userResponse = await fetch(
                    'https://demo-expense.geomaticxevs.in/ET-api/dashboard.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId }),
                    }
                );

                const userData = await userResponse.json();
                if (userData.status !== 'success' || !userData.data) {
                    throw new Error('User details not found');
                }

                setUserData({
                    userId: userId,
                    role: roleData.role_name,
                    firstName: userData.data.u_fname || '',
                    middleName: userData.data.u_mname || '',
                    lastName: userData.data.u_lname || '',
                });
            } catch (error) {
                console.error('Failed to load user data:', error);
                alert('Failed to load user information');
            } finally {
                setIsLoadingUser(false);
            }
        };
        loadUserData();
    }, []);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch(
                    'https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_roles=true'
                );
                const data = await res.json();
                if (data.status === 'success') {
                    setRoles(
                        data.roles.map((role) => ({
                            label: role.label,
                            value: String(role.value),
                        }))
                    );
                }
            } catch (error) {
                console.error('Error fetching roles', error);
            }
        };

        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            const fetchUsers = async () => {
                try {
                    const res = await fetch(
                        `https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?role_id=${selectedRole}`
                    );
                    const data = await res.json();
                    if (data.status === 'success') {
                        setUsers(
                            data.users.map((user) => ({
                                label: user.name,
                                value: user.id,
                            }))
                        );
                    }
                } catch (error) {
                    console.error('Error fetching users', error);
                }
            };

            fetchUsers();
        }
    }, [selectedRole]);

    useEffect(() => {
        const getLocation = async () => {
            try {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setCurrentLocation({
                                latitude: position.coords.latitude.toString(),
                                longitude: position.coords.longitude.toString(),
                            });
                        },
                        (error) => {
                            console.error('Error getting location:', error);
                            alert('Location permission is required');
                        }
                    );
                }
            } catch (error) {
                console.error('Error getting location:', error);
            }
        };

        getLocation();
    }, []);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const typesResponse = await fetch(
                    'https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_types=true'
                );
                const typesData = await typesResponse.json();
                if (typesData.status === 'success') {
                    setHeadItems(typesData.data);
                }

                const headsResponse = await fetch(
                    'https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_heads=true'
                );
                const headsData = await headsResponse.json();
                if (headsData.status === 'success') {
                    setExpenseTypeItems(headsData.data);
                }
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
            }
        };

        fetchDropdownData();
    }, []);

    const handleAddExpense = () => {
        if (!expenseType) {
            alert('Please select an expense type');
            return;
        }

        if (!currentExpense.amount || !expenseTitle || !expenseType || !currentExpense.billDate) {
            alert('Please fill all required fields');
            return;
        }

        const expenseToAdd = {
            ...currentExpense,
            id: editingId || Math.random().toString(36).substring(7),
            title: expenseTitle,
            type: expenseType,
        };

        if (editingId) {
            setExpenses(expenses.map((exp) => (exp.id === editingId ? expenseToAdd : exp)));
            setEditingId(null);
        } else {
            setExpenses([...expenses, expenseToAdd]);
        }

        resetForm();
    };

    const handleEditExpense = (id) => {
        const expenseToEdit = expenses.find((exp) => exp.id === id);
        if (expenseToEdit) {
            setCurrentExpense(expenseToEdit);
            setExpenseTitle(expenseToEdit.title);
            setExpenseType(expenseToEdit.type);
            setEditingId(id);
        }
    };

    const handleRemoveExpense = (id) => {
        setExpenses(expenses.filter((exp) => exp.id !== id));
    };

    const handleFileUpload = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            if (type === 'bill') {
                setCurrentExpense({
                    ...currentExpense,
                    billFile: {
                        uri: URL.createObjectURL(file),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                    },
                });
            } else {
                setCurrentExpense({
                    ...currentExpense,
                    productImage: {
                        uri: URL.createObjectURL(file),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                    },
                });
            }
        }
    };

    const resetForm = () => {
        setCurrentExpense({
            id: Math.random().toString(36).substring(7),
            title: '',
            type: null,
            description: '',
            amount: 0,
            remarks: '',
            billDate: '',
        });
        setExpenseType(null);
        setSelectedRole(null);
        setSelectedUser(null);
        setUsers([]);
        setSearchQuery('');
    };

    const handleSubmitAllExpenses = async () => {
        if (expenses.length === 0) {
            alert('Please add at least one expense before submitting');
            return;
        }
        if (expenseType) {
            alert('Please add the expense form before submitting');
            return;
        }
        if (!expenseHeadValue) {
            alert('Please select an expense head');
            return;
        }
        if (!selectedUser || !selectedRole) {
            alert('Please select who to submit to');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append('expense_track_title', expenseTitle || '');
            formData.append('expense_type_id', String(expenseHeadValue || ''));
            formData.append('expense_total_amount', String(totalAmount || 0));
            formData.append('expense_track_app_rej_remarks', '');
            formData.append('expense_track_create_lat', currentLocation.latitude || '0');
            formData.append('expense_track_create_long', currentLocation.longitude || '0');
            formData.append('expense_track_created_by', String(userData.userId || ''));
            formData.append('expense_track_submitted_to', String(selectedUser || ''));

            const details = expenses.map((expense, index) => ({
                expense_head_id: Number(expense.type || 0),
                expense_product_name: expense.description || '',
                expense_product_qty: 1,
                expense_product_unit: 'Unit',
                expense_product_desc: expense.remarks || '',
                expense_product_sl_no: `SL${String(index + 1).padStart(3, '0')}`,
                expense_product_amount: Number(expense.amount || 0),
                expense_bill_date: expense.billDate || new Date().toLocaleDateString(),
            }));

            formData.append('details', JSON.stringify(details));

            expenses.forEach((expense, index) => {
                if (expense.billFile?.uri) {
                    formData.append(`bill_file_${index}`, {
                        uri: expense.billFile.uri,
                        name: expense.billFile.name,
                        type: expense.billFile.type,
                    });
                }
                if (expense.productImage?.uri) {
                    formData.append(`product_image_${index}`, {
                        uri: expense.productImage.uri,
                        name: expense.productImage.name,
                        type: expense.productImage.type,
                    });
                }
            });

            const response = await fetch('https://demo-expense.geomaticxevs.in/ET-api/add_expense.php', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('Expenses submitted successfully!');
                resetForm();
                setExpenses([]);
                setExpenseHeadValue(null);
                setExpenseTitle('');
                setSubmittedToCategory('');
                setSubmittedToName('');
            } else {
                throw new Error(result.message || 'Failed to submit expenses');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit expenses. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const renderModal = (title, items, selectedValue, onSelect, onClose) => (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="modal-content">
                    {items
                        .filter((item) =>
                            item.label.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                            <div
                                key={item.value}
                                className={`modal-item ${selectedValue === item.value ? 'selected' : ''}`}
                                onClick={() => {
                                    onSelect(item.value);
                                    onClose();
                                }}
                            >
                                {item.label}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );

    if (isLoadingUser) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="expense-form-container">
            <h1 className="form-title">Add New Expense</h1>

            {/* Personal Information Section */}
            <section className="form-section">
                <h2 className="section-title">Personal Information</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>USER ID</label>
                        <input type="text" value={userData.userId} readOnly />
                    </div>
                    <div className="form-group">
                        <label>USER TYPE</label>
                        <input type="text" value={userData.role} readOnly />
                    </div>
                    <div className="form-group">
                        <label>FULL NAME</label>
                        <input
                            type="text"
                            value={`${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim()}
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label>DATE & TIME</label>
                        <input type="text" value={currentDate} readOnly />
                    </div>
                    <div className="form-group">
                        <label>LOCATION</label>
                        <input
                            type="text"
                            value={`Lat: ${currentLocation.latitude}, Long: ${currentLocation.longitude}`}
                            readOnly
                        />
                    </div>
                </div>
            </section>

            {/* Expense Details Section */}
            <section className="form-section">
                <div className="section-header">
                    <h2 className="section-title">Expense Details</h2>
                    <button className="reset-button" onClick={resetForm}>
                        <Trash2 size={16} />
                        Reset
                    </button>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Expense Head *</label>
                        <div
                            className="select-input"
                            onClick={() => setShowExpenseHeadModal(true)}
                        >
                            {expenseHeadValue
                                ? headItems.find((item) => item.value === expenseHeadValue)?.label
                                : 'Select Expense Head'}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Expense Bill Title *</label>
                        <input
                            type="text"
                            value={expenseTitle}
                            onChange={(e) => setExpenseTitle(e.target.value)}
                            placeholder="Enter expense title"
                        />
                    </div>

                    <div className="form-group">
                        <label>Expense Type *</label>
                        <div
                            className="select-input"
                            onClick={() => setShowExpenseTypeModal(true)}
                        >
                            {expenseType
                                ? expenseTypeItems.find((item) => item.value === expenseType)?.label
                                : 'Select Expense Type'}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Description *</label>
                        <textarea
                            value={currentExpense.description}
                            onChange={(e) =>
                                setCurrentExpense({ ...currentExpense, description: e.target.value })
                            }
                            placeholder="Enter expense description"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Amount *</label>
                        <input
                            type="number"
                            value={currentExpense.amount || ''}
                            onChange={(e) =>
                                setCurrentExpense({
                                    ...currentExpense,
                                    amount: parseFloat(e.target.value) || 0,
                                })
                            }
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Bill Date *</label>
                        <div
                            className="date-input"
                            onClick={() => setShowBillDatePicker(true)}
                        >
                            {currentExpense.billDate || 'Select Bill Date'}
                            <Calendar size={20} />
                        </div>
                        {showBillDatePicker && (
                            <input
                                type="date"
                                value={currentExpense.billDate}
                                onChange={(e) => {
                                    setCurrentExpense({
                                        ...currentExpense,
                                        billDate: e.target.value,
                                    });
                                    setShowBillDatePicker(false);
                                }}
                                className="date-picker"
                            />
                        )}
                    </div>

                    <div className="form-group full-width">
                        <label>Remarks *</label>
                        <textarea
                            value={currentExpense.remarks}
                            onChange={(e) =>
                                setCurrentExpense({ ...currentExpense, remarks: e.target.value })
                            }
                            placeholder="Enter remarks"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Bill Upload</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                id="bill-upload"
                                onChange={(e) => handleFileUpload(e, 'bill')}
                                accept="image/*,.pdf"
                                className="file-input"
                            />
                            <label htmlFor="bill-upload" className="file-label">
                                <Upload size={20} />
                                Upload Bill
                            </label>
                        </div>
                        {currentExpense.billFile && (
                            <div className="file-preview">
                                <span>📄 {currentExpense.billFile.name}</span>
                                <button
                                    className="remove-file"
                                    onClick={() =>
                                        setCurrentExpense((prev) => ({ ...prev, billFile: null }))
                                    }
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Product Picture</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                id="image-upload"
                                onChange={(e) => handleFileUpload(e, 'image')}
                                accept="image/*"
                                className="file-input"
                            />
                            <label htmlFor="image-upload" className="file-label">
                                <Upload size={20} />
                                Upload Image
                            </label>
                        </div>
                        {currentExpense.productImage && (
                            <div className="image-preview">
                                <img
                                    src={currentExpense.productImage.uri}
                                    alt="Product"
                                    className="preview-image"
                                />
                                <div className="image-info">
                                    <span>🖼️ {currentExpense.productImage.name}</span>
                                    <button
                                        className="remove-file"
                                        onClick={() =>
                                            setCurrentExpense((prev) => ({
                                                ...prev,
                                                productImage: null,
                                            }))
                                        }
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button className="add-expense-button" onClick={handleAddExpense}>
                    <Plus size={20} />
                    {editingId ? 'Update Expense' : 'Add Expense'}
                </button>
            </section>

            {/* Added Expenses Section */}
            <section className="form-section">
                <h2 className="section-title">Added Expenses</h2>
                {expenses.length === 0 ? (
                    <p className="no-expenses">No expenses added yet</p>
                ) : (
                    <div className="expenses-list">
                        {expenses.map((item) => (
                            <div key={item.id} className="expense-item">
                                <div className="expense-info">
                                    <h3>
                                        {expenseTypeItems.find((type) => type.value === item.type)
                                            ?.label || 'Unknown Type'}
                                    </h3>
                                    <p className="expense-amount">₹{item.amount?.toFixed(2)}</p>
                                    {item.description && (
                                        <p className="expense-description">{item.description}</p>
                                    )}
                                    {item.billFile && (
                                        <div className="expense-file">
                                            {item.billFile.type?.includes('image') ? (
                                                <img
                                                    src={item.billFile.uri}
                                                    alt="Bill"
                                                    className="bill-image"
                                                />
                                            ) : (
                                                <a
                                                    href={item.billFile.uri}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bill-link"
                                                >
                                                    📄 {item.billFile.name}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {item.productImage && (
                                        <img
                                            src={item.productImage.uri}
                                            alt="Product"
                                            className="product-image"
                                        />
                                    )}
                                </div>
                                <div className="expense-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEditExpense(item.id)}
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        className="remove-button"
                                        onClick={() => handleRemoveExpense(item.id)}
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="total-section">
                    <span className="total-label">Total Amount:</span>
                    <span className="total-amount">₹{totalAmount.toFixed(2)}</span>
                </div>
            </section>

            {/* Submit To Section */}
            <section className="form-section">
                <h2 className="section-title">Submit To</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Role *</label>
                        <div
                            className="select-input"
                            onClick={() => setShowRoleModal(true)}
                        >
                            {selectedRole
                                ? roles.find((role) => role.value === selectedRole)?.label
                                : 'Select Role'}
                        </div>
                    </div>

                    {selectedRole && (
                        <div className="form-group">
                            <label>Name *</label>
                            <div
                                className="select-input"
                                onClick={() => setShowNameModal(true)}
                            >
                                {selectedUser
                                    ? users.find((user) => user.value === selectedUser)?.label
                                    : 'Select Name'}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="submit-button-container">
                <button
                    className={`submit-all-button ${isSubmitting ? 'loading' : ''}`}
                    onClick={handleSubmitAllExpenses}
                    disabled={expenses.length === 0 || isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit All Expenses'}
                </button>
            </div>

            {/* Modals */}
            {showExpenseHeadModal &&
                renderModal(
                    'Select Expense Head',
                    headItems,
                    expenseHeadValue,
                    setExpenseHeadValue,
                    () => setShowExpenseHeadModal(false)
                )}

            {showExpenseTypeModal &&
                renderModal(
                    'Select Expense Type',
                    expenseTypeItems,
                    expenseType,
                    setExpenseType,
                    () => setShowExpenseTypeModal(false)
                )}

            {showRoleModal &&
                renderModal(
                    'Select Role',
                    roles,
                    selectedRole,
                    setSelectedRole,
                    () => setShowRoleModal(false)
                )}

            {showNameModal &&
                renderModal(
                    'Select Name',
                    users,
                    selectedUser,
                    setSelectedUser,
                    () => setShowNameModal(false)
                )}
        </div>
    );
};

export default ExpenseFormWeb;