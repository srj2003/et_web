import React, { useState, useEffect } from "react";
import "./all_work_report.css";
import { Search, X, ChevronLeft, ChevronRight, Loader2, FileText, Download, Calendar, Clock, User, Briefcase } from "lucide-react";

const PAGE_SIZE = 15;

const AllWorkReport = () => {
  const [workReports, setWorkReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchWorkReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = localStorage.getItem("userid");
        if (!userId) {
          throw new Error("User ID not found. Please login again.");
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/get_all_work_reports.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch work reports");
        }

        const data = await response.json();
        
        if (data.status === "success" && Array.isArray(data.reports)) {
          // Sort reports by date and time in descending order
          const sortedReports = data.reports.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.submission_time || ''));
            const dateB = new Date(b.date + ' ' + (b.submission_time || ''));
            return dateB - dateA;
          });
          setWorkReports(sortedReports);
          setFilteredReports(sortedReports);
        } else {
          throw new Error(data.message || "Failed to fetch work reports");
        }
      } catch (error) {
        console.error("Error fetching work reports:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkReports();
  }, []);

  useEffect(() => {
    if (workReports.length > 0) {
      const text = searchText.toLowerCase();
      const filtered = workReports.filter(
        (report) =>
          (report.project_name?.toLowerCase().includes(text)) ||
          (report.work_details?.toLowerCase().includes(text)) ||
          (report.user_name?.toLowerCase().includes(text))
      );
      setFilteredReports(filtered);
      setCurrentPage(1);
    }
  }, [searchText, workReports]);

  const handleDownload = async (fileUrl, e) => {
    try {
      e.stopPropagation(); // Prevent modal from opening when clicking download
      if (!fileUrl) {
        throw new Error("Invalid file URL");
      }
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const totalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
        <p>Loading work reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Error Loading Reports</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="work-report-container">
      <div className="work-report-content">
        <h1 className="page-title">All Work Reports</h1>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by project name, details, or employee..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            {searchText && (
              <button 
                className="clear-button" 
                onClick={() => setSearchText("")}
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <div className="search-results">
            {searchText && (
              <span className="results-count">
                Found {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Reports Grid */}
        {paginatedReports.length > 0 ? (
          <div className="reports-grid">
            {paginatedReports.map((report, index) => (
              <div 
                key={index} 
                className="report-card"
                onClick={() => handleReportClick(report)}
              >
                <div className="report-header">
                  <h3 className="project-name">{report.project_name || "Untitled Project"}</h3>
                  <div className="report-time-info">
                    <span className="report-date">{report.date || "No date"}</span>
                    <span className="report-time">{report.submission_time || "No time"}</span>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-details">
                    <p className="work-details">
                      {report.work_details || "No details provided"}
                    </p>
                    <div className="employee-info">
                      <span className="employee-name">
                        By: {report.user_name}
                      </span>
                      {report.role_name && (
                        <span className="employee-role">
                          {report.role_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {report.attachments && report.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h4 className="attachments-title">Attachments</h4>
                      <div className="attachments-list">
                        {report.attachments.map((file, fileIndex) => (
                          <div key={fileIndex} className="attachment-item">
                            <FileText size={16} />
                            <span className="file-name">{file.name}</span>
                            <button
                              className="download-button"
                              onClick={(e) => handleDownload(file.url, e)}
                              aria-label={`Download ${file.name}`}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reports">
            <p>{searchText ? "No matching reports found." : "No reports available."}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            <button
              className="pagination-button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Report Details Modal */}
        {showModal && selectedReport && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedReport.project_name || "Untitled Project"}</h2>
                <button className="close-button" onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="details-section">
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Calendar size={20} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{selectedReport.date || "Not available"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Clock size={20} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Submission Time</span>
                        <span className="detail-value">{selectedReport.submission_time || "Not available"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <User size={20} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Employee</span>
                        <span className="detail-value">{selectedReport.user_name || "Not available"}</span>
                      </div>
                    </div>
                    {selectedReport.role_name && (
                      <div className="detail-item">
                        <div className="detail-icon">
                          <User size={20} />
                        </div>
                        <div className="detail-info">
                          <span className="detail-label">Role</span>
                          <span className="detail-value">{selectedReport.role_name}</span>
                        </div>
                      </div>
                    )}
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Briefcase size={20} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Project Name</span>
                        <span className="detail-value">{selectedReport.project_name || "Not available"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="work-details-section">
                  <h3>Work Details</h3>
                  <div className="work-details-content">
                    {selectedReport.work_details || "No details provided"}
                  </div>
                </div>
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div className="modal-attachments-section">
                    <h3>Attachments</h3>
                    <div className="modal-attachments-list">
                      {selectedReport.attachments.map((file, index) => (
                        <div key={index} className="modal-attachment-item">
                          <FileText size={20} />
                          <span className="file-name">{file.name}</span>
                          <button
                            className="download-button"
                            onClick={(e) => handleDownload(file.url, e)}
                            aria-label={`Download ${file.name}`}
                          >
                            <Download size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllWorkReport; 