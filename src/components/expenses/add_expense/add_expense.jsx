import React, { useState, useEffect } from "react";
import "./add_expense.css";
import { Calendar, Upload, X, Search, Plus, Trash2, Edit2 } from "lucide-react";

const ExpenseFormWeb = () => {
  const [userData, setUserData] = useState({
    userId: "",
    role: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [expenseTitle, setExpenseTitle] = useState("");
  const [currentExpense, setCurrentExpense] = useState({
    id: Math.random().toString(36).substring(7),
    title: "",
    type: null,
    description: "",
    amount: 0,
    remarks: "",
    billDate: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    billFile: false,
    productImage: false,
  });
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [submittedToCategory, setSubmittedToCategory] = useState("");
  const [submittedToName, setSubmittedToName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [headItems, setHeadItems] = useState([]);
  const [expenseHeadValue, setExpenseHeadValue] = useState(null);
  const [expenseTypeItems, setExpenseTypeItems] = useState([]);
  const [expenseType, setExpenseType] = useState(null);
  const [showBillDatePicker, setShowBillDatePicker] = useState(false);
  const [currentDate] = useState(new Date().toLocaleString());
  const [currentLocation, setCurrentLocation] = useState({
    latitude: "0",
    longitude: "0",
  });
  const [userCapping, setUserCapping] = useState(null);
  const [cappingError, setCappingError] = useState("");
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingUser(true);
      try {
        const userId = localStorage.getItem("userid");
        const token = localStorage.getItem("authToken");

        if (!userId || !token) {
          throw new Error("User ID or token not found");
        }

        const roleResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        const roleData = await roleResponse.json();
        if (!roleData.role_name) {
          throw new Error("Role not found");
        }

        const userResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId }),
          }
        );

        const userData = await userResponse.json();
        if (userData.status !== "success" || !userData.data) {
          throw new Error("User details not found");
        }

        setUserData({
          userId: userId,
          role: roleData.role_name,
          firstName: userData.data.u_fname || "",
          middleName: userData.data.u_mname || "",
          lastName: userData.data.u_lname || "",
        });

        // Fetch capping amount
        const cappingResponse = await fetch("https://demo-expense.geomaticxevs.in/ET-api/capping_amount_api.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ u_id: userId })
        });
        const cappingData = await cappingResponse.json();
        if (cappingData.success && cappingData.data) {
          setUserCapping(parseFloat(cappingData.data.total_expense_amount));
        } else {
          setUserCapping(null);
        }

        // Fetch today's expenses
        const todayResponse = await fetch("https://demo-expense.geomaticxevs.in/ET-api/my-expenses.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ userId })
        });
        const todayData = await todayResponse.json();
        
        if (todayData.status === "success" && todayData.data) {
          const today = new Date().toISOString().split('T')[0];
          const todayExpensesList = todayData.data.filter(expense => {
            const expenseDate = new Date(expense.expense_date).toISOString().split('T')[0];
            return expenseDate === today;
          });
          setTodayExpenses(todayExpensesList);
          const total = todayExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0);
          setTodayTotal(total);
        } else if (Array.isArray(todayData)) {
          // Handle legacy response format
          const today = new Date().toISOString().split('T')[0];
          const todayExpensesList = todayData.filter(expense => {
            const expenseDate = new Date(expense.expense_date).toISOString().split('T')[0];
            return expenseDate === today;
          });
          setTodayExpenses(todayExpensesList);
          const total = todayExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0);
          setTodayTotal(total);
        }

      } catch (error) {
        if (error.message === "User ID or token not found") {
          alert("You have been logged out. Please login again.");
          window.location.href = '/';
          return;
        }
        console.error("Failed to load user data:", error);
        alert("Failed to load user information");
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_roles=true",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        const data = await res.json();
        if (data.status === "success") {
          setRoles(
            data.roles.map((role) => ({
              label: role.label,
              value: String(role.value),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching roles", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(
            `https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?role_id=${selectedRole}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            }
          );
          const data = await res.json();
          if (data.status === "success") {
            setUsers(
              data.users.map((user) => ({
                label: user.name,
                value: user.id,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching users", error);
        }
      };

      fetchUsers();
    }
  }, [selectedRole]);

  useEffect(() => {
    const getLocation = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString(),
              });
            },
            (error) => {
              console.error("Error getting location:", error);
              alert("Location permission is required");
            }
          );
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        const typesResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_types=true",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        const typesData = await typesResponse.json();
        if (typesData.status === "success") {
          setHeadItems(typesData.data);
        }

        const headsResponse = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php?fetch_expense_heads=true",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        const headsData = await headsResponse.json();
        if (headsData.status === "success") {
          setExpenseTypeItems(headsData.data);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleAddExpense = () => {
    // Find the selected expense head label
    const selectedHeadObj = expenseTypeItems.find(
      (item) => item.value === expenseType
    );
    const selectedHeadLabel = selectedHeadObj?.label?.toLowerCase() || "";

    // Determine if bill and image are required
    const isSpecialType =
      selectedHeadLabel === "petrol" ||
      selectedHeadLabel === "buying it products" ||
      selectedHeadLabel === "electric bill";
    
    // Debug logging
    console.log("Selected Head Label:", selectedHeadLabel);
    console.log("Is Special Type:", isSpecialType);
    console.log("Has At Least One Upload:", hasAtLeastOneUpload());

    // Reset validation errors
    setValidationErrors({
      billFile: false,
      productImage: false,
    });

    // Check for validation errors
    let hasValidationError = false;
    const newValidationErrors = {
      billFile: false,
      productImage: false,
    };

    if (isSpecialType) {
      // Check if at least one upload is provided
      if (!hasAtLeastOneUpload()) {
        // If no uploads provided, show error on both fields
        newValidationErrors.billFile = true;
        newValidationErrors.productImage = true;
        hasValidationError = true;
      }
    }

    // Set validation errors if any
    if (hasValidationError) {
      setValidationErrors(newValidationErrors);
    }

    // Validation for all required fields
    if (
      !expenseHeadValue ||
      !expenseTitle ||
      !expenseType ||
      !currentExpense.description ||
      !currentExpense.amount ||
      !currentExpense.billDate ||
      hasValidationError
    ) {
      if (isSpecialType && hasValidationError) {
        alert(
          `For '${selectedHeadLabel}', either Bill Upload or Product Image is required.`
        );
      } else {
        alert("Fill all the fields");
      }
      return;
    }

    // 💡 Compute total for same bill date (today by default)
    const billDate = currentExpense.billDate;
    const sameDayTotal = expenses
      .filter(exp => exp.billDate === billDate)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    
    // Calculate total including today's already submitted expenses
    const totalTodaySubmitted = todayTotal;
    const proposedTotal = sameDayTotal + (Number(currentExpense.amount) || 0) + totalTodaySubmitted;

    if (userCapping !== null && proposedTotal > userCapping) {
      const remaining = (userCapping - totalTodaySubmitted - sameDayTotal).toFixed(2);
      setCappingError(`Cannot exceed limit. You have already submitted ₹${totalTodaySubmitted} today. You can only add ₹${remaining} more for ${billDate}`);
      return;
    } else {
      setCappingError(""); // clear warning
    }

    const expenseToAdd = {
      ...currentExpense,
      id: editingId || Math.random().toString(36).substring(7),
      title: expenseTitle,
      type: expenseType,
    };

    if (editingId) {
      setExpenses(
        expenses.map((exp) => (exp.id === editingId ? expenseToAdd : exp))
      );
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
      if (type === "bill") {
        setCurrentExpense({
          ...currentExpense,
          billFile: {
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            size: file.size,
          },
        });
        // Clear validation errors when any file is uploaded
        setValidationErrors({
          billFile: false,
          productImage: false,
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
        // Clear validation errors when any file is uploaded
        setValidationErrors({
          billFile: false,
          productImage: false,
        });
      }
    }
  };

  const resetForm = () => {
    setCurrentExpense({
      id: Math.random().toString(36).substring(7),
      title: "",
      type: null,
      description: "",
      amount: 0,
      remarks: "",
      billDate: "",
    });
    setExpenseType(null);
    setExpenseHeadValue(null);
    setExpenseTitle("");
    setSelectedRole(null);
    setSelectedUser(null);
    setUsers([]);
    setValidationErrors({
      billFile: false,
      productImage: false,
    });
  };

  // Helper to check if Project Purpose is selected in either dropdown
  const isProjectPurposeSelected = (() => {
    const selectedTypeObj1 = expenseTypeItems.find((item) => item.value === expenseType);
    const selectedTypeObj2 = headItems.find((item) => item.value === expenseHeadValue);
    const isPP = (obj) => obj && obj.label && obj.label.trim().toLowerCase().replace(/\s+/g, ' ') === "project purpose";
    return isPP(selectedTypeObj1) || isPP(selectedTypeObj2);
  })();

  // Helper to check if current expense head requires mandatory uploads
  const requiresMandatoryUploads = (() => {
    const selectedHeadObj = expenseTypeItems.find((item) => item.value === expenseType);
    if (!selectedHeadObj) return false;
    
    const expenseHeadLabel = selectedHeadObj.label?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
    const mandatoryHeads = [
      'buying it products',
      'petrol',
      'electric bill'
    ];
    
    const requiresUpload = mandatoryHeads.includes(expenseHeadLabel);
    console.log("Requires Mandatory Uploads:", requiresUpload, "for head:", expenseHeadLabel);
    
    return requiresUpload;
  })();

  // Helper to check if at least one upload is provided
  const hasAtLeastOneUpload = () => {
    return currentExpense.billFile || currentExpense.productImage;
  };

  const handleSubmitAllExpenses = async () => {
    if (expenses.length === 0) {
      alert("Please add at least one expense before submitting");
      return;
    }
    // Recalculate Project Purpose selection inside the function
    const selectedTypeObj1 = expenseTypeItems.find((item) => item.value === expenseType);
    const selectedTypeObj2 = headItems.find((item) => item.value === expenseHeadValue);
    const isProjectPurpose = (obj) =>
      obj && obj.label?.trim().toLowerCase().replace(/\s+/g, ' ') === "project purpose";
    const isPPSelected = isProjectPurpose(selectedTypeObj1) || isProjectPurpose(selectedTypeObj2);

    if (!isPPSelected && (!selectedUser || !selectedRole)) {
      alert("Please select who to submit to");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();

      // Add basic expense data
      formData.append("expense_track_title", expenseTitle || "");
      formData.append("expense_type_id", String(expenseHeadValue || ""));
      formData.append("expense_total_amount", String(totalAmount || 0));
      formData.append("expense_track_app_rej_remarks", "");
      formData.append(
        "expense_track_create_lat",
        currentLocation.latitude || "0"
      );
      formData.append(
        "expense_track_create_long",
        currentLocation.longitude || "0"
      );
      formData.append(
        "expense_track_created_by",
        String(userData.userId || "")
      );
      formData.append(
        "expense_track_submitted_to",
        isProjectPurposeSelected ? "" : String(selectedUser || "")
      );

      // Map expense details
      const details = expenses.map((expense, index) => ({
        expense_head_id: Number(expense.type || 0),
        expense_product_name: expense.description || "",
        expense_product_qty: 1,
        expense_product_unit: "Unit",
        expense_product_desc: expense.remarks || "",
        expense_product_sl_no: `SL${String(index + 1).padStart(3, "0")}`,
        expense_product_amount: Number(expense.amount || 0),
        expense_bill_date: expense.billDate || new Date().toLocaleDateString(),
      }));

      formData.append("details", JSON.stringify(details));

      // Handle file uploads
      for (const [index, expense] of expenses.entries()) {
        // Convert base64/blob URL to File object for bill file
        if (expense.billFile?.uri) {
          const response = await fetch(expense.billFile.uri);
          const blob = await response.blob();
          const file = new File([blob], expense.billFile.name, {
            type: expense.billFile.type,
          });
          formData.append(`bill_file_${index}`, file);
        }

        // Convert base64/blob URL to File object for product image
        if (expense.productImage?.uri) {
          const response = await fetch(expense.productImage.uri);
          const blob = await response.blob();
          const file = new File([blob], expense.productImage.name, {
            type: expense.productImage.type,
          });
          formData.append(`product_image_${index}`, file);
        }
      }

      // Log FormData contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value);
      }
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        alert("You have been logged out. Please login again.");
        window.location.href = '/';
        return;
      }

      const result = await response.json();
      console.log("Server response:", result);

      if (result.status === "success") {
        let message = result.autoApproved 
          ? `Expenses submitted and auto-approved successfully!\n\nReason: ${result.autoApproveReason}`
          : "Expenses submitted successfully! Pending approval.";

        if (result.autoApproved && selectedUser) {
          const notifiedUser = users.find((u) => u.value === selectedUser);
          if (notifiedUser) {
            message += `\n\nNotification sent to: ${notifiedUser.label}`;
          }
        }

        alert(message);
        
        // Clear all form data and expenses
        setExpenses([]);
        setExpenseHeadValue(null);
        setExpenseTitle("");
        setExpenseType(null);
        setCurrentExpense({
          id: Math.random().toString(36).substring(7),
          title: "",
          type: null,
          description: "",
          amount: 0,
          remarks: "",
          billDate: "",
        });
        setSelectedRole(null);
        setSelectedUser(null);
        setUsers([]);
        setSubmittedToCategory("");
        setSubmittedToName("");
        
        return; // Exit early on success
      } else {
        throw new Error(result.message || "Failed to submit expenses");
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      // Check if it's a network error or server error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Network error. Please check your internet connection and try again.");
      } else {
        alert("Failed to submit expenses. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);



  const handleDateClick = (e) => {
    e.stopPropagation();
    setShowBillDatePicker(true);
  };

  const handleDateChange = (e) => {
    setCurrentExpense({
      ...currentExpense,
      billDate: e.target.value,
    });
    setShowBillDatePicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showBillDatePicker &&
        !event.target.closest(".date-input") &&
        !event.target.closest(".date-picker")
      ) {
        setShowBillDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBillDatePicker]);

  if (isLoadingUser) {
    return (
      <div className="dash-loading-container">
        <div className="dash-loading-spinner"></div>
        <pre className='dash-loading-text'>  Loading Expense Form...</pre>
      </div>
    );
  }

  return (
    <div className="expense-form-container">
      <h1 className="form-title">Add New Expense</h1>
      {userCapping !== null && (
        <div className="capping-info">
          <div className="capping-item">
            <span className="capping-label">Daily Capping Limit:</span>
            <span className="capping-value">₹{userCapping}</span>
          </div>
          <div className="capping-item">
            <span className="capping-label">Today's Submitted:</span>
            <span className="capping-value">₹{todayTotal}</span>
          </div>
          <div className="capping-item">
            <span className="capping-label">Remaining Today:</span>
            <span className={`capping-value ${(userCapping - todayTotal) < 0 ? 'capping-exceeded' : 'capping-remaining'}`}>
              ₹{(userCapping - todayTotal).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Personal Information Section */}
      <section className="user-form-section">
        <h2 className="user-section-title">Personal Information:-</h2>
        <div className="personal-info-table-container">
          <table className="personal-info-table">
            <thead>
              <tr className="info-th">
                <th>USER ID</th>
                <th>USER TYPE</th>
                <th>FULL NAME</th>
                <th>DATE & TIME</th>
                <th>LOCATION</th>
              </tr>
            </thead>
            <tbody>
              <tr className="info-row">
                <td>
                  <div className="info-value">
                    <span className="info-text">{userData.userId}</span>
                  </div>
                </td>
                <td>
                  <div className="info-value">
                    <span className="info-text">{userData.role}</span>
                  </div>
                </td>
                <td>
                  <div className="info-value">
                    <span className="info-text">{`${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim()}</span>
                  </div>
                </td>
                <td>
                  <div className="info-value">
                    <span className="info-text">{currentDate}</span>
                  </div>
                </td>
                <td>
                  <div className="info-value">
                    <span className="info-text">{`Lat: ${currentLocation.latitude}, Long: ${currentLocation.longitude}`}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Expense Details Section */}
      <section className="submit-form-section">
        <div className="submit-section-header">
          <h2 className="submit-section-title">Expense Details:-</h2>
          <div className="reset-button-container">
            <button className="reset-button" onClick={resetForm}>
              <Trash2 size={14} />
              Reset
            </button>
          </div>
        </div>

        <div className="expense-form-table-container">
          <table className="expense-form-table">
            <thead>
              <tr className="expense-form-th">
                <th>Expense Type</th>
                <th>Expense Bill Title</th>
                <th>Expense Head</th>
                <th>Amount</th>
                <th>Bill Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="expense-form-row">
                <td>
                  <div className="expense-form-value">
                    <select
                      value={expenseHeadValue || ""}
                      onChange={(e) => setExpenseHeadValue(e.target.value)}
                      className="expense-form-select"
                    >
                      <option value="">Select Expense type</option>
                      {headItems.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {/* Show warning if Project Purpose is selected in Expense Type */}
                    {(() => {
                      const selectedTypeObj = headItems.find((item) => item.value === expenseHeadValue);
                      if (selectedTypeObj && selectedTypeObj.label && selectedTypeObj.label.trim().toLowerCase().replace(/\s+/g, ' ') === "project purpose") {
                        return (
                          <div style={{ color: '#b91c1c', marginTop: '6px', fontWeight: 500, fontSize: '0.97em', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px' }}>
                            Use this only for personal expenses. If you choose a project purpose, it will reduce your daily limit.
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>
                <td>
                  <div className="expense-form-value">
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="Enter expense title"
                      className="expense-form-input"
                    />
                  </div>
                </td>
                <td>
                  <div className="expense-form-value">
                    <select
                      value={expenseType || ""}
                      onChange={(e) => {
                        setExpenseType(e.target.value);
                        // Clear validation errors when expense type changes
                        setValidationErrors({
                          billFile: false,
                          productImage: false,
                        });
                      }}
                      className="expense-form-select"
                    >
                      <option value="">Select Expense Head</option>
                      {expenseTypeItems.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="expense-form-value">
                    <input
                      type="number"
                      value={currentExpense.amount || ""}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="expense-form-input"
                    />
                    {cappingError && (
                      <div style={{ color: 'red', marginTop: '5px', fontSize: '0.8rem' }}>
                        {cappingError}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="expense-form-value">
                    <input
                      type="date"
                      value={currentExpense.billDate}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          billDate: e.target.value,
                        })
                      }
                      className="expense-form-input date-input"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Additional fields in separate sections */}
        <div className="expense-form-additional">
          <div className="additional-row">
            <div className="additional-field">
              <label>Description</label>
              <textarea
                value={currentExpense.description}
                onChange={(e) =>
                  setCurrentExpense({
                    ...currentExpense,
                    description: e.target.value,
                  })
                }
                placeholder="Enter expense description"
                rows={3}
                className="expense-form-textarea"
              />
            </div>
            <div className="additional-field">
              <label>Remarks</label>
              <textarea
                value={currentExpense.remarks}
                onChange={(e) =>
                  setCurrentExpense({
                    ...currentExpense,
                    remarks: e.target.value,
                  })
                }
                placeholder="Enter remarks"
                rows={3}
                className="expense-form-textarea"
              />
            </div>
          </div>
          
          <div className="additional-row">
            <div className={`additional-field ${validationErrors.billFile ? 'validation-error' : ''}`}>
              <label>
                Bill Upload
                {requiresMandatoryUploads && <span className="required-indicator">*</span>}
              </label>
              <div className={`file-upload ${validationErrors.billFile ? 'validation-error' : ''}`}>
                <input
                  type="file"
                  id="bill-upload"
                  onChange={(e) => handleFileUpload(e, "bill")}
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
                    onClick={() => {
                      setCurrentExpense((prev) => ({ ...prev, billFile: null }));
                      // Check if validation error should be set after removal
                      if (requiresMandatoryUploads && !hasAtLeastOneUpload()) {
                        setValidationErrors({
                          billFile: true,
                          productImage: true,
                        });
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {validationErrors.billFile && (
                <div className="validation-message">
                  Either Bill Upload or Product Image is required for this expense type
                </div>
              )}
            </div>
            <div className={`additional-field ${validationErrors.productImage ? 'validation-error' : ''}`}>
              <label>
                Product Picture
                {requiresMandatoryUploads && <span className="required-indicator">*</span>}
              </label>
              <div className={`file-upload ${validationErrors.productImage ? 'validation-error' : ''}`}>
                <input
                  type="file"
                  id="image-upload"
                  onChange={(e) => handleFileUpload(e, "image")}
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
                      onClick={() => {
                        setCurrentExpense((prev) => ({
                          ...prev,
                          productImage: null,
                        }));
                        // Check if validation error should be set after removal
                        if (requiresMandatoryUploads && !hasAtLeastOneUpload()) {
                          setValidationErrors({
                            billFile: true,
                            productImage: true,
                          });
                        }
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              {validationErrors.productImage && (
                <div className="validation-message">
                  Either Bill Upload or Product Image is required for this expense type
                </div>
              )}
            </div>
          </div>
        </div>

        <button className="add-expense-button" onClick={handleAddExpense}>
          <Plus size={20} />
          {editingId ? "Update Expense" : "Add Expense"}
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
                      ?.label || "Unknown Type"}
                  </h3>
                  <p className="expense-amount">₹{item.amount?.toFixed(2)}</p>
                  {item.description && (
                    <p className="expense-description">{item.description}</p>
                  )}
                  {item.billFile && (
                    <div className="expense-file">
                      {item.billFile.type?.includes("image") ? (
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
      {!isProjectPurposeSelected && (
        <section className="form-section">
          <h2 className="section-title">Submit To</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Role </label>
              <select
                value={selectedRole || ""}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="expense-form-select"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <div className="form-group">
                <label>Name </label>
                <select
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="expense-form-select"
                >
                  <option value="">Select Name</option>
                  {users.map((user) => (
                    <option key={user.value} value={user.value}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="expense-submit-button-container">
        <button
          className={`submit-all-button ${isSubmitting ? "loading" : ""}`}
          onClick={handleSubmitAllExpenses}
          disabled={expenses.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit All Expenses"}
        </button>
      </div>


    </div>
  );
};

export default ExpenseFormWeb;
