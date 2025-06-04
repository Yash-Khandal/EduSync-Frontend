import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loader from './Loader';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showLoader, setShowLoader] = useState(true);

  // For course selection and filtered results
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);

  // Dark mode state with persistence
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('DARK_MODE');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('DARK_MODE', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setShowLoader(false);
        return;
      }
      try {
        // 1. Get student's enrolled courses
        const coursesResponse = await api.students.getCourses(user.id);
        setCourses(coursesResponse.data || []);
        const courseIds = (coursesResponse.data || []).map(c => c.courseId || c.CourseId);

        // 2. Get all assessments
        const allAssessments = await api.assessments.getAll();
        // 3. Filter assessments for enrolled courses
        const filtered = (allAssessments.data || []).filter(a =>
          courseIds.includes(a.courseId || a.CourseId)
        );
        setAssessments(filtered);

        // 4. Get all published results for this student
        const resultsResponse = await api.results.getResultsForUser(user.id);
        setResults(resultsResponse.data || []);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setShowLoader(false);
      }
    };
    fetchData();
  }, [user]);

  // Filter results for selected course
  useEffect(() => {
    if (!selectedCourseId) {
      setFilteredResults([]);
      return;
    }
    // Find assessments for this course
    const assessmentIds = assessments
      .filter(a => (a.courseId || a.CourseId) === selectedCourseId)
      .map(a => a.assessmentId || a.AssessmentId);

    // Filter results for these assessments
    const filtered = results.filter(
      r => assessmentIds.includes(r.assessmentId || r.AssessmentId)
    );
    setFilteredResults(filtered);
  }, [selectedCourseId, assessments, results]);

  // Custom Dark Mode Toggle Button
  const DarkModeToggle = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1200,
      background: darkMode ? '#23234a' : '#fff',
      borderRadius: '50px',
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={() => setDarkMode(prev => !prev)}
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), color 0.5s',
          transform: darkMode ? 'rotate(-20deg) scale(1.1)' : 'rotate(0deg) scale(1)',
          color: darkMode ? '#fbbf24' : '#f59e0b',
          fontSize: '1.2rem'
        }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <i className="fas fa-moon"></i>
        ) : (
          <i className="fas fa-sun"></i>
        )}
      </button>
      <span style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: darkMode ? '#e1e1e6' : '#374151',
        userSelect: 'none'
      }}>
        {darkMode ? 'Dark' : 'Light'}
      </span>
    </div>
  );

  return (
    <div className="dashboard-bg min-vh-100 d-flex flex-column">
      {/* Dark Mode Toggle */}
      <DarkModeToggle />

      {/* Personalized Greeting and Avatar */}
      <div className="d-flex flex-column align-items-center mb-4">
        <div
          className="animate__animated animate__fadeInDown"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#007bff22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontSize: 32,
            fontWeight: 600,
            color: "#007bff",
            overflow: "hidden"
          }}
        >
          {user && user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            getInitials(user && user.name)
          )}
        </div>
        <div style={{
          animation: "fadeInDown 1s",
          fontWeight: 700,
          fontSize: "2rem",
          marginBottom: "0.5rem"
        }} className="animate__animated animate__fadeInDown">
          👋 Welcome, {user && user.name ? user.name : 'Student'}!
        </div>
        <div className="text-muted fs-5 animate__animated animate__fadeIn">
          {"Here's your Student dashboard overview."}
        </div>
      </div>

      <div className="container py-4 flex-grow-1 d-flex flex-column">
        {showLoader ? (
          <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
            <Loader />
            <p className="mt-3 fw-semibold text-primary fs-5">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="container mt-4 flex-grow-1">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="row justify-content-center g-4 mt-3">
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{
                  borderRadius: '15px',
                  background: darkMode ? '#23234a' : '#fff',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-graduation-cap fa-2x text-primary me-2"></i>
                    <span className="fw-semibold" style={{ color: darkMode ? '#e1e1e6' : 'inherit' }}>
                      Courses Enrolled
                    </span>
                    <span className="mx-2" style={{ color: darkMode ? '#e1e1e6' : 'inherit' }}>=</span>
                    <span className="fw-bold fs-5 text-primary">{courses.length}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{
                  borderRadius: '15px',
                  background: darkMode ? '#23234a' : '#fff',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-clipboard-list fa-2x text-success me-2"></i>
                    <span className="fw-semibold" style={{ color: darkMode ? '#e1e1e6' : 'inherit' }}>
                      Assessments
                    </span>
                    <span className="mx-2" style={{ color: darkMode ? '#e1e1e6' : 'inherit' }}>=</span>
                    <span className="fw-bold fs-5 text-success">{assessments.length}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Course selection and results */}
            <div className="mt-5 text-center">
              <h4 className="fw-bold mb-3" style={{ color: darkMode ? '#e1e1e6' : 'inherit' }}>
                Exam Results
              </h4>
              <div className="mb-3" style={{ maxWidth: 400, margin: '0 auto' }}>
                <select
                  className="form-select custom-select"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  style={{
                    background: darkMode ? '#23234a' : '#fff',
                    color: darkMode ? '#e1e1e6' : 'inherit',
                    border: darkMode ? '1px solid #444' : '1.5px solid #d1d1e0'
                  }}
                >
                  <option value="">-- Select a course to view results --</option>
                  {courses.map(c => (
                    <option key={c.courseId || c.CourseId} value={c.courseId || c.CourseId}>
                      {c.title || c.Title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCourseId && (
                filteredResults.length === 0 ? (
                  <div className="alert alert-warning" style={{
                    maxWidth: 500,
                    margin: '0 auto',
                    background: darkMode ? '#23234a' : '#fff3cd',
                    color: darkMode ? '#e1e1e6' : '#856404',
                    border: darkMode ? '1px solid #444' : '1px solid #ffeaa7'
                  }}>
                    No published results for this course yet.
                  </div>
                ) : (
                  <div className="card results-card shadow-sm mx-auto" style={{
                    maxWidth: 500,
                    background: darkMode ? '#23234a' : '#181829',
                    borderRadius: '14px',
                    boxShadow: '0 2px 24px rgba(0,0,0,0.15)'
                  }}>
                    <div className="card-body">
                      <ul className="list-group">
                        {filteredResults.map((result, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center" style={{
                            background: 'transparent',
                            color: '#fff',
                            border: 'none',
                            borderBottom: idx < filteredResults.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none'
                          }}>
                            <span>{result.assessmentTitle || result.examName || result.assessmentName}</span>
                            <span className="fw-bold">{result.score ?? result.Score}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
      <footer className="mt-auto py-3 w-100" style={{
        background: darkMode ? '#23234a' : '#f8f9fa',
        transition: 'all 0.3s ease'
      }}>
        <div className="container text-center">
          <span style={{ color: darkMode ? '#b3b3c2' : '#6c757d' }}>
            © {new Date().getFullYear()} EduSync by Yash Khandal
          </span>
        </div>
      </footer>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
    </div>
  );
};

export default StudentDashboard;
