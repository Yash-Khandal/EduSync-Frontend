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

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState('');
  const [showLoader, setShowLoader] = useState(true);

  // Dark mode state with persistence
  const [isDarkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('DARK_MODE');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('DARK_MODE', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setShowLoader(false);
        return;
      }
      try {
        const coursesResponse = await api.courses.getAll();
        const instructorCourses = (coursesResponse.data || []).filter(
          course => (course.instructorId || course.InstructorId) === user.id
        );
        setCourses(instructorCourses);

        const assessmentsResponse = await api.assessments.getAll();
        const instructorAssessments = (assessmentsResponse.data || []).filter(
          assessment => (assessment.instructorId || assessment.InstructorId) === user.id
        );
        setAssessments(instructorAssessments);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later. Thank You');
      } finally {
        setShowLoader(false);
      }
    };
    fetchData();
  }, [user]);

  // Custom Dark Mode Toggle Button
  const DarkModeToggle = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1200,
      background: isDarkMode ? '#23234a' : '#fff',
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
          transform: isDarkMode ? 'rotate(-20deg) scale(1.1)' : 'rotate(0deg) scale(1)',
          color: isDarkMode ? '#fbbf24' : '#f59e0b',
          fontSize: '1.2rem'
        }}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <i className="fas fa-moon"></i>
        ) : (
          <i className="fas fa-sun"></i>
        )}
      </button>
      <span style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: isDarkMode ? '#e1e1e6' : '#374151',
        userSelect: 'none'
      }}>
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
    </div>
  );

  return (
    <div className="container py-4 flex-grow-1 d-flex flex-column min-vh-100" style={{
      background: isDarkMode ? '#181829' : '#fff',
      transition: 'background 0.3s ease'
    }}>
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
          👋 Welcome, {user && user.name ? user.name : 'Instructor'}!
        </div>
        <div className="text-muted fs-5 animate__animated animate__fadeIn">
          {"Here's your Instructor dashboard overview."}
        </div>
      </div>

      {showLoader ? (
        <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
          <Loader />
          <p className="mt-3 fw-semibold text-primary fs-5">Loading your dashboard...</p>
        </div>
      ) : error ? (
        <div className="container mt-4 flex-grow-1">
          <div className="alert alert-danger" role="alert" style={{
            background: isDarkMode ? '#23234a' : '#f8d7da',
            color: isDarkMode ? '#e1e1e6' : '#721c24',
            border: isDarkMode ? '1px solid #444' : '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        </div>
      ) : (
        <div className="row justify-content-center g-4 mt-3">
          <div className="col-sm-10 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{
              borderRadius: '15px',
              background: isDarkMode ? '#23234a' : '#fff',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body d-flex align-items-center">
                <i className="fas fa-chalkboard-teacher fa-2x text-primary me-2"></i>
                <span className="fw-semibold" style={{ color: isDarkMode ? '#e1e1e6' : 'inherit' }}>
                  Courses Created
                </span>
                <span className="mx-2" style={{ color: isDarkMode ? '#e1e1e6' : 'inherit' }}>=</span>
                <span className="fw-bold fs-5 text-primary">{courses.length}</span>
              </div>
            </div>
          </div>
          <div className="col-sm-10 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 dashboard-card-hover" style={{
              borderRadius: '15px',
              background: isDarkMode ? '#23234a' : '#fff',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body d-flex align-items-center">
                <i className="fas fa-clipboard-list fa-2x text-success me-2"></i>
                <span className="fw-semibold" style={{ color: isDarkMode ? '#e1e1e6' : 'inherit' }}>
                  Assessments
                </span>
                <span className="mx-2" style={{ color: isDarkMode ? '#e1e1e6' : 'inherit' }}>=</span>
                <span className="fw-bold fs-5 text-success">{assessments.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-auto py-3 w-100" style={{
        background: isDarkMode ? '#23234a' : '#f8f9fa',
        transition: 'all 0.3s ease'
      }}>
        <div className="container text-center">
          <span style={{ color: isDarkMode ? '#b3b3c2' : '#6c757d' }}>
            © {new Date().getFullYear()} EduSync by Yash Khandal
          </span>
        </div>
      </footer>
      {/* Add animate.css and custom styles */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      <style>{`
        .dashboard-card-hover {
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .dashboard-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
        }
      `}</style>
    </div>
  );
};

export default InstructorDashboard;
