import React, { useState, useEffect } from "react";
import "./add_work_report.css";
import { Loader2 } from "lucide-react";
import Select from "react-select";

const AddWorkReport = () => {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [name, setName] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [workDetails, setWorkDetails] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectOptions, setProjectOptions] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUserId = localStorage.getItem("userid");
    const storedRole = localStorage.getItem("roleId");

    // Set current date immediately, don't wait for API
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setCurrentDate(formattedDate);

    if (!token || !storedUserId) {
        window.location.href = "/";
        return;
    }

    // Set userId and role from localStorage
    setUserId(storedUserId);
    setRole(storedRole);

    const fetchUserData = async () => {
      try {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: storedUserId }),
          }
        );

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = "/";
          return;
        }

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
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Fetch projects for the user
    const fetchProjects = async () => {
      setLoadingProjects(true);
      const storedUserId = localStorage.getItem("userid");
      try {
        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/get_user_projects.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: storedUserId })
          }
        );
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.projects)) {
          setProjectOptions(
            data.projects.map(p => ({ value: p.project_name, label: p.project_name }))
          );
        } else {
          setProjectOptions([]);
        }
      } catch (err) {
        setProjectOptions([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const handleAddWorkReport = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        alert("Authentication failed. Please login again.");
        window.location.href = "/";
        return;
    }

    // Validate all required fields
    if (!projectName.trim()) {
        alert("Please enter the project name.");
        return;
    }

    if (!workDetails.trim()) {
        alert("Please enter your work details.");
        return;
    }

    if (!userId || !currentDate) {
        alert("Missing required data. Please refresh the page.");
        return;
    }

    setIsSubmitting(true);

    try {
        // Log the request payload for debugging
        const payload = {
            user_id: parseInt(userId), // Ensure userId is a number
            date: currentDate,
            project_name: projectName.trim(),
            work_details: workDetails.trim(),
        };
        console.log('Submitting payload:', payload);

        const response = await fetch(
            "https://demo-expense.geomaticxevs.in/ET-api/add_work_report.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            }
        );

        // Log the raw response for debugging
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Parse the response as JSON
        const result = responseText ? JSON.parse(responseText) : {};

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "/";
            return;
        }

        if (result.status === "success") {
            alert("Work report added successfully!");
            // Reset form
            setProjectName("");
            setWorkDetails("");
        } else {
            throw new Error(result.message || "Failed to add work report");
        }
    } catch (error) {
        console.error("Error submitting work report:", error);
        alert(`Failed to submit work report: ${error.message}`);
        if (error.message.includes("401")) {
            window.location.href = "/";
            return;
        }
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
            <Select
              id="projectName"
              isSearchable
              isLoading={loadingProjects}
              options={projectOptions}
              value={projectOptions.find(opt => opt.value === projectName) || null}
              onChange={opt => setProjectName(opt ? opt.value : "")}
              placeholder="Select project name"
              isClearable
              classNamePrefix="react-select"
              styles={{ container: base => ({ ...base, minWidth: 220 }) }}
              isDisabled={isSubmitting}
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