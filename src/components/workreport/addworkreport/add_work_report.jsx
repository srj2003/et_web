import React, { useState, useEffect } from "react";
import "./add_work_report.css";
import { Loader2 } from "lucide-react";

const AddWorkReport = () => {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [name, setName] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [workDetails, setWorkDetails] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const storedUserId = localStorage.getItem("userid");
        const storedRole = localStorage.getItem("roleId");

        if (storedUserId) setUserId(storedUserId);
        if (storedRole) setRole(storedRole);

        // Fetch user name from API
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: storedUserId }),
          }
        );

        const data = await response.json();
        if (data && data.status === "success" && data.data) {
          const firstName = data.data.u_fname || "";
          const middleName = data.data.u_mname || "";
          const lastName = data.data.u_lname || "";

          const fullName = [firstName, middleName, lastName]
            .filter((name) => name.length > 0)
            .join(" ")
            .trim();

          setName(fullName);
        }

        // Set current date
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        setCurrentDate(formattedDate);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAddWorkReport = async () => {
    if (!projectName.trim()) {
      alert("Please enter the project name.");
      return;
    }

    if (!workDetails.trim()) {
      alert("Please enter your work details.");
      return;
    }

    if (!userId) {
      alert("User ID is required. Please try reloading the page.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add_work_report.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            date: currentDate,
            project_name: projectName.trim(),
            work_details: workDetails.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        alert("Work report added successfully.");
        setProjectName("");
        setWorkDetails("");
      } else {
        alert(result.message || "Failed to add work report.");
      }
    } catch (error) {
      console.error("Error adding work report:", error);
      alert("An error occurred while adding the work report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="work-report-container">
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  const isFormValid = projectName.trim() && workDetails.trim() && userId && !isSubmitting;

  return (
    <div className="work-report-container">
      <div className="work-report-content">
        <h1 className="page-title">Add Work Report</h1>

        <div className="report-grid">
          <div className="info-card">
            <label className="info-label">User ID</label>
            <div className="info-value">{userId || "Not available"}</div>
          </div>

          <div className="info-card">
            <label className="info-label">Role</label>
            <div className="info-value">{role || "Not available"}</div>
          </div>

          <div className="info-card">
            <label className="info-label">Name</label>
            <div className="info-value">{name || "Not available"}</div>
          </div>

          <div className="info-card">
            <label className="info-label">Current Date</label>
            <div className="info-value">{currentDate || "Not available"}</div>
          </div>

          <div className="input-card">
            <label className="input-label" htmlFor="projectName">Project Name</label>
            <input
              id="projectName"
              type="text"
              className="text-input"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="input-card">
            <label className="input-label" htmlFor="workDetails">Work Details</label>
            <textarea
              id="workDetails"
              className="text-area"
              placeholder="Enter your work details"
              value={workDetails}
              onChange={(e) => setWorkDetails(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          className={`submit-button ${isSubmitting ? "submitting" : ""} ${!isFormValid ? "disabled" : ""}`}
          onClick={handleAddWorkReport}
          disabled={!isFormValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="spinner" size={20} />
              <span>Adding Report...</span>
            </>
          ) : (
            "Add Work Report"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddWorkReport; 