import React, { useState, useEffect } from "react";
import "./my_work_report.css";
import { Search, X, ChevronLeft, ChevronRight, Loader2, Calendar, Clock, ChevronsLeft, ChevronsRight, User } from "lucide-react";

const PAGE_SIZE = 15; // Changed to show fewer items per page for better visibility

const MyWorkReport = () => {
  const [myReports, setMyReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userid");

    if (!token || !userId) {
      window.location.href = "/";
      return;
    }

    const fetchMyReports = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userid");

        if (!userId || !token) {
          throw new Error("Authentication failed");
        }

        const response = await fetch(
          "https://demo-expense.geomaticxevs.in/ET-api/get_my_work_reports.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }

        const data = await response.json();

        if (data.status === "success") {
          // Sort reports by date and time in descending order
          const sortedReports = (data.reports || []).sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.submission_time || ''));
            const dateB = new Date(b.date + ' ' + (b.submission_time || ''));
            return dateB - dateA;
          });
          setMyReports(sortedReports);
          setFilteredReports(sortedReports);
        } else {
          alert(data.message || "Failed to fetch your work reports.");
        }
      } catch (error) {
        console.error("Error fetching my work reports:", error);
        if (error.message.includes('401')) {
          window.location.href = '/';
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
  }, []);

  // Search filter
  useEffect(() => {
    const text = searchText.toLowerCase();
    const filtered = myReports.filter(
      (item) =>
        (item.project_name && item.project_name.toLowerCase().includes(text)) ||
        (item.date && item.date.includes(text)) ||
        (item.work_details && item.work_details.toLowerCase().includes(text))
    );
    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [searchText, myReports]);

  const handleClearSearch = () => {
    setSearchText("");
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  // Enhanced Pagination
  const totalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
        <p>Loading work reports...</p>
      </div>
    );
  }

  return (
    <div className="work-report-container">
      <div className="work-report-content">
        <h1 className="page-title">My Work Reports</h1>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by project name, date or work details"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            {searchText && (
              <button className="clear-button" onClick={handleClearSearch}>
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
                  <h3 className="project-name">{report.project_name}</h3>
                  <div className="report-time-info">
                    <span className="report-date">{report.date}</span>
                    <span className="report-time">{report.submission_time}</span>
                    {report.role_name && <span className="report-role">{report.role_name}</span>}
                  </div>
                </div>
                <div className="report-content">
                  <p className="work-details">{report.work_details}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reports">
            <p>No reports found.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={goToPreviousPage}
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
              onClick={goToNextPage}
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
                <h2>{selectedReport.project_name}</h2>
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
                        <span className="detail-value">{selectedReport.date}</span>
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
                  </div>
                </div>
                <div className="work-details-section">
                  <h3>Work Details</h3>
                  <div className="work-details-content">
                    {selectedReport.work_details}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWorkReport;